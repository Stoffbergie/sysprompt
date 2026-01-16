import { Sparkles } from "lucide-react";

interface WelcomeHeaderProps {
	name: string;
	subtitle?: string;
}

export function WelcomeHeader({ name, subtitle }: WelcomeHeaderProps) {
	const hour = new Date().getHours();
	const greeting =
		hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

	return (
		<div className="rounded-lg border bg-card p-8">
			<div className="mb-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
				<Sparkles className="h-3.5 w-3.5" />
				<span>Dashboard</span>
			</div>

			<h1 className="text-3xl font-bold text-foreground md:text-4xl">
				{greeting}, {name}!
			</h1>

			<p className="mt-2 text-muted-foreground max-w-lg">
				{subtitle || "Here's what's happening with your tasks today."}
			</p>
		</div>
	);
}
