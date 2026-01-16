import { v } from "convex/values";
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { notificationTypeValidator } from "./lib/validators";

export const list = query({
	args: { unreadOnly: v.optional(v.boolean()) },
	returns: v.array(
		v.object({
			_id: v.id("notifications"),
			_creationTime: v.number(),
			promptId: v.id("prompts"),
			type: notificationTypeValidator,
			title: v.string(),
			message: v.string(),
			versionId: v.optional(v.id("promptVersions")),
			patternId: v.optional(v.id("patterns")),
			read: v.boolean(),
			promptName: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);

		let notifications;
		if (args.unreadOnly) {
			notifications = await ctx.db
				.query("notifications")
				.withIndex("by_userId_and_read", (q) =>
					q.eq("userId", user._id).eq("read", false),
				)
				.order("desc")
				.take(50);
		} else {
			notifications = await ctx.db
				.query("notifications")
				.withIndex("by_userId", (q) => q.eq("userId", user._id))
				.order("desc")
				.take(50);
		}

		const results = [];
		for (const n of notifications) {
			const prompt = await ctx.db.get(n.promptId);
			results.push({
				_id: n._id,
				_creationTime: n._creationTime,
				promptId: n.promptId,
				type: n.type,
				title: n.title,
				message: n.message,
				versionId: n.versionId,
				patternId: n.patternId,
				read: n.read,
				promptName: prompt?.name,
			});
		}

		return results;
	},
});

export const getUnreadCount = query({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const user = await requireAuth(ctx);

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId_and_read", (q) =>
				q.eq("userId", user._id).eq("read", false),
			)
			.collect();

		return notifications.length;
	},
});

export const markRead = mutation({
	args: { notificationId: v.id("notifications") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const notification = await ctx.db.get(args.notificationId);
		if (!notification || notification.userId !== user._id) return null;

		await ctx.db.patch(args.notificationId, { read: true });
		return null;
	},
});

export const markAllRead = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const user = await requireAuth(ctx);

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_userId_and_read", (q) =>
				q.eq("userId", user._id).eq("read", false),
			)
			.collect();

		for (const n of unread) {
			await ctx.db.patch(n._id, { read: true });
		}

		return null;
	},
});

export const getPromptOwner = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.union(v.id("users"), v.null()),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		return prompt?.userId ?? null;
	},
});

export const create = internalMutation({
	args: {
		userId: v.id("users"),
		promptId: v.id("prompts"),
		type: notificationTypeValidator,
		title: v.string(),
		message: v.string(),
		versionId: v.optional(v.id("promptVersions")),
		patternId: v.optional(v.id("patterns")),
	},
	returns: v.id("notifications"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			userId: args.userId,
			promptId: args.promptId,
			type: args.type,
			title: args.title,
			message: args.message,
			versionId: args.versionId,
			patternId: args.patternId,
			read: false,
		});
	},
});

export { getPromptOwner as getOwner };
