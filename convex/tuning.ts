"use node";

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";

async function callLLM(
	systemPrompt: string,
	userMessage: string,
): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		return "Error: OPENROUTER_API_KEY not configured. Please add it to your Convex environment variables.";
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
		const error = await response.text();
		return `Error calling LLM: ${error}`;
	}

	const data = await response.json();
	return data.choices[0]?.message?.content ?? "No response generated.";
}

function buildSystemPrompt(
	basePrompt: string,
	hardRules: Array<{ type: string; value: string; scope: string }>,
	softPrefs: Array<{ dimension: string; direction: string; strength: number }>,
): string {
	let prompt = basePrompt || "";

	if (hardRules.length > 0) {
		const bans = hardRules.filter((r) => r.type === "phrase_ban");
		const requires = hardRules.filter((r) => r.type === "phrase_require");

		if (bans.length > 0) {
			prompt += "\n\nNEVER use these phrases:\n";
			prompt += bans.map((r) => `- "${r.value}"`).join("\n");
		}

		if (requires.length > 0) {
			prompt += "\n\nALWAYS include:\n";
			prompt += requires.map((r) => `- ${r.value}`).join("\n");
		}
	}

	if (softPrefs.length > 0) {
		prompt += "\n\nStyle preferences:\n";
		for (const pref of softPrefs) {
			if (pref.dimension === "length") {
				prompt +=
					pref.direction === "shorter"
						? "- Keep responses concise and brief.\n"
						: "- Provide thorough, detailed responses.\n";
			} else if (pref.dimension === "tone") {
				prompt += `- Use a ${pref.direction} tone.\n`;
			} else if (pref.dimension === "formality") {
				prompt +=
					pref.direction === "casual"
						? "- Use a casual, conversational style.\n"
						: "- Use a formal, professional style.\n";
			}
		}
	}

	return prompt;
}

export const generateResponse = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		modifier: v.optional(v.union(v.literal("shorter"), v.literal("longer"))),
	},
	returns: v.string(),
	handler: async (ctx, args): Promise<string> => {
		const basePrompt = await ctx.runQuery(internal.tuningHelpers.getPromptText, {
			promptId: args.promptId,
		});
		const hardRules = await ctx.runQuery(internal.tuningHelpers.getHardRules, {
			promptId: args.promptId,
		});
		const softPrefs = await ctx.runQuery(
			internal.tuningHelpers.getSoftPreferences,
			{
				promptId: args.promptId,
			},
		);

		let systemPrompt = buildSystemPrompt(basePrompt, hardRules, softPrefs);

		if (args.modifier === "shorter") {
			systemPrompt +=
				"\n\nIMPORTANT: Make this response SHORTER. Be more concise while keeping the key information.";
		} else if (args.modifier === "longer") {
			systemPrompt +=
				"\n\nIMPORTANT: Make this response LONGER. Add more detail, examples, and thorough explanation.";
		}

		const response = await callLLM(systemPrompt, args.question);

		const session = await ctx.runQuery(internal.tuningHelpers.getSession, {
			promptId: args.promptId,
		});
		if (session) {
			await ctx.runMutation(internal.tuningHelpers.updateSession, {
				sessionId: session._id,
				currentQuestion: args.question,
				currentResponse: response,
			});
		}

		return response;
	},
});

export const regenerateWithFeedback = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		previousResponse: v.string(),
		feedback: v.string(),
	},
	returns: v.string(),
	handler: async (ctx, args): Promise<string> => {
		await ctx.runMutation(internal.tuningHelpers.recordSignal, {
			promptId: args.promptId,
			type: "thumbs_down",
			question: args.question,
			response: args.previousResponse,
			details: { feedback: args.feedback },
		});

		const basePrompt = await ctx.runQuery(internal.tuningHelpers.getPromptText, {
			promptId: args.promptId,
		});
		const hardRules = await ctx.runQuery(internal.tuningHelpers.getHardRules, {
			promptId: args.promptId,
		});
		const softPrefs = await ctx.runQuery(
			internal.tuningHelpers.getSoftPreferences,
			{
				promptId: args.promptId,
			},
		);

		let systemPrompt = buildSystemPrompt(basePrompt, hardRules, softPrefs);
		systemPrompt += `\n\nIMPORTANT: The user rejected a previous response with this feedback: "${args.feedback}"\nMake sure to address this concern in your response.`;

		const response = await callLLM(systemPrompt, args.question);

		const session = await ctx.runQuery(internal.tuningHelpers.getSession, {
			promptId: args.promptId,
		});
		if (session) {
			await ctx.runMutation(internal.tuningHelpers.updateSession, {
				sessionId: session._id,
				currentResponse: response,
			});
		}

		return response;
	},
});

export const markSatisficed = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		response: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args): Promise<null> => {
		const signalId = await ctx.runMutation(internal.tuningHelpers.recordSignal, {
			promptId: args.promptId,
			type: "satisficed",
			question: args.question,
			response: args.response,
			details: {},
		});

		await ctx.runMutation(internal.tuningHelpers.createTestCase, {
			promptId: args.promptId,
			question: args.question,
			approvedResponse: args.response,
			sourceSignalId: signalId,
		});

		const session = await ctx.runQuery(internal.tuningHelpers.getSession, {
			promptId: args.promptId,
		});
		if (session) {
			await ctx.runMutation(internal.tuningHelpers.updateSession, {
				sessionId: session._id,
				currentQuestion: undefined,
				currentResponse: undefined,
			});
		}

		return null;
	},
});

export const recordLengthAdjust = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		previousResponse: v.string(),
		direction: v.union(v.literal("shorter"), v.literal("longer")),
	},
	returns: v.string(),
	handler: async (ctx, args): Promise<string> => {
		const newResponse = await ctx.runAction(api.tuning.generateResponse, {
			promptId: args.promptId,
			question: args.question,
			modifier: args.direction,
		});

		await ctx.runMutation(internal.tuningHelpers.recordSignal, {
			promptId: args.promptId,
			type: "length_adjust",
			question: args.question,
			response: args.previousResponse,
			details: {
				direction: args.direction,
				resultingResponse: newResponse,
			},
		});

		return newResponse;
	},
});

export const banPhrase = action({
	args: {
		promptId: v.id("prompts"),
		phrase: v.string(),
		question: v.string(),
		response: v.string(),
		condition: v.optional(v.string()),
	},
	returns: v.string(),
	handler: async (ctx, args): Promise<string> => {
		const signalId = await ctx.runMutation(internal.tuningHelpers.recordSignal, {
			promptId: args.promptId,
			type: "phrase_ban",
			question: args.question,
			response: args.response,
			details: {
				bannedPhrase: args.phrase,
				condition: args.condition,
			},
		});

		await ctx.runMutation(internal.tuningHelpers.addHardRule, {
			promptId: args.promptId,
			type: "phrase_ban",
			value: args.phrase,
			scope: args.condition ? "conditional" : "global",
			condition: args.condition,
			sourceSignalId: signalId,
		});

		const newResponse = await ctx.runAction(api.tuning.generateResponse, {
			promptId: args.promptId,
			question: args.question,
		});

		return newResponse;
	},
});

export const generateComparisonVariants = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		feedback: v.string(),
	},
	returns: v.object({
		variantA: v.string(),
		variantB: v.string(),
	}),
	handler: async (ctx, args): Promise<{ variantA: string; variantB: string }> => {
		const basePrompt = await ctx.runQuery(internal.tuningHelpers.getPromptText, {
			promptId: args.promptId,
		});
		const hardRules = await ctx.runQuery(internal.tuningHelpers.getHardRules, {
			promptId: args.promptId,
		});
		const softPrefs = await ctx.runQuery(
			internal.tuningHelpers.getSoftPreferences,
			{
				promptId: args.promptId,
			},
		);

		const systemPrompt = buildSystemPrompt(basePrompt, hardRules, softPrefs);

		const variantAPrompt = `${systemPrompt}\n\nUser feedback: "${args.feedback}"\nInterpret this feedback conservatively and adjust your response accordingly.`;
		const variantBPrompt = `${systemPrompt}\n\nUser feedback: "${args.feedback}"\nInterpret this feedback more liberally and make a more significant adjustment.`;

		const [variantA, variantB] = await Promise.all([
			callLLM(variantAPrompt, args.question),
			callLLM(variantBPrompt, args.question),
		]);

		const session = await ctx.runQuery(internal.tuningHelpers.getSession, {
			promptId: args.promptId,
		});
		if (session) {
			await ctx.runMutation(internal.tuningHelpers.updateSession, {
				sessionId: session._id,
				pendingComparisonA: variantA,
				pendingComparisonB: variantB,
			});
		}

		return { variantA, variantB };
	},
});

export const recordComparisonPick = action({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		variantA: v.string(),
		variantB: v.string(),
		winner: v.union(v.literal("a"), v.literal("b")),
		dimension: v.optional(v.string()),
	},
	returns: v.string(),
	handler: async (ctx, args): Promise<string> => {
		await ctx.runMutation(internal.tuningHelpers.recordSignal, {
			promptId: args.promptId,
			type: "comparison_pick",
			question: args.question,
			response: args.winner === "a" ? args.variantA : args.variantB,
			details: {
				variantA: args.variantA,
				variantB: args.variantB,
				winner: args.winner,
				dimension: args.dimension,
			},
		});

		const winningResponse = args.winner === "a" ? args.variantA : args.variantB;

		const session = await ctx.runQuery(internal.tuningHelpers.getSession, {
			promptId: args.promptId,
		});
		if (session) {
			await ctx.runMutation(internal.tuningHelpers.updateSession, {
				sessionId: session._id,
				currentResponse: winningResponse,
				pendingComparisonA: undefined,
				pendingComparisonB: undefined,
			});
		}

		return winningResponse;
	},
});
