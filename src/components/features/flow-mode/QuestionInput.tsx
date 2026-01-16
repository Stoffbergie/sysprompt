import { Send } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, Input } from "@/components/ui";

interface QuestionInputProps {
	onSubmit: (question: string) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function QuestionInput({
	onSubmit,
	disabled,
	placeholder = "Type a question to test...",
}: QuestionInputProps) {
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
		},
		[handleSubmit],
	);

	return (
		<div className="flex gap-2">
			<Input
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				className="flex-1"
			/>
			<Button
				onClick={handleSubmit}
				disabled={disabled || !text.trim()}
				size="icon"
			>
				<Send className="h-4 w-4" />
			</Button>
		</div>
	);
}
