import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { patternStatusValidator } from "./lib/validators";

export const getUnhappyCalls = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("productionCalls"),
			input: v.string(),
			output: v.string(),
			comment: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const feedbacks = await ctx.db
			.query("feedbacks")
			.filter((q) => q.eq(q.field("rating"), "down"))
			.collect();

		const unhappy: Array<{
			_id: Id<"productionCalls">;
			input: string;
			output: string;
			comment?: string;
		}> = [];

		for (const feedback of feedbacks) {
			const call = await ctx.db.get(feedback.productionCallId);
			if (call && call.promptId === args.promptId) {
				unhappy.push({
					_id: call._id,
					input: call.input,
					output: call.output,
					comment: feedback.comment,
				});
			}
		}

		return unhappy;
	},
});

export const createPattern = internalMutation({
	args: {
		promptId: v.id("prompts"),
		description: v.string(),
		commonThread: v.string(),
		unhappyCallIds: v.array(v.id("productionCalls")),
		count: v.number(),
		percentage: v.number(),
		likelyCause: v.optional(v.string()),
		confidence: v.number(),
		suggestedFix: v.optional(v.string()),
	},
	returns: v.id("patterns"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("patterns", {
			promptId: args.promptId,
			description: args.description,
			commonThread: args.commonThread,
			unhappyCallIds: args.unhappyCallIds,
			count: args.count,
			percentage: args.percentage,
			likelyCause: args.likelyCause,
			confidence: args.confidence,
			status: "detected",
			suggestedFix: args.suggestedFix,
		});
	},
});

export const list = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("patterns"),
			_creationTime: v.number(),
			description: v.string(),
			commonThread: v.string(),
			count: v.number(),
			percentage: v.number(),
			likelyCause: v.optional(v.string()),
			confidence: v.number(),
			status: patternStatusValidator,
			suggestedFix: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const patterns = await ctx.db
			.query("patterns")
			.withIndex("by_promptId_and_status", (q) =>
				q.eq("promptId", args.promptId),
			)
			.order("desc")
			.collect();

		return patterns.map((p) => ({
			_id: p._id,
			_creationTime: p._creationTime,
			description: p.description,
			commonThread: p.commonThread,
			count: p.count,
			percentage: p.percentage,
			likelyCause: p.likelyCause,
			confidence: p.confidence,
			status: p.status,
			suggestedFix: p.suggestedFix,
		}));
	},
});

export const get = query({
	args: { patternId: v.id("patterns") },
	returns: v.union(
		v.object({
			_id: v.id("patterns"),
			_creationTime: v.number(),
			description: v.string(),
			commonThread: v.string(),
			count: v.number(),
			percentage: v.number(),
			likelyCause: v.optional(v.string()),
			confidence: v.number(),
			status: patternStatusValidator,
			suggestedFix: v.optional(v.string()),
			examples: v.array(
				v.object({
					input: v.string(),
					output: v.string(),
				}),
			),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const pattern = await ctx.db.get(args.patternId);
		if (!pattern) return null;

		const prompt = await ctx.db.get(pattern.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		const examples: Array<{ input: string; output: string }> = [];
		for (const callId of pattern.unhappyCallIds.slice(0, 5)) {
			const call = await ctx.db.get(callId);
			if (call) {
				examples.push({ input: call.input, output: call.output });
			}
		}

		return {
			_id: pattern._id,
			_creationTime: pattern._creationTime,
			description: pattern.description,
			commonThread: pattern.commonThread,
			count: pattern.count,
			percentage: pattern.percentage,
			likelyCause: pattern.likelyCause,
			confidence: pattern.confidence,
			status: pattern.status,
			suggestedFix: pattern.suggestedFix,
			examples,
		};
	},
});

export const updateStatus = mutation({
	args: {
		patternId: v.id("patterns"),
		status: patternStatusValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const pattern = await ctx.db.get(args.patternId);
		if (!pattern) return null;

		const prompt = await ctx.db.get(pattern.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.patternId, { status: args.status });
		return null;
	},
});

export const getPatternInternal = internalQuery({
	args: { patternId: v.id("patterns") },
	returns: v.union(
		v.object({
			promptId: v.id("prompts"),
			suggestedFix: v.optional(v.string()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const pattern = await ctx.db.get(args.patternId);
		if (!pattern) return null;
		return {
			promptId: pattern.promptId,
			suggestedFix: pattern.suggestedFix,
		};
	},
});

export const markPatternFixed = internalMutation({
	args: {
		patternId: v.id("patterns"),
		resolutionVersionId: v.id("promptVersions"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.patternId, {
			status: "fixed",
			resolutionVersionId: args.resolutionVersionId,
		});
		return null;
	},
});

export const getDeployedPromptIds = internalQuery({
	args: {},
	returns: v.array(v.id("prompts")),
	handler: async (ctx) => {
		const prompts = await ctx.db
			.query("prompts")
			.filter((q) => q.eq(q.field("deploymentStatus"), "deployed"))
			.collect();
		return prompts.map((p) => p._id);
	},
});
