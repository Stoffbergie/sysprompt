import { Settings, Sparkles, Zap } from "lucide-react";
import { QuickActionCard, WelcomeHeader } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { useCurrentUser } from "@/shared";

export function DashboardPage() {
	const user = useCurrentUser();

	if (user === undefined) {
		return <Loading />;
	}

	const firstName =
		user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

	return (
		<div className="relative space-y-8">
			<div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_40%,transparent_100%)]" />

			<WelcomeHeader
				name={firstName}
				subtitle="Express your taste. Let the system build your prompt."
			/>

			<div>
				<div className="mb-4 flex items-center gap-2">
					<Zap className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-semibold">Quick Actions</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<QuickActionCard
						title="Start Tuning"
						description="React to outputs and build your prompt through preference discovery."
						icon={Sparkles}
						href="/flow"
						buttonText="Enter Flow Mode"
					/>

					<QuickActionCard
						title="Account Settings"
						description="Customize your profile, appearance, and notification preferences."
						icon={Settings}
						href="/settings"
						buttonText="Open Settings"
						buttonVariant="outline"
					>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary" className="text-xs">
								Profile
							</Badge>
							<Badge variant="secondary" className="text-xs">
								Appearance
							</Badge>
							<Badge variant="secondary" className="text-xs">
								Notifications
							</Badge>
						</div>
					</QuickActionCard>
				</div>
			</div>
		</div>
	);
}

