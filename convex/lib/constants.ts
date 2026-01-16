export const USER_NAME_MAX_LENGTH = 100;

export const USER_NAME_MIN_LENGTH = 1;

export const EMAIL_MAX_LENGTH = 255;

export const DEFAULT_PAGE_SIZE = 10;

export const MAX_PAGE_SIZE = 100;

export const DEFAULT_PREFERENCES = {
	theme: "system" as const,
	reducedMotion: false,
	compactMode: false,
	emailNotifications: true,
	pushNotifications: false,
	weeklyDigest: true,
	mentions: true,
	marketingEmails: false,
};
