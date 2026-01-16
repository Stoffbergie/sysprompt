import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import { versionSourceValidator } from "./lib/validators";

type PromptData = {
	currentVersionId?: Id<"promptVersions">;
	currentVersionNumber: number;
	promptText: string;
} | null;

const getPromptData = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.union(
		v.object({
			currentVersionId: v.optional(v.id("promptVersions")),
			currentVersionNumber: v.number(),
			promptText: v.string(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt) return null;

		let promptText = "";
		let currentVersionNumber = 0;

		if (prompt.currentVersionId) {
			const version = await ctx.db.get(prompt.currentVersionId);
			if (version) {
				promptText = version.promptText;
				currentVersionNumber = version.versionNumber;
			}
		}

		return {
			currentVersionId: prompt.currentVersionId,
			currentVersionNumber,
			promptText,
		};
	},
});

const getTestCaseIds = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.array(v.id("testCases")),
	handler: async (ctx, args) => {
		const testCases = await ctx.db
			.query("testCases")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();
		return testCases.map((tc) => tc._id);
	},
});

export const createVersion = internalMutation({
	args: {
		promptId: v.id("prompts"),
		versionNumber: v.number(),
		versionName: v.optional(v.string()),
		promptText: v.string(),
		source: versionSourceValidator,
		testSuiteSnapshot: v.optional(v.array(v.id("testCases"))),
		passRate: v.optional(v.number()),
	},
	returns: v.id("promptVersions"),
	handler: async (ctx, args) => {
		const versionId = await ctx.db.insert("promptVersions", {
			promptId: args.promptId,
			versionNumber: args.versionNumber,
			versionName: args.versionName,
			promptText: args.promptText,
			source: args.source,
			testSuiteSnapshot: args.testSuiteSnapshot,
			passRate: args.passRate,
		});

		await ctx.db.patch(args.promptId, {
			currentVersionId: versionId,
			lastActivityAt: Date.now(),
		});

		return versionId;
	},
});

export const updateSessionCheckpoint = internalMutation({
	args: { promptId: v.id("prompts") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const session = await ctx.db
			.query("tuningSessions")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.first();
		if (session) {
			await ctx.db.patch(session._id, { lastCheckpointAt: Date.now() });
		}
		return null;
	},
});

export const generatePromptFromRules = internalQuery({
	args: { promptId: v.id("prompts") },
	returns: v.string(),
	handler: async (ctx, args) => {
		const prompt = await ctx.db.get(args.promptId);
		if (!prompt) return "";

		const hardRules = await ctx.db
			.query("hardRules")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.filter((q) => q.eq(q.field("active"), true))
			.collect();

		const softPrefs = await ctx.db
			.query("softPreferences")
			.withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
			.collect();

		let basePrompt = "";
		if (prompt.currentVersionId) {
			const version = await ctx.db.get(prompt.currentVersionId);
			basePrompt = version?.promptText ?? "";
		}

		let generated = basePrompt;

		const bans = hardRules.filter((r) => r.type === "phrase_ban");
		const requires = hardRules.filter((r) => r.type === "phrase_require");

		if (bans.length > 0) {
			generated += "\n\n## Phrases to Avoid\nNEVER use these phrases:\n";
			generated += bans.map((r) => `- "${r.value}"`).join("\n");
		}

		if (requires.length > 0) {
			generated += "\n\n## Required Elements\nALWAYS include:\n";
			generated += requires.map((r) => `- ${r.value}`).join("\n");
		}

		if (softPrefs.length > 0) {
			generated += "\n\n## Style Guidelines\n";
			for (const pref of softPrefs) {
				if (pref.dimension === "length") {
					generated +=
						pref.direction === "shorter"
							? "- Keep responses concise and to the point.\n"
							: "- Provide comprehensive, detailed responses.\n";
				} else if (pref.dimension === "tone") {
					generated += `- Use a ${pref.direction} tone.\n`;
				} else if (pref.dimension === "formality") {
					generated +=
						pref.direction === "casual"
							? "- Use a casual, approachable style.\n"
							: "- Use a formal, professional style.\n";
				} else if (pref.dimension === "technical_depth") {
					generated +=
						pref.direction === "more"
							? "- Include technical details and specifics.\n"
							: "- Keep explanations simple and accessible.\n";
				}
			}
		}

		return generated;
	},
});

export const checkpoint = action({
	args: {
		promptId: v.id("prompts"),
		versionName: v.optional(v.string()),
	},
	returns: v.id("promptVersions"),
	handler: async (ctx, args): Promise<Id<"promptVersions">> => {
		const promptData: PromptData = await ctx.runQuery(internal.checkpoints.getPromptData, {
			promptId: args.promptId,
		});
		if (!promptData) throw new Error("Prompt not found");

		const generatedPrompt: string = await ctx.runQuery(
			internal.checkpoints.generatePromptFromRules,
			{ promptId: args.promptId },
		);

		const testCaseIds: Id<"testCases">[] = await ctx.runQuery(
			internal.checkpoints.getTestCaseIds,
			{
				promptId: args.promptId,
			},
		);

		const versionId: Id<"promptVersions"> = await ctx.runMutation(
			internal.checkpoints.createVersion,
			{
				promptId: args.promptId,
				versionNumber: promptData.currentVersionNumber + 1,
				versionName:
					args.versionName ?? `v${promptData.currentVersionNumber + 1}`,
				promptText: generatedPrompt || promptData.promptText,
				source: "manual_checkpoint",
				testSuiteSnapshot: testCaseIds,
			},
		);

		await ctx.runMutation(internal.checkpoints.updateSessionCheckpoint, {
			promptId: args.promptId,
		});

		return versionId;
	},
});

export const getActiveSessionsForAutoCheckpoint = internalQuery({
	args: {},
	returns: v.array(v.id("prompts")),
	handler: async (ctx) => {
		const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

		const sessions = await ctx.db.query("tuningSessions").collect();

		const promptIds: Array<(typeof sessions)[0]["promptId"]> = [];

		for (const session of sessions) {
			const lastCheckpoint = session.lastCheckpointAt ?? 0;
			if (lastCheckpoint < thirtyMinutesAgo) {
				const prompt = await ctx.db.get(session.promptId);
				if (prompt && prompt.lastActivityAt > lastCheckpoint) {
					promptIds.push(session.promptId);
				}
			}
		}

		return promptIds;
	},
});

export const runAutoCheckpoints = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx): Promise<null> => {
		const promptIds = await ctx.runQuery(
			internal.checkpoints.getActiveSessionsForAutoCheckpoint,
			{},
		);

		for (const promptId of promptIds) {
			try {
				const promptData = await ctx.runQuery(
					internal.checkpoints.getPromptData,
					{ promptId },
				);
				if (!promptData) continue;

				const generatedPrompt = await ctx.runQuery(
					internal.checkpoints.generatePromptFromRules,
					{ promptId },
				);

				const testCaseIds = await ctx.runQuery(
					internal.checkpoints.getTestCaseIds,
					{ promptId },
				);

				await ctx.runMutation(internal.checkpoints.createVersion, {
					promptId,
					versionNumber: promptData.currentVersionNumber + 1,
					versionName: `Auto-save ${new Date().toLocaleString()}`,
					promptText: generatedPrompt || promptData.promptText,
					source: "auto_checkpoint",
					testSuiteSnapshot: testCaseIds,
				});

				await ctx.runMutation(internal.checkpoints.updateSessionCheckpoint, {
					promptId,
				});

				await ctx.runAction(internal.optimizer.runOptimization, {
					promptId,
					maxVariations: 3,
				});
			} catch {}
		}

		return null;
	},
});

export { getPromptData, getTestCaseIds };
