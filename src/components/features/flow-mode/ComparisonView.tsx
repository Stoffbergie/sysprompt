import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ComparisonViewProps {
	question: string;
	optionA: string;
	optionB: string;
	onSelect: (winner: "a" | "b") => void;
}

export function ComparisonView({
	question,
	optionA,
	optionB,
	onSelect,
}: ComparisonViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="text-center text-sm text-muted-foreground">
				Which response is better?
			</div>

			<div className="text-sm font-medium p-3 bg-muted/50 rounded-lg">
				{question}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<Card
					className={cn(
						"cursor-pointer transition-all",
						"hover:border-primary hover:shadow-md",
					)}
					onClick={() => onSelect("a")}
				>
					<CardContent className="p-4">
						<div className="text-xs font-medium text-muted-foreground mb-2">
							Option A
						</div>
						<div className="text-sm prose prose-sm dark:prose-invert max-w-none">
							{optionA.split("\n").map((p, i) => (
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
					onClick={() => onSelect("b")}
				>
					<CardContent className="p-4">
						<div className="text-xs font-medium text-muted-foreground mb-2">
							Option B
						</div>
						<div className="text-sm prose prose-sm dark:prose-invert max-w-none">
							{optionB.split("\n").map((p, i) => (
								<p key={i} className={cn(p ? "" : "h-2")}>
									{p}
								</p>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
