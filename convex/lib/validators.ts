import { v } from "convex/values";

export const userRoleValidator = v.union(
	v.literal("admin"),
	v.literal("member"),
);

export const todoPriorityValidator = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
);

export const themeValidator = v.union(
	v.literal("light"),
	v.literal("dark"),
	v.literal("system"),
);

export const demoUserRoleValidator = v.union(
	v.literal("admin"),
	v.literal("moderator"),
	v.literal("user"),
);

export const demoUserStatusValidator = v.union(
	v.literal("active"),
	v.literal("inactive"),
	v.literal("pending"),
);

export const todoReturnValidator = v.object({
	_id: v.id("todos"),
	_creationTime: v.number(),
	text: v.string(),
	completed: v.boolean(),
	userId: v.optional(v.id("users")),
	dueDate: v.optional(v.number()),
	priority: v.optional(todoPriorityValidator),
	attachmentId: v.optional(v.id("_storage")),
	attachmentUrl: v.optional(v.string()),
});

export const userReturnValidator = v.object({
	_id: v.id("users"),
	_creationTime: v.number(),
	email: v.string(),
	name: v.string(),
	workosUserId: v.string(),
	avatarUrl: v.optional(v.string()),
	role: userRoleValidator,
});

export const preferencesReturnValidator = v.object({
	_id: v.id("userPreferences"),
	_creationTime: v.number(),
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
});

export const deploymentStatusValidator = v.union(
	v.literal("draft"),
	v.literal("deployed"),
	v.literal("paused"),
);

export const versionSourceValidator = v.union(
	v.literal("manual_checkpoint"),
	v.literal("auto_checkpoint"),
	v.literal("background_optimization"),
	v.literal("production_fix"),
	v.literal("auto_fix"),
);

export const signalTypeValidator = v.union(
	v.literal("length_adjust"),
	v.literal("thumbs_down"),
	v.literal("satisficed"),
	v.literal("phrase_ban"),
	v.literal("comparison_pick"),
	v.literal("feedback_text"),
);

export const hardRuleTypeValidator = v.union(
	v.literal("phrase_ban"),
	v.literal("phrase_require"),
	v.literal("pattern_ban"),
	v.literal("pattern_require"),
);

export const ruleScopeValidator = v.union(
	v.literal("global"),
	v.literal("conditional"),
);

export const preferenceDimensionValidator = v.union(
	v.literal("length"),
	v.literal("tone"),
	v.literal("formality"),
	v.literal("technical_depth"),
	v.literal("structure"),
);

export const testCaseSourceValidator = v.union(
	v.literal("tuning"),
	v.literal("production"),
);

export const feedbackRatingValidator = v.union(
	v.literal("up"),
	v.literal("down"),
);

export const patternStatusValidator = v.union(
	v.literal("detected"),
	v.literal("fixing"),
	v.literal("fixed"),
	v.literal("ignored"),
);

export const reviewQueueItemTypeValidator = v.union(
	v.literal("retroactive_improvement"),
	v.literal("conflict_resolution"),
);

export const reviewQueueItemStatusValidator = v.union(
	v.literal("pending"),
	v.literal("resolved"),
	v.literal("skipped"),
);

export const trustLevelValidator = v.union(
	v.literal("monitor_only"),
	v.literal("suggest_fixes"),
	v.literal("auto_fix_guardrailed"),
	v.literal("full_autopilot"),
);

export const notificationTypeValidator = v.union(
	v.literal("auto_fix_applied"),
	v.literal("pattern_detected"),
	v.literal("optimization_complete"),
	v.literal("test_regression"),
);

export const streamStatusValidator = v.union(
	v.literal("pending"),
	v.literal("streaming"),
	v.literal("done"),
	v.literal("error"),
	v.literal("timeout"),
);
