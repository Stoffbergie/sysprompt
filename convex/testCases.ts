import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { testCaseSourceValidator } from "./lib/validators";

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

export const list = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("testCases"),
			_creationTime: v.number(),
			question: v.string(),
			approvedResponse: v.string(),
			source: testCaseSourceValidator,
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.order("desc")
			.collect();

		return testCases.map((tc) => ({
			_id: tc._id,
			_creationTime: tc._creationTime,
			question: tc.question,
			approvedResponse: tc.approvedResponse,
			source: tc.source,
		}));
	},
});

export const get = query({
	args: { testCaseId: v.id("testCases") },
	returns: v.union(
		v.object({
			_id: v.id("testCases"),
			_creationTime: v.number(),
			question: v.string(),
			approvedResponse: v.string(),
			source: testCaseSourceValidator,
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const testCase = await ctx.db.get(args.testCaseId);
		if (!testCase) return null;

		const prompt = await ctx.db.get(testCase.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		return {
			_id: testCase._id,
			_creationTime: testCase._creationTime,
			question: testCase.question,
			approvedResponse: testCase.approvedResponse,
			source: testCase.source,
		};
	},
});

export const remove = mutation({
	args: { testCaseId: v.id("testCases") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const testCase = await ctx.db.get(args.testCaseId);
		if (!testCase) return null;

		const prompt = await ctx.db.get(testCase.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.delete(args.testCaseId);
		return null;
	},
});

export const getCount = query({
	args: { promptId: v.id("prompts") },
	returns: v.number(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return 0;

		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		return testCases.length;
	},
});

export const runTests = action({
	args: { promptId: v.id("prompts") },
	returns: v.object({
		total: v.number(),
		passed: v.number(),
		failed: v.number(),
		results: v.array(
			v.object({
				testCaseId: v.id("testCases"),
				question: v.string(),
				expectedResponse: v.string(),
				actualResponse: v.string(),
				passed: v.boolean(),
				score: v.number(),
			}),
		),
	}),
	handler: async (ctx, args) => {
		const state: PromptState = await ctx.runQuery(internal.optimizerHelpers.getPromptState, {
			promptId: args.promptId,
		});

		if (!state || state.testCases.length === 0) {
			return { total: 0, passed: 0, failed: 0, results: [] };
		}

		const results: Array<{
			testCaseId: Id<"testCases">;
			question: string;
			expectedResponse: string;
			actualResponse: string;
			passed: boolean;
			score: number;
		}> = [];

		for (const testCase of state.testCases) {
			try {
				const response = await ctx.runAction(internal.production.proxyRequest, {
					promptId: args.promptId,
					versionId: state.currentVersionId,
					systemPrompt: state.promptText,
					userMessage: testCase.question,
					model: "gpt-4o-mini",
				});

				const score = calculateSimilarity(response, testCase.approvedResponse);
				const rulesPass = checkHardRules(response, state.hardRules);
				const passed = rulesPass && score >= 0.5;

				results.push({
					testCaseId: testCase._id,
					question: testCase.question,
					expectedResponse: testCase.approvedResponse,
					actualResponse: response,
					passed,
					score,
				});
			} catch {
				results.push({
					testCaseId: testCase._id,
					question: testCase.question,
					expectedResponse: testCase.approvedResponse,
					actualResponse: "Error generating response",
					passed: false,
					score: 0,
				});
			}
		}

		const passed = results.filter((r) => r.passed).length;
		return {
			total: results.length,
			passed,
			failed: results.length - passed,
			results,
		};
	},
});

function calculateSimilarity(generated: string, approved: string): number {
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
