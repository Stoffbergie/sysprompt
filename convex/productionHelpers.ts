import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { feedbackRatingValidator } from "./lib/validators";

export const getPromptByApiKey = internalQuery({
	args: { apiKey: v.string() },
	returns: v.union(
		v.object({
			promptId: v.id("prompts"),
			versionId: v.id("promptVersions"),
			promptText: v.string(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const prompt = await ctx.db
			.query("prompts")
			.withIndex("by_apiKey", (q) => q.eq("apiKey", args.apiKey))
			.first();

		if (!prompt || !prompt.currentVersionId) return null;

		const version = await ctx.db.get(prompt.currentVersionId);
		if (!version) return null;

		return {
			promptId: prompt._id,
			versionId: version._id,
			promptText: version.promptText,
		};
	},
});

export const logCall = internalMutation({
	args: {
		promptId: v.id("prompts"),
		versionId: v.id("promptVersions"),
		input: v.string(),
		output: v.string(),
		latencyMs: v.number(),
		error: v.optional(v.string()),
	},
	returns: v.id("productionCalls"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("productionCalls", {
			promptId: args.promptId,
			versionId: args.versionId,
			input: args.input,
			output: args.output,
			latencyMs: args.latencyMs,
			error: args.error,
		});
	},
});

export const recordFeedback = internalMutation({
	args: {
		callId: v.string(),
		rating: feedbackRatingValidator,
		comment: v.optional(v.string()),
	},
	returns: v.id("feedbacks"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("feedbacks", {
			productionCallId: args.callId as Id<"productionCalls">,
			rating: args.rating,
			comment: args.comment,
		});
	},
});

export const deploy = mutation({
	args: { promptId: v.id("prompts") },
	returns: v.object({
		apiKey: v.string(),
		endpoint: v.string(),
	}),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) {
			throw new Error("Prompt not found");
		}

		let apiKey = prompt.apiKey;
		if (!apiKey) {
			apiKey = `sk-sp-${crypto.randomUUID().replace(/-/g, "")}`;
		}

		await ctx.db.patch(args.promptId, {
			deploymentStatus: "deployed",
			apiKey,
			lastActivityAt: Date.now(),
		});

		const convexUrl =
			process.env.CONVEX_SITE_URL ?? "https://your-deployment.convex.site";

		return {
			apiKey,
			endpoint: `${convexUrl}/api/v1/chat/completions`,
		};
	},
});

export const pause = mutation({
	args: { promptId: v.id("prompts") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.promptId, {
			deploymentStatus: "paused",
			lastActivityAt: Date.now(),
		});

		return null;
	},
});

export const getMetrics = query({
	args: { promptId: v.id("prompts") },
	returns: v.object({
		totalCalls: v.number(),
		callsToday: v.number(),
		feedbackRate: v.number(),
		helpfulRate: v.number(),
	}),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) {
			return { totalCalls: 0, callsToday: 0, feedbackRate: 0, helpfulRate: 0 };
		}

		const calls = await ctx.db
			.query("productionCalls")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		const totalCalls = calls.length;

		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const callsToday = calls.filter(
			(c) => c._creationTime >= todayStart.getTime(),
		).length;

		let feedbackCount = 0;
		let helpfulCount = 0;

		for (const call of calls) {
			const feedback = await ctx.db
				.query("feedbacks")
				.withIndex("by_productionCallId", (q) =>
					q.eq("productionCallId", call._id),
				)
				.first();

			if (feedback) {
				feedbackCount++;
				if (feedback.rating === "up") helpfulCount++;
			}
		}

		return {
			totalCalls,
			callsToday,
			feedbackRate: totalCalls > 0 ? (feedbackCount / totalCalls) * 100 : 0,
			helpfulRate: feedbackCount > 0 ? (helpfulCount / feedbackCount) * 100 : 0,
		};
	},
});

export const getRecentUnhappy = query({
	args: { promptId: v.id("prompts"), limit: v.optional(v.number()) },
	returns: v.array(
		v.object({
			_id: v.id("productionCalls"),
			_creationTime: v.number(),
			input: v.string(),
			output: v.string(),
			comment: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const feedbacks = await ctx.db
			.query("feedbacks")
			.filter((q) => q.eq(q.field("rating"), "down"))
			.order("desc")
			.take(args.limit ?? 20);

		const unhappy: Array<{
			_id: Id<"productionCalls">;
			_creationTime: number;
			input: string;
			output: string;
			comment?: string;
		}> = [];

		for (const feedback of feedbacks) {
			const call = await ctx.db.get(feedback.productionCallId);
			if (call && call.promptId === args.promptId) {
				unhappy.push({
					_id: call._id,
					_creationTime: call._creationTime,
					input: call.input,
					output: call.output,
					comment: feedback.comment,
				});
			}
		}

		return unhappy;
	},
});
