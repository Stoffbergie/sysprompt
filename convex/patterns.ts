"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

async function callLLM(
	systemPrompt: string,
	userMessage: string,
): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY not configured");
	}

	const response = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://sysprompt.app",
				"X-Title": "SysPrompt",
			},
			body: JSON.stringify({
				model: "anthropic/claude-sonnet-4",
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userMessage },
				],
				max_tokens: 2000,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`LLM call failed: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0]?.message?.content ?? "";
}

export const detectPatterns = internalAction({
	args: { promptId: v.id("prompts") },
	returns: v.number(),
	handler: async (ctx, args): Promise<number> => {
		const unhappyCalls = await ctx.runQuery(
			internal.patternsHelpers.getUnhappyCalls,
			{
				promptId: args.promptId,
			},
		);

		if (unhappyCalls.length < 5) {
			return 0;
		}

		const examples = unhappyCalls
			.slice(0, 20)
			.map(
				(c: { input: string; output: string; comment?: string }, i: number) =>
					`Example ${i + 1}:\nInput: ${c.input}\nOutput: ${c.output}\nFeedback: ${c.comment ?? "No comment"}`,
			)
			.join("\n\n");

		const analysisPrompt = `You are an AI analyzing patterns in user feedback. Given these examples of responses that received negative feedback, identify common patterns.

${examples}

Respond in JSON format with an array of patterns:
[
  {
    "description": "Brief description of the pattern",
    "commonThread": "What these examples have in common",
    "likelyCause": "Hypothesis for why this is happening",
    "suggestedFix": "How to fix this in the system prompt",
    "exampleIndices": [1, 3, 5],
    "confidence": 0.8
  }
]

Only include patterns that appear in at least 3 examples. Return empty array [] if no clear patterns found.`;

		try {
			const response = await callLLM(analysisPrompt, "Analyze patterns");

			const jsonMatch = response.match(/\[[\s\S]*\]/);
			if (!jsonMatch) return 0;

			const patterns = JSON.parse(jsonMatch[0]);

			let createdCount = 0;

			for (const pattern of patterns) {
				if (!pattern.description || !pattern.commonThread) continue;

				const exampleIndices = pattern.exampleIndices ?? [];
				const callIds = exampleIndices
					.filter((i: number) => i > 0 && i <= unhappyCalls.length)
					.map((i: number) => unhappyCalls[i - 1]._id);

				if (callIds.length < 3) continue;

				const patternId = await ctx.runMutation(
					internal.patternsHelpers.createPattern,
					{
						promptId: args.promptId,
						description: pattern.description,
						commonThread: pattern.commonThread,
						unhappyCallIds: callIds,
						count: callIds.length,
						percentage: (callIds.length / unhappyCalls.length) * 100,
						likelyCause: pattern.likelyCause,
						confidence: pattern.confidence ?? 0.5,
						suggestedFix: pattern.suggestedFix,
					},
				);

				const userId = await ctx.runQuery(internal.notifications.getOwner, {
					promptId: args.promptId,
				});

				if (userId) {
					await ctx.runMutation(internal.notifications.create, {
						userId,
						promptId: args.promptId,
						type: "pattern_detected",
						title: "Pattern Detected",
						message: `Found a pattern affecting ${callIds.length} responses: ${pattern.description}`,
						patternId,
					});
				}

				createdCount++;
			}

			return createdCount;
		} catch {
			return 0;
		}
	},
});

export const applyFix = action({
	args: { patternId: v.id("patterns") },
	returns: v.union(v.id("promptVersions"), v.null()),
	handler: async (ctx, args): Promise<Id<"promptVersions"> | null> => {
		const pattern = await ctx.runQuery(
			internal.patternsHelpers.getPatternInternal,
			{
				patternId: args.patternId,
			},
		);

		if (!pattern || !pattern.suggestedFix) return null;

		const versionId = await ctx.runAction(internal.patterns.applyFixInternal, {
			promptId: pattern.promptId,
			patternId: args.patternId,
			suggestedFix: pattern.suggestedFix,
		});

		return versionId;
	},
});

export const applyFixInternal = internalAction({
	args: {
		promptId: v.id("prompts"),
		patternId: v.id("patterns"),
		suggestedFix: v.string(),
	},
	returns: v.union(v.id("promptVersions"), v.null()),
	handler: async (ctx, args): Promise<Id<"promptVersions"> | null> => {
		const promptData = await ctx.runQuery(internal.checkpoints.getPromptData, {
			promptId: args.promptId,
		});

		if (!promptData) return null;

		const fixPrompt = `You are modifying a system prompt to fix an issue.

Current prompt:
${promptData.promptText}

Suggested fix:
${args.suggestedFix}

Apply this fix to the prompt. Return ONLY the new prompt text, no explanations.`;

		try {
			const newPromptText = await callLLM(fixPrompt, "Apply fix");

			const versionId = await ctx.runMutation(
				internal.checkpoints.createVersion,
				{
					promptId: args.promptId,
					versionNumber: promptData.currentVersionNumber + 1,
					versionName: "Pattern fix",
					promptText: newPromptText.trim(),
					source: "production_fix",
				},
			);

			await ctx.runMutation(internal.patternsHelpers.markPatternFixed, {
				patternId: args.patternId,
				resolutionVersionId: versionId,
			});

			const userId = await ctx.runQuery(internal.notifications.getOwner, {
				promptId: args.promptId,
			});

			if (userId) {
				await ctx.runMutation(internal.notifications.create, {
					userId,
					promptId: args.promptId,
					type: "auto_fix_applied",
					title: "Fix Applied",
					message: "A pattern fix has been applied to your prompt",
					versionId,
					patternId: args.patternId,
				});
			}

			return versionId;
		} catch {
			return null;
		}
	},
});

export const runPatternDetection = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx): Promise<null> => {
		const promptIds = await ctx.runQuery(
			internal.patternsHelpers.getDeployedPromptIds,
			{},
		);

		for (const promptId of promptIds) {
			try {
				await ctx.runAction(internal.patterns.detectPatterns, { promptId });
			} catch {}
		}

		return null;
	},
});
