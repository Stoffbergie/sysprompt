import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

export function usePrompts() {
	const prompts = useQuery(api.prompts.list);
	const createPrompt = useMutation(api.prompts.create);
	const updateName = useMutation(api.prompts.updateName);
	const removePrompt = useMutation(api.prompts.remove);

	return {
		prompts,
		isLoading: prompts === undefined,
		createPrompt,
		updateName,
		removePrompt,
	};
}

export function usePrompt(promptId: Id<"prompts">) {
	const prompt = useQuery(api.prompts.get, { promptId });
	const currentVersion = useQuery(api.prompts.getCurrentVersion, { promptId });
	const versions = useQuery(api.prompts.getVersions, { promptId });
	const rollback = useMutation(api.prompts.rollback);

	return {
		prompt,
		currentVersion,
		versions,
		isLoading: prompt === undefined,
		rollback,
	};
}

export function useTuning(promptId: Id<"prompts">) {
	const createStream = useMutation(api.streams.createStream);
	const markSatisficed = useAction(api.tuning.markSatisficed);
	const banPhrase = useAction(api.tuning.banPhrase);
	const checkpoint = useAction(api.checkpoints.checkpoint);
	const generateComparisonVariants = useAction(
		api.tuning.generateComparisonVariants,
	);
	const recordComparisonPick = useAction(api.tuning.recordComparisonPick);

	const startStream = useCallback(
		async (
			question: string,
			opts?: {
				modifier?: "shorter" | "longer";
				feedback?: { previousResponse: string; feedbackText: string };
			},
		) => {
			const streamId = await createStream({
				promptId,
				question,
				modifier: opts?.modifier,
				feedback: opts?.feedback,
			});
			return streamId;
		},
		[promptId, createStream],
	);

	return {
		startStream,
		markSatisficed: (question: string, response: string) =>
			markSatisficed({ promptId, question, response }),
		banPhrase: (
			phrase: string,
			question: string,
			response: string,
			condition?: string,
		) => banPhrase({ promptId, phrase, question, response, condition }),
		checkpoint: (versionName?: string) => checkpoint({ promptId, versionName }),
		generateComparisonVariants: (question: string, feedback: string) =>
			generateComparisonVariants({ promptId, question, feedback }),
		recordComparisonPick: (
			question: string,
			variantA: string,
			variantB: string,
			winner: "a" | "b",
			dimension?: string,
		) =>
			recordComparisonPick({
				promptId,
				question,
				variantA,
				variantB,
				winner,
				dimension,
			}),
	};
}

export function useReviewQueue(promptId: Id<"prompts">) {
	const pendingItems = useQuery(api.reviewQueue.getPendingItems, { promptId });
	const pendingCount = useQuery(api.reviewQueue.getPendingCount, { promptId });
	const shouldShowModal = useQuery(api.reviewQueue.shouldShowReviewModal, {
		promptId,
	});
	const resolve = useMutation(api.reviewQueue.resolve);

	return {
		pendingItems,
		pendingCount: pendingCount ?? 0,
		shouldShowModal: shouldShowModal ?? false,
		resolve,
	};
}
