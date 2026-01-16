import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	demoUserRoleValidator,
	demoUserStatusValidator,
	deploymentStatusValidator,
	feedbackRatingValidator,
	hardRuleTypeValidator,
	notificationTypeValidator,
	patternStatusValidator,
	preferenceDimensionValidator,
	reviewQueueItemStatusValidator,
	reviewQueueItemTypeValidator,
	ruleScopeValidator,
	signalTypeValidator,
	streamStatusValidator,
	testCaseSourceValidator,
	themeValidator,
	todoPriorityValidator,
	trustLevelValidator,
	userRoleValidator,
	versionSourceValidator,
} from "./lib/validators";

export default defineSchema({
	users: defineTable({
		email: v.string(),
		name: v.string(),
		workosUserId: v.string(),
		avatarUrl: v.optional(v.string()),
		role: userRoleValidator,
	})
		.index("by_email", ["email"])
		.index("by_workosUserId", ["workosUserId"]),

	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
		userId: v.optional(v.id("users")),
		dueDate: v.optional(v.number()),
		priority: v.optional(todoPriorityValidator),
		attachmentId: v.optional(v.id("_storage")),
	})
		.index("by_userId", ["userId"])
		.index("by_userId_and_completed", ["userId", "completed"])
		.index("by_userId_and_dueDate", ["userId", "dueDate"]),

	demoGrid: defineTable({
		row: v.number(),
		col: v.number(),
		checked: v.boolean(),
	}).index("by_position", ["row", "col"]),

	demoUsers: defineTable({
		name: v.string(),
		email: v.string(),
		role: demoUserRoleValidator,
		status: demoUserStatusValidator,
		department: v.optional(v.string()),
	})
		.index("by_name", ["name"])
		.index("by_email", ["email"])
		.index("by_role", ["role"])
		.index("by_status", ["status"])
		.searchIndex("search_name", { searchField: "name" })
		.searchIndex("search_email", { searchField: "email" }),

	userPreferences: defineTable({
		userId: v.id("users"),
		theme: v.optional(themeValidator),
		reducedMotion: v.optional(v.boolean()),
		compactMode: v.optional(v.boolean()),
		emailNotifications: v.optional(v.boolean()),
		pushNotifications: v.optional(v.boolean()),
		todoReminders: v.optional(v.boolean()),
		weeklyDigest: v.optional(v.boolean()),
		mentions: v.optional(v.boolean()),
		marketingEmails: v.optional(v.boolean()),
	}).index("by_userId", ["userId"]),

	prompts: defineTable({
		userId: v.id("users"),
		name: v.string(),
		currentVersionId: v.optional(v.id("promptVersions")),
		deploymentStatus: deploymentStatusValidator,
		trustLevel: trustLevelValidator,
		apiKey: v.optional(v.string()),
		lastActivityAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_apiKey", ["apiKey"]),

	promptVersions: defineTable({
		promptId: v.id("prompts"),
		versionNumber: v.number(),
		versionName: v.optional(v.string()),
		promptText: v.string(),
		source: versionSourceValidator,
		testSuiteSnapshot: v.optional(v.array(v.id("testCases"))),
		passRate: v.optional(v.number()),
	}).index("by_promptId_and_versionNumber", ["promptId", "versionNumber"]),

	signals: defineTable({
		promptId: v.id("prompts"),
		type: signalTypeValidator,
		question: v.string(),
		response: v.string(),
		details: v.any(),
	}).index("by_promptId", ["promptId"]),

	testCases: defineTable({
		promptId: v.id("prompts"),
		question: v.string(),
		approvedResponse: v.string(),
		source: testCaseSourceValidator,
		sourceSignalId: v.optional(v.id("signals")),
		sourcePatternId: v.optional(v.id("patterns")),
		hardRulesToCheck: v.array(v.id("hardRules")),
		softPreferencesToScore: v.array(v.id("softPreferences")),
	}).index("by_promptId", ["promptId"]),

	hardRules: defineTable({
		promptId: v.id("prompts"),
		type: hardRuleTypeValidator,
		value: v.string(),
		scope: ruleScopeValidator,
		condition: v.optional(v.string()),
		sourceSignalId: v.optional(v.id("signals")),
		active: v.boolean(),
	}).index("by_promptId", ["promptId"]),

	softPreferences: defineTable({
		promptId: v.id("prompts"),
		dimension: preferenceDimensionValidator,
		direction: v.string(),
		strength: v.number(),
		context: v.optional(v.string()),
		sourceSignalIds: v.array(v.id("signals")),
		confidence: v.number(),
	}).index("by_promptId", ["promptId"]),

	productionCalls: defineTable({
		promptId: v.id("prompts"),
		versionId: v.id("promptVersions"),
		input: v.string(),
		output: v.string(),
		latencyMs: v.number(),
		error: v.optional(v.string()),
		metadata: v.optional(v.any()),
	})
		.index("by_promptId", ["promptId"])
		.index("by_versionId", ["versionId"]),

	feedbacks: defineTable({
		productionCallId: v.id("productionCalls"),
		rating: feedbackRatingValidator,
		comment: v.optional(v.string()),
	}).index("by_productionCallId", ["productionCallId"]),

	patterns: defineTable({
		promptId: v.id("prompts"),
		description: v.string(),
		commonThread: v.string(),
		unhappyCallIds: v.array(v.id("productionCalls")),
		count: v.number(),
		percentage: v.number(),
		likelyCause: v.optional(v.string()),
		confidence: v.number(),
		status: patternStatusValidator,
		suggestedFix: v.optional(v.string()),
		resolutionVersionId: v.optional(v.id("promptVersions")),
	}).index("by_promptId_and_status", ["promptId", "status"]),

	reviewQueueItems: defineTable({
		promptId: v.id("prompts"),
		type: reviewQueueItemTypeValidator,
		contextQuestion: v.string(),
		optionA: v.string(),
		optionB: v.string(),
		reason: v.optional(v.string()),
		status: reviewQueueItemStatusValidator,
		resolution: v.optional(v.string()),
		resolvedAt: v.optional(v.number()),
	}).index("by_promptId_and_status", ["promptId", "status"]),

	tuningSessions: defineTable({
		promptId: v.id("prompts"),
		currentQuestion: v.optional(v.string()),
		currentResponse: v.optional(v.string()),
		pendingComparisonA: v.optional(v.string()),
		pendingComparisonB: v.optional(v.string()),
		lastCheckpointAt: v.optional(v.number()),
	}).index("by_promptId", ["promptId"]),

	notifications: defineTable({
		userId: v.id("users"),
		promptId: v.id("prompts"),
		type: notificationTypeValidator,
		title: v.string(),
		message: v.string(),
		versionId: v.optional(v.id("promptVersions")),
		patternId: v.optional(v.id("patterns")),
		read: v.boolean(),
	})
		.index("by_userId", ["userId"])
		.index("by_userId_and_read", ["userId", "read"]),

	streams: defineTable({
		status: streamStatusValidator,
		promptId: v.optional(v.id("prompts")),
		question: v.optional(v.string()),
		modifier: v.optional(v.union(v.literal("shorter"), v.literal("longer"))),
		feedback: v.optional(
			v.object({
				previousResponse: v.string(),
				feedbackText: v.string(),
			}),
		),
	}).index("by_status", ["status"]),

	chunks: defineTable({
		streamId: v.id("streams"),
		text: v.string(),
	}).index("by_streamId", ["streamId"]),
});
