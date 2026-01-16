import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CheckCircle,
	Clock,
	MessageSquare,
	Play,
	RefreshCw,
	ThumbsDown,
	ThumbsUp,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
} from "@/components/ui";

interface ProductionDashboardProps {
	promptId: Id<"prompts">;
}

export function ProductionDashboard({ promptId }: ProductionDashboardProps) {
	const metrics = useQuery(api.productionHelpers.getMetrics, { promptId });
	const recentUnhappy = useQuery(api.productionHelpers.getRecentUnhappy, {
		promptId,
		limit: 5,
	});
	const patterns = useQuery(api.patternsHelpers.list, { promptId });

	if (metrics === undefined) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
				<Skeleton className="h-64" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<MetricCard
					title="Total Calls"
					value={metrics.totalCalls.toLocaleString()}
					icon={Activity}
					description="All-time API calls"
				/>
				<MetricCard
					title="Today"
					value={metrics.callsToday.toLocaleString()}
					icon={Clock}
					description="Calls in last 24h"
				/>
				<MetricCard
					title="Feedback Rate"
					value={`${metrics.feedbackRate.toFixed(1)}%`}
					icon={MessageSquare}
					description="Of calls received feedback"
				/>
				<MetricCard
					title="Helpful Rate"
					value={`${metrics.helpfulRate.toFixed(1)}%`}
					icon={ThumbsUp}
					description="Positive feedback"
					variant={metrics.helpfulRate >= 80 ? "success" : metrics.helpfulRate >= 50 ? "warning" : "danger"}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<ThumbsDown className="h-4 w-4 text-destructive" />
							Recent Unhappy Responses
						</CardTitle>
						<CardDescription>
							Responses that received negative feedback
						</CardDescription>
					</CardHeader>
					<CardContent>
						{recentUnhappy === undefined ? (
							<Skeleton className="h-32" />
						) : recentUnhappy.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
								No negative feedback yet
							</div>
						) : (
							<div className="space-y-3">
								{recentUnhappy.map((item) => (
									<div
										key={item._id}
										className="p-3 border rounded-lg space-y-1"
									>
										<p className="text-sm font-medium truncate">{item.input}</p>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{item.output}
										</p>
										{item.comment && (
											<p className="text-xs text-destructive">
												Feedback: {item.comment}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<BarChart3 className="h-4 w-4" />
							Detected Patterns
						</CardTitle>
						<CardDescription>
							Common issues found in negative feedback
						</CardDescription>
					</CardHeader>
					<CardContent>
						{patterns === undefined ? (
							<Skeleton className="h-32" />
						) : patterns.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<TrendingUp className="h-8 w-8 mx-auto mb-2" />
								<p>Need more feedback data</p>
								<p className="text-xs mt-1">
									Patterns will appear after 5+ unhappy responses
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{patterns.slice(0, 3).map((pattern) => (
									<PatternCard key={pattern._id} pattern={pattern} />
								))}
								{patterns.length > 3 && (
									<p className="text-xs text-muted-foreground text-center">
										+{patterns.length - 3} more patterns
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface MetricCardProps {
	title: string;
	value: string;
	icon: typeof Activity;
	description: string;
	variant?: "default" | "success" | "warning" | "danger";
}

function MetricCard({
	title,
	value,
	icon: Icon,
	description,
	variant = "default",
}: MetricCardProps) {
	const variantStyles = {
		default: "",
		success: "text-green-600",
		warning: "text-amber-600",
		danger: "text-red-600",
	};

	return (
		<Card>
			<CardContent className="pt-4">
				<div className="flex items-center justify-between">
					<Icon className="h-4 w-4 text-muted-foreground" />
					<Badge variant="outline" className="text-xs">
						{title}
					</Badge>
				</div>
				<div className={`text-2xl font-bold mt-2 ${variantStyles[variant]}`}>
					{value}
				</div>
				<p className="text-xs text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}

interface PatternCardProps {
	pattern: {
		_id: Id<"patterns">;
		description: string;
		count: number;
		confidence: number;
		status: string;
		suggestedFix?: string;
	};
}

function PatternCard({ pattern }: PatternCardProps) {
	const applyFix = useMutation(api.patternsHelpers.updateStatus);

	const handleApplyFix = async () => {
		try {
			await applyFix({ patternId: pattern._id, status: "fixing" });
			toast.success("Fix is being applied");
		} catch {
			toast.error("Failed to apply fix");
		}
	};

	const statusIcon = {
		detected: <AlertTriangle className="h-3 w-3 text-amber-500" />,
		fixing: <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />,
		fixed: <CheckCircle className="h-3 w-3 text-green-500" />,
		dismissed: <XCircle className="h-3 w-3 text-muted-foreground" />,
	}[pattern.status] ?? <AlertTriangle className="h-3 w-3" />;

	return (
		<div className="p-3 border rounded-lg space-y-2">
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					{statusIcon}
					<span className="text-sm font-medium">{pattern.description}</span>
				</div>
				<Badge variant="outline" className="text-xs shrink-0">
					{pattern.count} cases
				</Badge>
			</div>
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
					{Math.round(pattern.confidence * 100)}% confidence
				</span>
				{pattern.status === "detected" && pattern.suggestedFix && (
					<Button size="sm" variant="outline" onClick={handleApplyFix}>
						<Play className="h-3 w-3 mr-1" />
						Apply Fix
					</Button>
				)}
			</div>
		</div>
	);
}
