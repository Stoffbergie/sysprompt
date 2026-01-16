import { ConvexError } from "convex/values";
import { USER_NAME_MAX_LENGTH, USER_NAME_MIN_LENGTH } from "./constants";
import { ValidationError } from "./errors";

export { ValidationError };

export function validateUserName(name: string): string {
	const trimmed = name.trim();

	if (trimmed.length < USER_NAME_MIN_LENGTH) {
		throw new ConvexError({
			code: ValidationError.TEXT_TOO_SHORT,
			message: `Name must be at least ${USER_NAME_MIN_LENGTH} character`,
		});
	}

	if (trimmed.length > USER_NAME_MAX_LENGTH) {
		throw new ConvexError({
			code: ValidationError.TEXT_TOO_LONG,
			message: `Name must be ${USER_NAME_MAX_LENGTH} characters or less`,
		});
	}

	return trimmed;
}
