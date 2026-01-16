import { SkipForward } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Progress,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface ReviewItem {
	_id: string;
	contextQuestion: string;
	optionA: string;
	optionB: string;
}

interface ReviewQueueModalProps {
	open: boolean;
	onClose: () => void;
	items: ReviewItem[];
	onResolve: (itemId: string, resolution: "a" | "b" | "skip") => void;
}

export function ReviewQueueModal({
	open,
	onClose,
	items,
	onResolve,
}: ReviewQueueModalProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	const currentItem = items[currentIndex];
	const progress =
		items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;

	const handleSelect = (resolution: "a" | "b" | "skip") => {
		if (!currentItem) return;

		onResolve(currentItem._id, resolution);

		if (currentIndex < items.length - 1) {
			setCurrentIndex(currentIndex + 1);
		} else {
			setCurrentIndex(0);
			onClose();
		}
	};

	if (!currentItem) return null;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>Quick Review</span>
						<span className="text-sm font-normal text-muted-foreground">
							{currentIndex + 1} of {items.length}
						</span>
					</DialogTitle>
				</DialogHeader>

				<Progress value={progress} className="h-1" />

				<div className="flex-1 overflow-auto py-4">
					<div className="text-sm font-medium p-3 bg-muted/50 rounded-lg mb-4">
						{currentItem.contextQuestion}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Card
							className={cn(
								"cursor-pointer transition-all",
								"hover:border-primary hover:shadow-md",
							)}
							onClick={() => handleSelect("a")}
						>
							<CardContent className="p-4">
								<div className="text-xs font-medium text-muted-foreground mb-2">
									Option A
								</div>
								<div className="text-sm prose prose-sm dark:prose-invert max-w-none max-h-[300px] overflow-auto">
									{currentItem.optionA.split("\n").map((p, i) => (
										<p key={i} className={cn(p ? "" : "h-2")}>
											{p}
										</p>
									))}
								</div>
							</CardContent>
						</Card>

						<Card
							className={cn(
								"cursor-pointer transition-all",
								"hover:border-primary hover:shadow-md",
							)}
							onClick={() => handleSelect("b")}
						>
							<CardContent className="p-4">
								<div className="text-xs font-medium text-muted-foreground mb-2">
									Option B
								</div>
								<div className="text-sm prose prose-sm dark:prose-invert max-w-none max-h-[300px] overflow-auto">
									{currentItem.optionB.split("\n").map((p, i) => (
										<p key={i} className={cn(p ? "" : "h-2")}>
											{p}
										</p>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="flex justify-center pt-2 border-t">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleSelect("skip")}
						className="text-muted-foreground"
					>
						<SkipForward className="h-4 w-4 mr-1" />
						Skip this one
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
