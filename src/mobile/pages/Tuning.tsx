import { Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	Activity,
	ArrowLeft,
	Eye,
	Lightbulb,
	Settings,
	Sparkles,
	TestTube,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FlowMode } from "@/components/features/flow-mode";
import { ProductionDashboard } from "@/components/features/production";
import { TestRunner } from "@/components/features/test-runner";
import {
	Badge,
	Button,
	Loading,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui";
import { usePrompt } from "@/shared";

interface TuningPageProps {
	promptId: string;
}

type TrustLevel =
	| "monitor_only"
	| "suggest_fixes"
	| "auto_fix_guardrailed"
	| "full_autopilot";

const TRUST_LEVELS: {
	value: TrustLevel;
	label: string;
	description: string;
	icon: typeof Eye;
}[] = [
	{
		value: "monitor_only",
		label: "Monitor Only",
		description: "Collect feedback only",
		icon: Eye,
	},
	{
		value: "suggest_fixes",
		label: "Suggest Fixes",
		description: "Suggest fixes for review",
		icon: Lightbulb,
	},
	{
		value: "auto_fix_guardrailed",
		label: "Auto-Fix",
		description: "Auto-apply passing fixes",
		icon: Sparkles,
	},
	{
		value: "full_autopilot",
		label: "Full Autopilot",
		description: "Fully automated fixes",
		icon: Zap,
	},
];

export function TuningPage({ promptId }: TuningPageProps) {
	const { prompt, isLoading } = usePrompt(promptId as Id<"prompts">);
	const [showSettings, setShowSettings] = useState(false);
	const updateTrustLevel = useMutation(api.prompts.updateTrustLevel);

	const handleTrustLevelChange = async (trustLevel: TrustLevel) => {
		try {
			await updateTrustLevel({ promptId: promptId as Id<"prompts">, trustLevel });
			toast.success("Trust level updated");
		} catch {
			toast.error("Failed to update");
		}
	};

	if (isLoading) {
		return <Loading />;
	}

	if (!prompt) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 p-4">
				<p className="text-muted-foreground">Prompt not found</p>
				<Link to="/prompts">
					<Button variant="outline">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Prompts
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<div className="border-b p-3 flex items-center gap-3">
				<Link to="/prompts">
					<Button variant="ghost" size="icon" className="h-10 w-10">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="font-semibold truncate">{prompt.name}</h1>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-10 w-10"
					onClick={() => setShowSettings(true)}
				>
					<Settings className="h-5 w-5" />
				</Button>
			</div>

			<Tabs defaultValue="tune" className="flex-1 flex flex-col">
				<div className="border-b px-2">
					<TabsList className="h-11 w-full justify-start">
						<TabsTrigger value="tune" className="gap-1.5 text-xs">
							<Settings className="h-3.5 w-3.5" />
							Tune
						</TabsTrigger>
						<TabsTrigger value="tests" className="gap-1.5 text-xs">
							<TestTube className="h-3.5 w-3.5" />
							Tests
						</TabsTrigger>
						{prompt.deploymentStatus === "deployed" && (
							<TabsTrigger value="production" className="gap-1.5 text-xs">
								<Activity className="h-3.5 w-3.5" />
								Production
							</TabsTrigger>
						)}
					</TabsList>
				</div>

				<TabsContent value="tune" className="flex-1 m-0 overflow-hidden">
					<FlowMode promptId={promptId as Id<"prompts">} />
				</TabsContent>

				<TabsContent value="tests" className="flex-1 m-0 p-4 overflow-auto">
					<TestRunner promptId={promptId as Id<"prompts">} />
				</TabsContent>

				{prompt.deploymentStatus === "deployed" && (
					<TabsContent value="production" className="flex-1 m-0 p-4 overflow-auto">
						<ProductionDashboard promptId={promptId as Id<"prompts">} />
					</TabsContent>
				)}
			</Tabs>

			<Sheet open={showSettings} onOpenChange={setShowSettings}>
				<SheetContent side="bottom" className="h-auto max-h-[80vh]">
					<SheetHeader>
						<SheetTitle>Prompt Settings</SheetTitle>
						<SheetDescription>
							Configure automation trust level
						</SheetDescription>
					</SheetHeader>
					<div className="space-y-3 py-4">
						{TRUST_LEVELS.map((level) => {
							const Icon = level.icon;
							const isSelected = prompt.trustLevel === level.value;

							return (
								<button
									key={level.value}
									type="button"
									onClick={() => handleTrustLevelChange(level.value)}
									className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left ${
										isSelected
											? "border-primary bg-primary/5"
											: "border-border"
									}`}
								>
									<div
										className={`p-2 rounded-md ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}
									>
										<Icon className="h-4 w-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium">{level.label}</span>
											{isSelected && (
												<Badge variant="secondary" className="text-xs">
													Active
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{level.description}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
