import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, Textarea } from "@/components/ui";

interface FeedbackWidgetProps {
	callId: string;
	apiKey: string;
	endpoint?: string;
	onSubmit?: (rating: "up" | "down", comment?: string) => void;
}

export function FeedbackWidget({
	callId,
	apiKey,
	endpoint = "/api/v1/feedback",
	onSubmit,
}: FeedbackWidgetProps) {
	const [rating, setRating] = useState<"up" | "down" | null>(null);
	const [comment, setComment] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [showComment, setShowComment] = useState(false);

	const submitFeedback = useCallback(
		async (selectedRating: "up" | "down", feedbackComment?: string) => {
			try {
				const response = await fetch(endpoint, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						callId,
						rating: selectedRating,
						comment: feedbackComment,
					}),
				});

				if (response.ok) {
					setSubmitted(true);
					onSubmit?.(selectedRating, feedbackComment);
				}
			} catch {}
		},
		[apiKey, callId, endpoint, onSubmit],
	);

	const handleRating = useCallback(
		(selectedRating: "up" | "down") => {
			setRating(selectedRating);
			if (selectedRating === "up") {
				submitFeedback(selectedRating);
			} else {
				setShowComment(true);
			}
		},
		[submitFeedback],
	);

	const handleSubmitWithComment = useCallback(() => {
		if (rating) {
			submitFeedback(rating, comment || undefined);
		}
	}, [rating, comment, submitFeedback]);

	if (submitted) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<span>Thanks for your feedback!</span>
			</div>
		);
	}

	if (showComment && rating === "down") {
		return (
			<div className="space-y-2">
				<Textarea
					placeholder="What could be improved? (optional)"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					className="min-h-[80px] text-base"
				/>
				<div className="flex gap-2">
					<Button size="sm" onClick={handleSubmitWithComment}>
						Submit
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setShowComment(false);
							setRating(null);
						}}
					>
						Cancel
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">Was this helpful?</span>
			<Button
				variant={rating === "up" ? "default" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => handleRating("up")}
			>
				<ThumbsUp className="h-4 w-4" />
			</Button>
			<Button
				variant={rating === "down" ? "default" : "ghost"}
				size="icon"
				className="h-8 w-8"
				onClick={() => handleRating("down")}
			>
				<ThumbsDown className="h-4 w-4" />
			</Button>
		</div>
	);
}
