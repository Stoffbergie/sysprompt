import { Link } from "@tanstack/react-router";
import { ChevronRight, Settings, Sparkles, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/shared";

export function DashboardPage() {
	const user = useCurrentUser();

	if (user === undefined) {
		return <DashboardSkeleton />;
	}

	const firstName =
		user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

	return (
		<div className="flex flex-col">
			<div className="border-b bg-card px-4 py-6">
				<p className="text-sm font-medium text-muted-foreground">
					Welcome back
				</p>
				<h1 className="mt-1 text-2xl font-bold text-foreground">{firstName}</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Express your taste. Let the system build your prompt.
				</p>
			</div>

			<div className="px-4 pb-4 pt-4">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
					<Zap className="h-4 w-4" />
					Quick Actions
				</h2>
				<div className="space-y-2">
					<Link
						to="/flow"
						className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors active:bg-accent/50"
					>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
								<Sparkles className="h-5 w-5 text-muted-foreground" />
							</div>
							<div>
								<p className="font-medium">Start Tuning</p>
								<p className="text-xs text-muted-foreground">Enter flow mode</p>
							</div>
						</div>
						<ChevronRight className="h-5 w-5 text-muted-foreground" />
					</Link>

					<Link
						to="/settings"
						className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors active:bg-accent/50"
					>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
								<Settings className="h-5 w-5 text-muted-foreground" />
							</div>
							<div>
								<p className="font-medium">Settings</p>
								<p className="text-xs text-muted-foreground">
									Customize your experience
								</p>
							</div>
						</div>
						<ChevronRight className="h-5 w-5 text-muted-foreground" />
					</Link>
				</div>
			</div>
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div className="flex flex-col">
			<div className="border-b bg-card px-4 py-6">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="mt-2 h-8 w-32" />
				<Skeleton className="mt-2 h-4 w-48" />
			</div>
			<div className="px-4 pb-4 pt-4">
				<Skeleton className="mb-3 h-4 w-28" />
				<div className="space-y-2">
					<Skeleton className="h-20 rounded-lg" />
					<Skeleton className="h-20 rounded-lg" />
				</div>
			</div>
		</div>
	);
}
