import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle,
	Loader2,
	Sparkles,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Skeleton,
} from "@/components/ui";

interface PatternFixFlowProps {
	promptId: Id<"prompts">;
}

export function PatternFixFlow({ promptId }: PatternFixFlowProps) {
	const patterns = useQuery(api.patternsHelpers.list, { promptId });
	const [selectedPattern, setSelectedPattern] = useState<Id<"patterns"> | null>(
		null,
	);

	if (patterns === undefined) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
		);
	}

	const activePatterns = patterns.filter((p) => p.status === "detected");
	const fixedPatterns = patterns.filter((p) => p.status === "fixed");
	const ignoredPatterns = patterns.filter((p) => p.status === "ignored");

	return (
		<div className="space-y-6">
			{activePatterns.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-medium flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-500" />
						Detected Patterns ({activePatterns.length})
					</h3>
					{activePatterns.map((pattern) => (
						<PatternCard
							key={pattern._id}
							pattern={pattern}
							onSelect={() => setSelectedPattern(pattern._id)}
						/>
					))}
				</div>
			)}

			{fixedPatterns.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
						<CheckCircle className="h-4 w-4 text-green-500" />
						Fixed Patterns ({fixedPatterns.length})
					</h3>
					{fixedPatterns.map((pattern) => (
						<PatternCard
							key={pattern._id}
							pattern={pattern}
							onSelect={() => setSelectedPattern(pattern._id)}
						/>
					))}
				</div>
			)}

			{ignoredPatterns.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
						<XCircle className="h-4 w-4" />
						Dismissed ({ignoredPatterns.length})
					</h3>
					{ignoredPatterns.slice(0, 2).map((pattern) => (
						<PatternCard
							key={pattern._id}
							pattern={pattern}
							onSelect={() => setSelectedPattern(pattern._id)}
							compact
						/>
					))}
				</div>
			)}

			{patterns.length === 0 && (
				<div className="text-center py-12 text-muted-foreground">
					<Sparkles className="h-8 w-8 mx-auto mb-2" />
					<p>No patterns detected yet</p>
					<p className="text-sm mt-1">
						Patterns will appear after collecting feedback on deployed prompts
					</p>
				</div>
			)}

			{selectedPattern && (
				<PatternDetailModal
					patternId={selectedPattern}
					onClose={() => setSelectedPattern(null)}
				/>
			)}
		</div>
	);
}

interface PatternCardProps {
	pattern: {
		_id: Id<"patterns">;
		description: string;
		commonThread: string;
		count: number;
		percentage: number;
		confidence: number;
		status: string;
		suggestedFix?: string;
	};
	onSelect: () => void;
	compact?: boolean;
}

function PatternCard({ pattern, onSelect, compact }: PatternCardProps) {
	const updateStatus = useMutation(api.patternsHelpers.updateStatus);

	const handleDismiss = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				await updateStatus({ patternId: pattern._id, status: "ignored" });
				toast.success("Pattern ignored");
			} catch {
				toast.error("Failed to dismiss");
			}
		},
		[pattern._id, updateStatus],
	);

	if (compact) {
		return (
			<button
				type="button"
				onClick={onSelect}
				className="w-full text-left p-3 border rounded-lg cursor-pointer hover:border-primary/50 opacity-60"
			>
				<p className="text-sm">{pattern.description}</p>
			</button>
		);
	}

	return (
		<Card
			className="cursor-pointer hover:border-primary/50 transition-colors"
			onClick={onSelect}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<CardTitle className="text-base">{pattern.description}</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{pattern.count} cases</Badge>
						{pattern.status === "detected" && (
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={handleDismiss}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>
				<CardDescription>{pattern.commonThread}</CardDescription>
			</CardHeader>
			<CardContent className="pb-3">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{Math.round(pattern.percentage)}% of unhappy responses</span>
					<span>{Math.round(pattern.confidence * 100)}% confidence</span>
				</div>
				{pattern.suggestedFix && pattern.status === "detected" && (
					<div className="mt-2 p-2 bg-muted rounded text-xs">
						<span className="font-medium">Suggested: </span>
						{pattern.suggestedFix}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface PatternDetailModalProps {
	patternId: Id<"patterns">;
	onClose: () => void;
}

function PatternDetailModal({ patternId, onClose }: PatternDetailModalProps) {
	const pattern = useQuery(api.patternsHelpers.get, { patternId });
	const applyFix = useAction(api.patterns.applyFix);
	const updateStatus = useMutation(api.patternsHelpers.updateStatus);
	const [isApplying, setIsApplying] = useState(false);

	const handleApplyFix = useCallback(async () => {
		setIsApplying(true);
		try {
			const versionId = await applyFix({ patternId });
			if (versionId) {
				toast.success("Fix applied and new version created");
				onClose();
			} else {
				toast.error("Failed to apply fix");
			}
		} catch {
			toast.error("Failed to apply fix");
		} finally {
			setIsApplying(false);
		}
	}, [applyFix, patternId, onClose]);

	const handleDismiss = useCallback(async () => {
		try {
			await updateStatus({ patternId, status: "ignored" });
			toast.success("Pattern ignored");
			onClose();
		} catch {
			toast.error("Failed to dismiss");
		}
	}, [patternId, updateStatus, onClose]);

	if (pattern === undefined) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent>
					<div className="flex items-center justify-center h-48">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (pattern === null) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Pattern not found</DialogTitle>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{pattern.description}</DialogTitle>
					<DialogDescription>{pattern.commonThread}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center gap-4 text-sm">
						<Badge variant="outline">{pattern.count} cases</Badge>
						<span className="text-muted-foreground">
							{Math.round(pattern.percentage)}% of unhappy responses
						</span>
						<span className="text-muted-foreground">
							{Math.round(pattern.confidence * 100)}% confidence
						</span>
					</div>

					{pattern.likelyCause && (
						<div>
							<h4 className="text-sm font-medium mb-1">Likely Cause</h4>
							<p className="text-sm text-muted-foreground">
								{pattern.likelyCause}
							</p>
						</div>
					)}

					{pattern.suggestedFix && (
						<div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
							<h4 className="text-sm font-medium mb-1 flex items-center gap-2">
								<Sparkles className="h-4 w-4 text-green-600" />
								Suggested Fix
							</h4>
							<p className="text-sm">{pattern.suggestedFix}</p>
						</div>
					)}

					{pattern.examples && pattern.examples.length > 0 && (
						<div>
							<h4 className="text-sm font-medium mb-2">Example Cases</h4>
							<div className="space-y-2">
								{pattern.examples.map((example, i) => (
									<div key={i} className="p-3 border rounded-lg text-sm">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium">Input:</span>
											<ArrowRight className="h-3 w-3" />
											<span className="font-medium">Output</span>
										</div>
										<p className="text-muted-foreground truncate">
											{example.input}
										</p>
										<p className="text-muted-foreground truncate mt-1">
											{example.output}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					{pattern.status === "detected" && (
						<>
							<Button variant="ghost" onClick={handleDismiss}>
								Dismiss
							</Button>
							{pattern.suggestedFix && (
								<Button onClick={handleApplyFix} disabled={isApplying}>
									{isApplying ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Applying...
										</>
									) : (
										<>
											<CheckCircle className="h-4 w-4 mr-2" />
											Apply Fix
										</>
									)}
								</Button>
							)}
						</>
					)}
					{pattern.status !== "detected" && (
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
