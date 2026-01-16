import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import {
	hardRuleTypeValidator,
	preferenceDimensionValidator,
	ruleScopeValidator,
} from "./lib/validators";

export const listHardRules = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("hardRules"),
			_creationTime: v.number(),
			type: hardRuleTypeValidator,
			value: v.string(),
			scope: ruleScopeValidator,
			condition: v.optional(v.string()),
			active: v.boolean(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const rules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		return rules.map((r) => ({
			_id: r._id,
			_creationTime: r._creationTime,
			type: r.type,
			value: r.value,
			scope: r.scope,
			condition: r.condition,
			active: r.active,
		}));
	},
});

export const listSoftPreferences = query({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("softPreferences"),
			_creationTime: v.number(),
			dimension: preferenceDimensionValidator,
			direction: v.string(),
			strength: v.number(),
			context: v.optional(v.string()),
			confidence: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) return [];

		const prefs = await ctx.db
			.query("softPreferences")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		return prefs.map((p) => ({
			_id: p._id,
			_creationTime: p._creationTime,
			dimension: p.dimension,
			direction: p.direction,
			strength: p.strength,
			context: p.context,
			confidence: p.confidence,
		}));
	},
});

export const toggleHardRule = mutation({
	args: { ruleId: v.id("hardRules") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return null;

		const prompt = await ctx.db.get(rule.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.ruleId, { active: !rule.active });
		return null;
	},
});

export const deleteHardRule = mutation({
	args: { ruleId: v.id("hardRules") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return null;

		const prompt = await ctx.db.get(rule.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.delete(args.ruleId);
		return null;
	},
});

export const updatePreferenceStrength = mutation({
	args: {
		preferenceId: v.id("softPreferences"),
		strength: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const pref = await ctx.db.get(args.preferenceId);
		if (!pref) return null;

		const prompt = await ctx.db.get(pref.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.patch(args.preferenceId, { strength: args.strength });
		return null;
	},
});

export const deleteSoftPreference = mutation({
	args: { preferenceId: v.id("softPreferences") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const pref = await ctx.db.get(args.preferenceId);
		if (!pref) return null;

		const prompt = await ctx.db.get(pref.promptId);
		if (!prompt || prompt.userId !== user._id) return null;

		await ctx.db.delete(args.preferenceId);
		return null;
	},
});

export const addHardRule = mutation({
	args: {
		promptId: v.id("prompts"),
		type: hardRuleTypeValidator,
		value: v.string(),
		scope: ruleScopeValidator,
		condition: v.optional(v.string()),
	},
	returns: v.id("hardRules"),
	handler: async (ctx, args) => {
		const user = await requireAuth(ctx);
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || prompt.userId !== user._id) {
			throw new Error("Prompt not found");
		}

		return await ctx.db.insert("hardRules", {
			promptId: args.promptId,
			type: args.type,
			value: args.value,
			scope: args.scope,
			condition: args.condition,
			active: true,
		});
	},
});
