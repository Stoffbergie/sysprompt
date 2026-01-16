"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

type PromptState = {
	currentVersionId: Id<"promptVersions">;
	promptText: string;
	versionNumber: number;
	testCases: Array<{
		_id: Id<"testCases">;
		question: string;
		approvedResponse: string;
	}>;
	hardRules: Array<{
		type: string;
		value: string;
	}>;
} | null;

type OptimizationResult = {
	improved: boolean;
	newVersionId?: Id<"promptVersions">;
	bestScore: number;
	originalScore: number;
} | null;

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
					{
						role: "system",
						content: systemPrompt || "You are a helpful assistant.",
					},
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

function checkHardRules(
	response: string,
	hardRules: Array<{ type: string; value: string }>,
): boolean {
	for (const rule of hardRules) {
		if (rule.type === "phrase_ban") {
			if (response.toLowerCase().includes(rule.value.toLowerCase())) {
				return false;
			}
		} else if (rule.type === "phrase_require") {
			if (!response.toLowerCase().includes(rule.value.toLowerCase())) {
				return false;
			}
		}
	}
	return true;
}

function scoreResponse(generated: string, approved: string): number {
	const genWords = new Set(generated.toLowerCase().split(/\s+/));
	const appWords = new Set(approved.toLowerCase().split(/\s+/));

	let overlap = 0;
	for (const word of genWords) {
		if (appWords.has(word)) overlap++;
	}

	const similarity = overlap / Math.max(genWords.size, appWords.size);

	const lengthRatio =
		Math.min(generated.length, approved.length) /
		Math.max(generated.length, approved.length);

	return similarity * 0.7 + lengthRatio * 0.3;
}

async function generateVariation(
	currentPrompt: string,
	variationIndex: number,
): Promise<string> {
	const variations = [
		"Be more concise in your instructions",
		"Add more specific examples",
		"Use clearer language",
		"Reorganize for better flow",
		"Strengthen the constraints",
		"Make the tone more consistent",
		"Add edge case handling",
		"Simplify complex instructions",
		"Improve formatting clarity",
		"Balance brevity and detail",
	];

	const instruction = variations[variationIndex % variations.length];

	const optimizerPrompt = `You are a prompt engineer. Given a system prompt, create an improved variation based on this instruction: "${instruction}"

Original prompt:
${currentPrompt}

Provide ONLY the improved prompt text, no explanations.`;

	try {
		const improved = await callLLM(optimizerPrompt, "Generate improved prompt");
		return improved.trim();
	} catch {
		return currentPrompt;
	}
}

export const runOptimization = internalAction({
	args: {
		promptId: v.id("prompts"),
		maxVariations: v.optional(v.number()),
	},
	returns: v.union(
		v.object({
			improved: v.boolean(),
			newVersionId: v.optional(v.id("promptVersions")),
			bestScore: v.number(),
			originalScore: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args): Promise<OptimizationResult> => {
		const state: PromptState = await ctx.runQuery(
			internal.optimizerHelpers.getPromptState,
			{
				promptId: args.promptId,
			},
		);

		if (!state || state.testCases.length === 0) {
			return null;
		}

		const maxVariations = args.maxVariations ?? 5;

		let currentBestPrompt: string = state.promptText;
		let currentBestScore = 0;

		for (const testCase of state.testCases) {
			try {
				const response = await callLLM(currentBestPrompt, testCase.question);
				if (checkHardRules(response, state.hardRules)) {
					currentBestScore += scoreResponse(
						response,
						testCase.approvedResponse,
					);
				}
			} catch {}
		}

		currentBestScore = currentBestScore / state.testCases.length;
		const originalScore = currentBestScore;

		for (let i = 0; i < maxVariations; i++) {
			const variation = await generateVariation(currentBestPrompt, i);

			if (!variation || variation === currentBestPrompt) continue;

			let variationScore = 0;
			let validTests = 0;

			for (const testCase of state.testCases) {
				try {
					const response = await callLLM(variation, testCase.question);
					if (checkHardRules(response, state.hardRules)) {
						variationScore += scoreResponse(
							response,
							testCase.approvedResponse,
						);
						validTests++;
					}
				} catch {}
			}

			if (validTests === state.testCases.length) {
				const avgScore = variationScore / state.testCases.length;
				if (avgScore > currentBestScore) {
					currentBestPrompt = variation;
					currentBestScore = avgScore;
				}
			}
		}

		if (
			currentBestScore > originalScore &&
			currentBestPrompt !== state.promptText
		) {
			const newVersionId: Id<"promptVersions"> = await ctx.runMutation(
				internal.optimizerHelpers.saveOptimizedVersion,
				{
					promptId: args.promptId,
					promptText: currentBestPrompt,
					versionNumber: state.versionNumber + 1,
					passRate: currentBestScore * 100,
				},
			);

			const userId = await ctx.runQuery(internal.notifications.getOwner, {
				promptId: args.promptId,
			});

			if (userId) {
				const improvement = Math.round(
					(currentBestScore - originalScore) * 100,
				);
				await ctx.runMutation(internal.notifications.create, {
					userId,
					promptId: args.promptId,
					type: "optimization_complete",
					title: "Prompt Optimized",
					message: `Background optimization improved your prompt by ${improvement}% (score: ${Math.round(currentBestScore * 100)}%)`,
					versionId: newVersionId,
				});
			}

			return {
				improved: true,
				newVersionId,
				bestScore: currentBestScore,
				originalScore,
			};
		}

		return {
			improved: false,
			bestScore: currentBestScore,
			originalScore,
		};
	},
});

export const triggerOptimization = action({
	args: { promptId: v.id("prompts") },
	returns: v.null(),
	handler: async (ctx, args): Promise<null> => {
		await ctx.runAction(internal.optimizer.runOptimization, {
			promptId: args.promptId,
			maxVariations: 5,
		});
		return null;
	},
});
