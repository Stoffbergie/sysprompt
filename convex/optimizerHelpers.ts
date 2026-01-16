import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getPromptState = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.union(
		v.object({
			currentVersionId: v.id("promptVersions"),
			promptText: v.string(),
			versionNumber: v.number(),
			testCases: v.array(
				v.object({
					_id: v.id("testCases"),
					question: v.string(),
					approvedResponse: v.string(),
				}),
			),
			hardRules: v.array(
				v.object({
					type: v.string(),
					value: v.string(),
				}),
			),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt || !prompt.currentVersionId) return null;

		const version = await ctx.db.get(prompt.currentVersionId);
		if (!version) return null;

		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		const hardRules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();

		return {
			currentVersionId: prompt.currentVersionId,
			promptText: version.promptText,
			versionNumber: version.versionNumber,
			testCases: testCases.map((tc) => ({
				_id: tc._id,
				question: tc.question,
				approvedResponse: tc.approvedResponse,
			})),
			hardRules: hardRules.map((r) => ({
				type: r.type,
				value: r.value,
			})),
		};
	},
});

export const saveOptimizedVersion = internalMutation({
	args: {
		promptId: v.id("prompts"),
		promptText: v.string(),
		versionNumber: v.number(),
		passRate: v.number(),
	},
	returns: v.id("promptVersions"),
	handler: async (ctx, args) => {
		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		const versionId = await ctx.db.insert("promptVersions", {
			promptId: args.promptId,
			versionNumber: args.versionNumber,
			versionName: `Optimized v${args.versionNumber}`,
			promptText: args.promptText,
			source: "background_optimization",
			testSuiteSnapshot: testCases.map((tc) => tc._id),
			passRate: args.passRate,
		});

		await ctx.db.patch(args.promptId, {
			currentVersionId: versionId,
			lastActivityAt: Date.now(),
		});

		return versionId;
	},
});
