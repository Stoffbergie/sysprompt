import type { Doc } from "../../convex/_generated/dataModel";

export type { Doc, Id } from "../../convex/_generated/dataModel";

export type User = Doc<"users">;
export type UserPreferences = Doc<"userPreferences">;

export type UserRole = User["role"];
export type Theme = NonNullable<UserPreferences["theme"]>;

export const DEFAULT_USER_PREFERENCES = {
	theme: "system" as const,
	reducedMotion: false,
	compactMode: false,
	emailNotifications: true,
	pushNotifications: false,
	weeklyDigest: true,
	mentions: true,
	marketingEmails: false,
} satisfies Omit<UserPreferences, "_id" | "_creationTime" | "userId">;
