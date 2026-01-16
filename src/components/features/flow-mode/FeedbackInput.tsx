import { Send, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, Textarea } from "@/components/ui";

interface FeedbackInputProps {
	onSubmit: (feedback: string) => void;
	onCancel: () => void;
	placeholder?: string;
}

export function FeedbackInput({
	onSubmit,
	onCancel,
	placeholder = "What's wrong with this response?",
}: FeedbackInputProps) {
	const [text, setText] = useState("");

	const handleSubmit = useCallback(() => {
		if (text.trim()) {
			onSubmit(text.trim());
			setText("");
		}
	}, [text, onSubmit]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
			if (e.key === "Escape") {
				onCancel();
			}
		},
		[handleSubmit, onCancel],
	);

	return (
		<div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border">
			<Textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className="min-h-[80px] resize-none"
				autoFocus
			/>
			<div className="flex justify-end gap-2">
				<Button variant="ghost" size="sm" onClick={onCancel}>
					<X className="h-4 w-4 mr-1" />
					Cancel
				</Button>
				<Button size="sm" onClick={handleSubmit} disabled={!text.trim()}>
					<Send className="h-4 w-4 mr-1" />
					Submit
				</Button>
			</div>
		</div>
	);
}
