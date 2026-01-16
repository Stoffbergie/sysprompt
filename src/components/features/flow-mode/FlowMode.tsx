import type { Id } from "convex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useReviewQueue, useStream, useTuning } from "@/shared";
import { ComparisonView } from "./ComparisonView";
import { FeedbackInput } from "./FeedbackInput";
import { QuestionInput } from "./QuestionInput";
import { ResponseDisplay } from "./ResponseDisplay";
import { ReviewQueueModal } from "./ReviewQueueModal";

interface FlowModeProps {
	promptId: Id<"prompts">;
}

type FlowState = "idle" | "streaming" | "displaying" | "feedback" | "comparison";

function getStreamUrl(): string {
	const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
	return `${convexUrl.replace(".cloud", ".site")}/api/stream/generate`;
}

export function FlowMode({ promptId }: FlowModeProps) {
	const [flowState, setFlowState] = useState<FlowState>("idle");
	const [currentQuestion, setCurrentQuestion] = useState("");
	const [finalResponse, setFinalResponse] = useState("");
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [comparisonVariants, setComparisonVariants] = useState<{
		variantA: string;
		variantB: string;
	} | null>(null);
	const [streamId, setStreamId] = useState<Id<"streams"> | undefined>();

	const streamUrl = useMemo(() => getStreamUrl(), []);
	const shouldDriveStream = flowState === "streaming" && !!streamId;

	const streamBody = useStream(streamUrl, shouldDriveStream, streamId);

	useEffect(() => {
		if (streamBody.status === "done" && flowState === "streaming") {
			setFinalResponse(streamBody.text);
			setFlowState("displaying");
			setStreamId(undefined);
		} else if (streamBody.status === "error" && flowState === "streaming") {
			toast.error("Failed to generate response");
			setFlowState("idle");
			setStreamId(undefined);
		}
	}, [streamBody.status, streamBody.text, flowState]);

	const currentResponse = flowState === "streaming" ? streamBody.text : finalResponse;

	const {
		startStream,
		markSatisficed,
		banPhrase,
		checkpoint,
		generateComparisonVariants,
		recordComparisonPick,
	} = useTuning(promptId);

	const {
		pendingItems,
		shouldShowModal,
		resolve: resolveReviewItem,
	} = useReviewQueue(promptId);

	useEffect(() => {
		if (shouldShowModal && pendingItems && pendingItems.length > 0) {
			setShowReviewModal(true);
		}
	}, [shouldShowModal, pendingItems]);

	const handleQuestionSubmit = useCallback(
		async (question: string) => {
			setCurrentQuestion(question);
			setFinalResponse("");
			setFlowState("streaming");

			try {
				const newStreamId = await startStream(question);
				setStreamId(newStreamId);
			} catch (_error) {
				toast.error("Failed to start response");
				setFlowState("idle");
			}
		},
		[startStream],
	);

	const handleShorter = useCallback(async () => {
		if (!currentQuestion || !currentResponse) return;
		setFinalResponse("");
		setFlowState("streaming");

		try {
			const newStreamId = await startStream(currentQuestion, {
				modifier: "shorter",
			});
			setStreamId(newStreamId);
		} catch (_error) {
			toast.error("Failed to regenerate");
			setFlowState("displaying");
		}
	}, [currentQuestion, currentResponse, startStream]);

	const handleLonger = useCallback(async () => {
		if (!currentQuestion || !currentResponse) return;
		setFinalResponse("");
		setFlowState("streaming");

		try {
			const newStreamId = await startStream(currentQuestion, {
				modifier: "longer",
			});
			setStreamId(newStreamId);
		} catch (_error) {
			toast.error("Failed to regenerate");
			setFlowState("displaying");
		}
	}, [currentQuestion, currentResponse, startStream]);

	const handleThumbsDown = useCallback(() => {
		setFlowState("feedback");
	}, []);

	const isAmbiguousFeedback = useCallback((feedback: string): boolean => {
		const ambiguousTerms = [
			"too formal",
			"too casual",
			"more professional",
			"less formal",
			"better tone",
			"different style",
			"more friendly",
			"less friendly",
		];
		const lowerFeedback = feedback.toLowerCase();
		return ambiguousTerms.some((term) => lowerFeedback.includes(term));
	}, []);

	const handleFeedbackSubmit = useCallback(
		async (feedback: string) => {
			if (!currentQuestion || !currentResponse) return;

			try {
				if (isAmbiguousFeedback(feedback)) {
					setFlowState("streaming");
					const variants = await generateComparisonVariants(
						currentQuestion,
						feedback,
					);
					setComparisonVariants(variants);
					setFlowState("comparison");
				} else {
					setFinalResponse("");
					setFlowState("streaming");
					const newStreamId = await startStream(currentQuestion, {
						feedback: {
							previousResponse: currentResponse,
							feedbackText: feedback,
						},
					});
					setStreamId(newStreamId);
				}
			} catch (_error) {
				toast.error("Failed to regenerate");
				setFlowState("displaying");
			}
		},
		[
			currentQuestion,
			currentResponse,
			startStream,
			generateComparisonVariants,
			isAmbiguousFeedback,
		],
	);

	const handleComparisonSelect = useCallback(
		async (winner: "a" | "b") => {
			if (!currentQuestion || !comparisonVariants) return;

			try {
				const response = await recordComparisonPick(
					currentQuestion,
					comparisonVariants.variantA,
					comparisonVariants.variantB,
					winner,
				);
				setFinalResponse(response);
				setComparisonVariants(null);
				setFlowState("displaying");
			} catch (_error) {
				toast.error("Failed to record selection");
				setFlowState("displaying");
			}
		},
		[currentQuestion, comparisonVariants, recordComparisonPick],
	);

	const handleFeedbackCancel = useCallback(() => {
		setFlowState("displaying");
	}, []);

	const handleSatisficed = useCallback(async () => {
		if (!currentQuestion || !currentResponse) return;

		try {
			await markSatisficed(currentQuestion, currentResponse);
			toast.success("Response saved");
			setCurrentQuestion("");
			setFinalResponse("");
			setFlowState("idle");
		} catch (_error) {
			toast.error("Failed to save");
		}
	}, [currentQuestion, currentResponse, markSatisficed]);

	const handleBanPhrase = useCallback(
		async (phrase: string, condition?: string) => {
			if (!currentQuestion || !currentResponse) return;
			setFinalResponse("");
			setFlowState("streaming");

			try {
				await banPhrase(phrase, currentQuestion, currentResponse, condition);
				toast.success(condition ? "Conditional rule added" : "Phrase banned");
				const newStreamId = await startStream(currentQuestion);
				setStreamId(newStreamId);
			} catch (_error) {
				toast.error("Failed to update");
				setFlowState("displaying");
			}
		},
		[currentQuestion, currentResponse, banPhrase, startStream],
	);

	const handleCheckpoint = useCallback(async () => {
		try {
			await checkpoint();
			toast.success("Checkpoint saved");
		} catch (_error) {
			toast.error("Failed to save checkpoint");
		}
	}, [checkpoint]);

	const handleReviewResolve = useCallback(
		(itemId: string, resolution: "a" | "b" | "skip") => {
			resolveReviewItem({
				itemId: itemId as Id<"reviewQueueItems">,
				resolution,
			});
		},
		[resolveReviewItem],
	);

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 flex flex-col px-4 py-6 gap-6 overflow-auto">
				{currentQuestion && flowState !== "comparison" && (
					<div className="flex justify-end">
						<div className="text-sm font-medium px-4 py-3 bg-muted rounded-xl max-w-[85%]">
							{currentQuestion}
						</div>
					</div>
				)}

				{flowState === "comparison" && comparisonVariants ? (
					<ComparisonView
						question={currentQuestion}
						optionA={comparisonVariants.variantA}
						optionB={comparisonVariants.variantB}
						onSelect={handleComparisonSelect}
					/>
				) : (
					<ResponseDisplay
						response={currentResponse}
						onBanPhrase={handleBanPhrase}
						isStreaming={flowState === "streaming"}
					/>
				)}

				{flowState === "feedback" && (
					<FeedbackInput
						onSubmit={handleFeedbackSubmit}
						onCancel={handleFeedbackCancel}
					/>
				)}
			</div>

			<div className="p-4">
				<QuestionInput
					onSubmit={handleQuestionSubmit}
					disabled={flowState === "streaming" || flowState === "feedback"}
					placeholder={
						flowState === "idle"
							? "Type a question to start tuning..."
							: flowState === "streaming"
								? "Generating response..."
								: "Type another question..."
					}
					onCheckpoint={handleCheckpoint}
					showControls={flowState === "displaying"}
					onShorter={handleShorter}
					onLonger={handleLonger}
					onThumbsDown={handleThumbsDown}
					onSatisficed={handleSatisficed}
				/>
			</div>

			<ReviewQueueModal
				open={showReviewModal}
				onClose={() => setShowReviewModal(false)}
				items={
					pendingItems?.map(
						(item: {
							_id: Id<"reviewQueueItems">;
							contextQuestion: string;
							optionA: string;
							optionB: string;
						}) => ({
							_id: item._id,
							contextQuestion: item.contextQuestion,
							optionA: item.optionA,
							optionB: item.optionB,
						}),
					) ?? []
				}
				onResolve={handleReviewResolve}
			/>
		</div>
	);
}
