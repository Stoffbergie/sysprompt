import { Check, Minus, Plus, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FlowControlsProps {
	onShorter: () => void;
	onLonger: () => void;
	onThumbsDown: () => void;
	onSatisficed: () => void;
	disabled?: boolean;
}

export function FlowControls({
	onShorter,
	onLonger,
	onThumbsDown,
	onSatisficed,
	disabled,
}: FlowControlsProps) {
	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				variant="outline"
				size="lg"
				onClick={onShorter}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full p-0",
					"hover:bg-muted hover:border-muted-foreground/30",
				)}
				title="Make shorter"
			>
				<Minus className="h-5 w-5" />
			</Button>

			<Button
				variant="outline"
				size="lg"
				onClick={onLonger}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full p-0",
					"hover:bg-muted hover:border-muted-foreground/30",
				)}
				title="Make longer"
			>
				<Plus className="h-5 w-5" />
			</Button>

			<Button
				variant="outline"
				size="lg"
				onClick={onThumbsDown}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full p-0",
					"hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive",
				)}
				title="Bad response"
			>
				<ThumbsDown className="h-5 w-5" />
			</Button>

			<Button
				variant="outline"
				size="lg"
				onClick={onSatisficed}
				disabled={disabled}
				className={cn(
					"h-12 w-12 rounded-full p-0",
					"hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-600",
				)}
				title="Good response"
			>
				<Check className="h-5 w-5" />
			</Button>
		</div>
	);
}
