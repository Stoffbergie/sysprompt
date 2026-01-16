import {
	ArrowUp,
	Bookmark,
	Check,
	Minus,
	Plus,
	ThumbsDown,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface QuestionInputProps {
	onSubmit: (question: string) => void;
	disabled?: boolean;
	placeholder?: string;
	onCheckpoint?: () => void;
	showControls?: boolean;
	onShorter?: () => void;
	onLonger?: () => void;
	onThumbsDown?: () => void;
	onSatisficed?: () => void;
}

export function QuestionInput({
	onSubmit,
	disabled,
	placeholder = "Type a question to test...",
	onCheckpoint,
	showControls,
	onShorter,
	onLonger,
	onThumbsDown,
	onSatisficed,
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
		<div className="bg-muted/50 rounded-2xl p-3">
			<Textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				className={cn(
					"min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-1 py-2",
					"focus-visible:ring-0 focus-visible:ring-offset-0",
					"placeholder:text-muted-foreground/70",
				)}
				rows={1}
			/>

			<div className="flex items-center justify-between pt-1">
				<div className="flex items-center gap-1">
					{showControls && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={onShorter}
								disabled={disabled}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
								title="Make shorter"
							>
								<Minus className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={onLonger}
								disabled={disabled}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
								title="Make longer"
							>
								<Plus className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={onThumbsDown}
								disabled={disabled}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								title="Bad response"
							>
								<ThumbsDown className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={onSatisficed}
								disabled={disabled}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-500/10"
								title="Good response"
							>
								<Check className="h-4 w-4" />
							</Button>
						</>
					)}
					{onCheckpoint && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onCheckpoint}
							className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
							title="Save checkpoint"
						>
							<Bookmark className="h-4 w-4" />
						</Button>
					)}
				</div>

				<Button
					onClick={handleSubmit}
					disabled={disabled || !text.trim()}
					size="sm"
					className={cn(
						"h-8 w-8 p-0 rounded-lg",
						"bg-primary text-primary-foreground",
						"hover:bg-primary/90",
						"disabled:bg-muted disabled:text-muted-foreground",
					)}
				>
					<ArrowUp className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
