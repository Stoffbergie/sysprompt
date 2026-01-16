import { useCallback, useState } from "react";
import { Button, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ResponseDisplayProps {
	response: string;
	onBanPhrase: (phrase: string, condition?: string) => void;
	isStreaming?: boolean;
}

export function ResponseDisplay({
	response,
	onBanPhrase,
	isStreaming,
}: ResponseDisplayProps) {
	const [selectedText, setSelectedText] = useState("");
	const [showPopover, setShowPopover] = useState(false);
	const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
	const [showNoteInput, setShowNoteInput] = useState(false);
	const [noteText, setNoteText] = useState("");

	const handleMouseUp = useCallback(() => {
		const selection = window.getSelection();
		const text = selection?.toString().trim();

		if (text && text.length > 0) {
			setSelectedText(text);
			const range = selection?.getRangeAt(0);
			if (range) {
				const rect = range.getBoundingClientRect();
				setPopoverPosition({
					x: rect.left + rect.width / 2,
					y: rect.top - 10,
				});
				setShowPopover(true);
			}
		} else {
			setShowPopover(false);
			setShowNoteInput(false);
			setNoteText("");
		}
	}, []);

	const handleNever = useCallback(() => {
		onBanPhrase(selectedText);
		setShowPopover(false);
		setSelectedText("");
	}, [selectedText, onBanPhrase]);

	const handleNote = useCallback(() => {
		setShowNoteInput(true);
	}, []);

	const handleNoteSubmit = useCallback(() => {
		onBanPhrase(selectedText, noteText);
		setShowPopover(false);
		setShowNoteInput(false);
		setNoteText("");
		setSelectedText("");
	}, [selectedText, noteText, onBanPhrase]);

	if (!response && !isStreaming) {
		return (
			<div className="flex-1 flex items-center justify-center text-muted-foreground">
				<p>Type a question below to start tuning</p>
			</div>
		);
	}

	if (isStreaming && !response) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="animate-pulse flex flex-col items-center gap-3">
					<div className="h-4 w-64 bg-muted rounded" />
					<div className="h-4 w-48 bg-muted rounded" />
					<div className="h-4 w-56 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 relative">
			{/* biome-ignore lint/a11y/useSemanticElements: Text selection for banning phrases requires non-semantic div */}
			<div
				className={cn(
					"prose prose-sm dark:prose-invert max-w-none",
					"select-text cursor-text",
				)}
				onMouseUp={isStreaming ? undefined : handleMouseUp}
				role="region"
				aria-label="AI Response"
			>
				{response.split("\n").map((paragraph, i, arr) => (
					<p key={i} className={cn(paragraph ? "" : "h-4")}>
						{paragraph}
						{isStreaming && i === arr.length - 1 && (
							<span className="inline-block w-2 h-4 bg-foreground/70 ml-0.5 animate-pulse" />
						)}
					</p>
				))}
			</div>

			{showPopover && (
				<div
					className="fixed z-50"
					style={{
						left: `${popoverPosition.x}px`,
						top: `${popoverPosition.y}px`,
						transform: "translate(-50%, -100%)",
					}}
				>
					<div className="bg-popover border rounded-lg shadow-lg p-2 flex flex-col gap-2">
						{!showNoteInput ? (
							<div className="flex gap-1">
								<Button
									size="sm"
									variant="destructive"
									onClick={handleNever}
									className="text-xs"
								>
									Never
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleNote}
									className="text-xs"
								>
									Note
								</Button>
							</div>
						) : (
							<div className="flex flex-col gap-2 min-w-[200px]">
								<Textarea
									placeholder="When to avoid this..."
									value={noteText}
									onChange={(e) => setNoteText(e.target.value)}
									className="text-xs min-h-[60px]"
									autoFocus
								/>
								<div className="flex gap-1">
									<Button
										size="sm"
										variant="default"
										onClick={handleNoteSubmit}
										className="text-xs flex-1"
									>
										Add condition
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setShowNoteInput(false);
											setNoteText("");
										}}
										className="text-xs"
									>
										Cancel
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
