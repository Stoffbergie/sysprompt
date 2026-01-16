import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import {
	hardRuleTypeValidator,
	ruleScopeValidator,
	signalTypeValidator,
} from "./lib/validators";

export const getSession = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.union(
		v.object({
			_id: v.id("tuningSessions"),
			promptId: v.id("prompts"),
			currentQuestion: v.optional(v.string()),
			currentResponse: v.optional(v.string()),
			pendingComparisonA: v.optional(v.string()),
			pendingComparisonB: v.optional(v.string()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const session = await ctx.db
			.query("tuningSessions")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.first();
		if (!session) return null;
		return {
			_id: session._id,
			promptId: session.promptId,
			currentQuestion: session.currentQuestion,
			currentResponse: session.currentResponse,
			pendingComparisonA: session.pendingComparisonA,
			pendingComparisonB: session.pendingComparisonB,
		};
	},
});

export const updateSession = internalMutation({
	args: {
		sessionId: v.id("tuningSessions"),
		currentQuestion: v.optional(v.string()),
		currentResponse: v.optional(v.string()),
		pendingComparisonA: v.optional(v.string()),
		pendingComparisonB: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { sessionId, ...updates } = args;
		await ctx.db.patch(sessionId, updates);
		return null;
	},
});

export const recordSignal = internalMutation({
	args: {
		promptId: v.id("prompts"),
		type: signalTypeValidator,
		question: v.string(),
		response: v.string(),
		details: v.any(),
	},
	returns: v.id("signals"),
	handler: async (ctx, args) => {
		const signalId = await ctx.db.insert("signals", {
			promptId: args.promptId,
			type: args.type,
			question: args.question,
			response: args.response,
			details: args.details,
		});
		await ctx.db.patch(args.promptId, { lastActivityAt: Date.now() });
		return signalId;
	},
});

export const createTestCase = internalMutation({
	args: {
		promptId: v.id("prompts"),
		question: v.string(),
		approvedResponse: v.string(),
		sourceSignalId: v.id("signals"),
	},
	returns: v.id("testCases"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("testCases", {
			promptId: args.promptId,
			question: args.question,
			approvedResponse: args.approvedResponse,
			source: "tuning",
			sourceSignalId: args.sourceSignalId,
			hardRulesToCheck: [],
			softPreferencesToScore: [],
		});
	},
});

export const addHardRule = internalMutation({
	args: {
		promptId: v.id("prompts"),
		type: hardRuleTypeValidator,
		value: v.string(),
		scope: ruleScopeValidator,
		condition: v.optional(v.string()),
		sourceSignalId: v.optional(v.id("signals")),
	},
	returns: v.id("hardRules"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("hardRules", {
			promptId: args.promptId,
			type: args.type,
			value: args.value,
			scope: args.scope,
			condition: args.condition,
			sourceSignalId: args.sourceSignalId,
			active: true,
		});
	},
});

export const getPromptText = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.string(),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || !prompt.currentVersionId) return "";
		const version = await ctx.db.get(prompt.currentVersionId);
		return version?.promptText ?? "";
	},
});

export const getHardRules = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			_id: v.id("hardRules"),
			type: hardRuleTypeValidator,
			value: v.string(),
			scope: ruleScopeValidator,
			condition: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		const rules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();
		return rules.map((r) => ({
			_id: r._id,
			type: r.type,
			value: r.value,
			scope: r.scope,
			condition: r.condition,
		}));
	},
});

export const getSoftPreferences = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.array(
		v.object({
			dimension: v.string(),
			direction: v.string(),
			strength: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const prefs = await ctx.db
			.query("softPreferences")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		return prefs.map((p) => ({
			dimension: p.dimension,
			direction: p.direction,
			strength: p.strength,
		}));
	},
});

export const getStreamingContext = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.object({
		promptText: v.string(),
		hardRules: v.array(
			v.object({
				type: hardRuleTypeValidator,
				value: v.string(),
				scope: ruleScopeValidator,
			}),
		),
		softPrefs: v.array(
			v.object({
				dimension: v.string(),
				direction: v.string(),
				strength: v.number(),
			}),
		),
	}),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		let promptText = "";
		if (prompt?.currentVersionId) {
			const version = await ctx.db.get(prompt.currentVersionId);
			promptText = version?.promptText ?? "";
		}

		const rules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();

		const prefs = await ctx.db
			.query("softPreferences")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		return {
			promptText,
			hardRules: rules.map((r) => ({
				type: r.type,
				value: r.value,
				scope: r.scope,
			})),
			softPrefs: prefs.map((p) => ({
				dimension: p.dimension,
				direction: p.direction,
				strength: p.strength,
			})),
		};
	},
});
