import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { reviewQueueItemTypeValidator } from "./lib/validators";

export const getPendingItems = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("reviewQueueItems"),
			_creationTime: v.number(),
			type: reviewQueueItemTypeValidator,
			contextQuestion: v.string(),
			optionA: v.string(),
			optionB: v.string(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const items = await ctx.db
			.query("reviewQueueItems")
			.withIndex("by_promptId_and_status", (q) =>
				q.eq("promptId", args.promptId).eq("status", "pending"),
			)
			.collect();

		return items.map((item) => ({
			_id: item._id,
			_creationTime: item._creationTime,
			type: item.type,
			contextQuestion: item.contextQuestion,
			optionA: item.optionA,
			optionB: item.optionB,
		}));
	},
});

export const getPendingCount = query({
	args: { promptId: v.id("prompts") },
	returns: v.number(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return 0;

		const items = await ctx.db
			.query("reviewQueueItems")
			.withIndex("by_promptId_and_status", (q) =>
				q.eq("promptId", args.promptId).eq("status", "pending"),
			)
			.collect();

		return items.length;
	},
});

export const shouldShowReviewModal = query({
	args: { promptId: v.id("prompts") },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return false;

		const items = await ctx.db
			.query("reviewQueueItems")
			.withIndex("by_promptId_and_status", (q) =>
				q.eq("promptId", args.promptId).eq("status", "pending"),
			)
			.collect();

		if (items.length >= 5) return true;

		const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
		const oldItems = items.filter(
			(item) => item._creationTime < twentyMinutesAgo,
		);

		return oldItems.length > 0;
	},
});

export const resolve = mutation({
	args: {
		itemId: v.id("reviewQueueItems"),
		resolution: v.union(v.literal("a"), v.literal("b"), v.literal("skip")),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const item = await ctx.db.get(args.itemId);
		if (!item) return null;

		const prompt = await ctx.db.get(item.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.itemId, {
			status: args.resolution === "skip" ? "skipped" : "resolved",
			resolution: args.resolution === "skip" ? undefined : args.resolution,
			resolvedAt: Date.now(),
		});

		return null;
	},
});

export const addItem = mutation({
	args: {
		promptId: v.id("prompts"),
		type: reviewQueueItemTypeValidator,
		contextQuestion: v.string(),
		optionA: v.string(),
		optionB: v.string(),
		reason: v.optional(v.string()),
	},
	returns: v.id("reviewQueueItems"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id)
			throw new Error("Prompt not found");

		return await ctx.db.insert("reviewQueueItems", {
			promptId: args.promptId,
			type: args.type,
			contextQuestion: args.contextQuestion,
			optionA: args.optionA,
			optionB: args.optionB,
			reason: args.reason,
			status: "pending",
		});
	},
});
