import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import {
	deploymentStatusValidator,
	trustLevelValidator,
} from "./lib/validators";

export const list = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("prompts"),
			_creationTime: v.number(),
			userId: v.id("users"),
			name: v.string(),
			currentVersionId: v.optional(v.id("promptVersions")),
			deploymentStatus: deploymentStatusValidator,
			trustLevel: trustLevelValidator,
			lastActivityAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		const user = await requireAuth(ctx);
		const prompts = await ctx.db
			.query("prompts")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();
		return prompts.map((p) => ({
			_id: p._id,
			_creationTime: p._creationTime,
			userId: p.userId,
			name: p.name,
			currentVersionId: p.currentVersionId,
			deploymentStatus: p.deploymentStatus,
			trustLevel: p.trustLevel,
			lastActivityAt: p.lastActivityAt,
		}));
	},
});

export const get = query({
	args: { promptId: v.id("prompts") },
	returns: v.union(
		v.object({
			_id: v.id("prompts"),
			_creationTime: v.number(),
			userId: v.id("users"),
			name: v.string(),
			currentVersionId: v.optional(v.id("promptVersions")),
			deploymentStatus: deploymentStatusValidator,
			trustLevel: trustLevelValidator,
			apiKey: v.optional(v.string()),
			lastActivityAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;
		return {
			_id: prompt._id,
			_creationTime: prompt._creationTime,
			userId: prompt.userId,
			name: prompt.name,
			currentVersionId: prompt.currentVersionId,
			deploymentStatus: prompt.deploymentStatus,
			trustLevel: prompt.trustLevel,
			apiKey: prompt.apiKey,
			lastActivityAt: prompt.lastActivityAt,
		};
	},
});

export const create = mutation({
	args: { name: v.string() },
	returns: v.id("prompts"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const now = Date.now();

		const promptId = await ctx.db.insert("prompts", {
			userId: user._id,
			name: args.name,
			deploymentStatus: "draft",
			trustLevel: "suggest_fixes",
			lastActivityAt: now,
		});

		const versionId = await ctx.db.insert("promptVersions", {
			promptId,
			versionNumber: 1,
			versionName: "Initial",
			promptText: "",
			source: "manual_checkpoint",
		});

		await ctx.db.patch(promptId, { currentVersionId: versionId });

		await ctx.db.insert("tuningSessions", {
			promptId,
		});

		return promptId;
	},
});

export const updateName = mutation({
	args: { promptId: v.id("prompts"), name: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;
		await ctx.db.patch(args.promptId, { name: args.name });
		return null;
	},
});

export const remove = mutation({
	args: { promptId: v.id("prompts") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		const signals = await ctx.db
			.query("signals")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		for (const s of signals) await ctx.db.delete(s._id);

		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		for (const t of testCases) await ctx.db.delete(t._id);

		const hardRules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		for (const r of hardRules) await ctx.db.delete(r._id);

		const softPrefs = await ctx.db
			.query("softPreferences")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		for (const p of softPrefs) await ctx.db.delete(p._id);

		const versions = await ctx.db
			.query("promptVersions")
			.withIndex("by_promptId_and_versionNumber", (q) =>
				q.eq("promptId", args.promptId),
			)
			.collect();
		for (const v of versions) await ctx.db.delete(v._id);

		const sessions = await ctx.db
			.query("tuningSessions")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		for (const s of sessions) await ctx.db.delete(s._id);

		const reviewItems = await ctx.db
			.query("reviewQueueItems")
			.withIndex("by_promptId_and_status", (q) =>
				q.eq("promptId", args.promptId),
			)
			.collect();
		for (const r of reviewItems) await ctx.db.delete(r._id);

		await ctx.db.delete(args.promptId);
		return null;
	},
});

export const getCurrentVersion = query({
	args: { promptId: v.id("prompts") },
	returns: v.union(
		v.object({
			_id: v.id("promptVersions"),
			_creationTime: v.number(),
			promptId: v.id("prompts"),
			versionNumber: v.number(),
			versionName: v.optional(v.string()),
			promptText: v.string(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;
		if (!prompt.currentVersionId) return null;

		const version = await ctx.db.get(prompt.currentVersionId);
		if (!version) return null;

		return {
			_id: version._id,
			_creationTime: version._creationTime,
			promptId: version.promptId,
			versionNumber: version.versionNumber,
			versionName: version.versionName,
			promptText: version.promptText,
		};
	},
});

export const getVersions = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("promptVersions"),
			_creationTime: v.number(),
			versionNumber: v.number(),
			versionName: v.optional(v.string()),
			source: v.string(),
			passRate: v.optional(v.number()),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const versions = await ctx.db
			.query("promptVersions")
			.withIndex("by_promptId_and_versionNumber", (q) =>
				q.eq("promptId", args.promptId),
			)
			.order("desc")
			.collect();

		return versions.map((v) => ({
			_id: v._id,
			_creationTime: v._creationTime,
			versionNumber: v.versionNumber,
			versionName: v.versionName,
			source: v.source,
			passRate: v.passRate,
		}));
	},
});

export const rollback = mutation({
	args: { promptId: v.id("prompts"), versionId: v.id("promptVersions") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		const version = await ctx.db.get(args.versionId);
		if (!version || version.promptId !== args.promptId) return null;

		await ctx.db.patch(args.promptId, {
			currentVersionId: args.versionId,
			lastActivityAt: Date.now(),
		});
		return null;
	},
});

export const updateTrustLevel = mutation({
	args: {
		promptId: v.id("prompts"),
		trustLevel: trustLevelValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.promptId, {
			trustLevel: args.trustLevel,
			lastActivityAt: Date.now(),
		});
		return null;
	},
});
