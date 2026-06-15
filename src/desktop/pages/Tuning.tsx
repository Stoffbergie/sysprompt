import { Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	ArrowLeft,
	Eye,
	FileText,
	Focus,
	History,
	Lightbulb,
	Rocket,
	Settings,
	Shield,
	Sparkles,
	Target,
	TestTube,
	Trash2,
	TrendingDown,
	TrendingUp,
	X,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FlowMode } from "@/components/features/flow-mode";
import { PatternFixFlow } from "@/components/features/patterns";
import { ProductionDashboard } from "@/components/features/production";
import { TestRunner } from "@/components/features/test-runner";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Loading,
	Slider,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui";
import { usePrompt } from "@/shared";

interface TuningPageProps {
	promptId: string;
}

export function TuningPage({ promptId }: TuningPageProps) {
	const { prompt, isLoading } = usePrompt(promptId as Id<"prompts">);
	const [zenMode, setZenMode] = useState(false);

	const exitZenMode = useCallback(() => setZenMode(false), []);

	useEffect(() => {
		if (!zenMode) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				exitZenMode();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [zenMode, exitZenMode]);

	if (isLoading) {
		return <Loading />;
	}

	if (!prompt) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
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

	if (zenMode) {
		return (
			<div className="fixed inset-0 z-50 bg-background flex flex-col">
				<div className="absolute top-3 right-3 z-10">
					<Button
						variant="ghost"
						size="sm"
						onClick={exitZenMode}
						className="gap-1 text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
						<span className="text-xs">ESC</span>
					</Button>
				</div>
				<div className="flex-1 min-h-0">
					<FlowMode promptId={promptId as Id<"prompts">} />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/prompts">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="text-lg font-semibold">{prompt.name}</h1>
						<p className="text-sm text-muted-foreground">
							{prompt.deploymentStatus === "deployed" ? "Live" : "Draft"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setZenMode(true)}
						className="gap-2 text-muted-foreground hover:text-foreground"
					>
						<Focus className="h-4 w-4" />
						Zen Mode
					</Button>
					{prompt.deploymentStatus === "deployed" ? (
						<Badge variant="default" className="gap-1">
							<Rocket className="h-3 w-3" />
							Deployed
						</Badge>
					) : (
						<DeployButton promptId={promptId as Id<"prompts">} />
					)}
				</div>
			</div>

			<Tabs defaultValue="tune" className="flex-1 flex flex-col">
				<div className="px-4">
					<TabsList className="h-10">
						<TabsTrigger value="tune" className="gap-2">
							<Settings className="h-4 w-4" />
							Tune
						</TabsTrigger>
						<TabsTrigger value="tests" className="gap-2">
							<TestTube className="h-4 w-4" />
							Tests
						</TabsTrigger>
						<TabsTrigger value="rules" className="gap-2">
							<Shield className="h-4 w-4" />
							Rules
						</TabsTrigger>
						{prompt.deploymentStatus === "deployed" && (
							<>
								<TabsTrigger value="production" className="gap-2">
									<Activity className="h-4 w-4" />
									Production
								</TabsTrigger>
								<TabsTrigger value="patterns" className="gap-2">
									<Target className="h-4 w-4" />
									Patterns
								</TabsTrigger>
							</>
						)}
						<TabsTrigger value="prompt" className="gap-2">
							<FileText className="h-4 w-4" />
							Prompt
						</TabsTrigger>
						<TabsTrigger value="history" className="gap-2">
							<History className="h-4 w-4" />
							History
						</TabsTrigger>
						<TabsTrigger value="settings" className="gap-2">
							<Settings className="h-4 w-4" />
							Settings
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="tune" className="flex-1 m-0">
					<FlowMode promptId={promptId as Id<"prompts">} />
				</TabsContent>

				<TabsContent value="tests" className="flex-1 m-0 p-4 overflow-auto">
					<TestRunner promptId={promptId as Id<"prompts">} />
				</TabsContent>

				<TabsContent value="rules" className="flex-1 m-0 p-4 overflow-auto">
					<RulesView promptId={promptId as Id<"prompts">} />
				</TabsContent>

				{prompt.deploymentStatus === "deployed" && (
					<>
						<TabsContent value="production" className="flex-1 m-0 p-4 overflow-auto">
							<ProductionDashboard promptId={promptId as Id<"prompts">} />
						</TabsContent>

						<TabsContent value="patterns" className="flex-1 m-0 p-4 overflow-auto">
							<PatternFixFlow promptId={promptId as Id<"prompts">} />
						</TabsContent>
					</>
				)}

				<TabsContent value="prompt" className="flex-1 m-0 p-4">
					<PromptView promptId={promptId as Id<"prompts">} />
				</TabsContent>

				<TabsContent value="history" className="flex-1 m-0 p-4">
					<VersionHistory promptId={promptId as Id<"prompts">} />
				</TabsContent>

				<TabsContent value="settings" className="flex-1 m-0 p-4 overflow-auto">
					<PromptSettings promptId={promptId as Id<"prompts">} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function DeployButton({ promptId }: { promptId: Id<"prompts"> }) {
	const deploy = useMutation(api.productionHelpers.deploy);

	const handleDeploy = async () => {
		try {
			const result = await deploy({ promptId });
			toast.success(`Deployed! API Key: ${result.apiKey}`);
			navigator.clipboard.writeText(result.apiKey);
		} catch {
			toast.error("Failed to deploy");
		}
	};

	return (
		<Button onClick={handleDeploy} className="gap-2">
			<Rocket className="h-4 w-4" />
			Deploy
		</Button>
	);
}


type HardRule = {
	_id: Id<"hardRules">;
	_creationTime: number;
	type: "phrase_ban" | "phrase_require" | "pattern_ban" | "pattern_require";
	value: string;
	scope: "global" | "conditional";
	condition?: string;
	active: boolean;
};

type SoftPreference = {
	_id: Id<"softPreferences">;
	_creationTime: number;
	dimension: "length" | "tone" | "formality" | "technical_depth" | "structure";
	direction: string;
	strength: number;
	context?: string;
	confidence: number;
};

function RulesView({ promptId }: { promptId: Id<"prompts"> }) {
	const hardRules = useQuery(api.rules.listHardRules, { promptId }) as
		| HardRule[]
		| undefined;
	const softPreferences = useQuery(api.rules.listSoftPreferences, {
		promptId,
	}) as SoftPreference[] | undefined;
	const toggleHardRule = useMutation(api.rules.toggleHardRule);
	const deleteHardRule = useMutation(api.rules.deleteHardRule);
	const updatePreferenceStrength = useMutation(
		api.rules.updatePreferenceStrength,
	);
	const deleteSoftPreference = useMutation(api.rules.deleteSoftPreference);

	if (hardRules === undefined || softPreferences === undefined) {
		return <Loading />;
	}

	const hasNoRules = hardRules.length === 0 && softPreferences.length === 0;

	if (hasNoRules) {
		return (
			<div className="text-muted-foreground text-center py-12">
				Rules will appear here as you tune your prompt.
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Hard Rules</h2>
					<Badge variant="outline">{hardRules.length}</Badge>
				</div>
				{hardRules.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No hard rules yet. Ban phrases or require content to create rules.
					</p>
				) : (
					<div className="space-y-2">
						{hardRules.map((rule: HardRule) => (
							<div
								key={rule._id}
								className="flex items-center justify-between p-3 border rounded-lg"
							>
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<Switch
										checked={rule.active}
										onCheckedChange={() => toggleHardRule({ ruleId: rule._id })}
									/>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="secondary" className="shrink-0">
												{rule.type.replace(/_/g, " ")}
											</Badge>
											{rule.scope === "conditional" && (
												<Badge variant="outline" className="shrink-0">
													conditional
												</Badge>
											)}
										</div>
										<p
											className={`font-mono text-sm truncate ${!rule.active ? "opacity-50" : ""}`}
										>
											{rule.value}
										</p>
										{rule.condition && (
											<p className="text-xs text-muted-foreground">
												When: {rule.condition}
											</p>
										)}
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => deleteHardRule({ ruleId: rule._id })}
								>
									<Trash2 className="h-4 w-4 text-muted-foreground" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Soft Preferences</h2>
					<Badge variant="outline">{softPreferences.length}</Badge>
				</div>
				{softPreferences.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No preferences yet. Tuning actions will infer your preferences.
					</p>
				) : (
					<div className="space-y-3">
						{softPreferences.map((pref: SoftPreference) => (
							<div key={pref._id} className="p-3 border rounded-lg space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant="secondary">{pref.dimension}</Badge>
										<span className="text-sm">
											{pref.direction === "more" ? (
												<TrendingUp className="h-4 w-4 inline text-green-500" />
											) : (
												<TrendingDown className="h-4 w-4 inline text-amber-500" />
											)}{" "}
											{pref.direction}
										</span>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											deleteSoftPreference({ preferenceId: pref._id })
										}
									>
										<Trash2 className="h-4 w-4 text-muted-foreground" />
									</Button>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-xs text-muted-foreground w-12">
										Strength
									</span>
									<Slider
										value={[pref.strength]}
										min={0}
										max={1}
										step={0.1}
										className="flex-1"
										onValueChange={([value]) =>
											updatePreferenceStrength({
												preferenceId: pref._id,
												strength: value,
											})
										}
									/>
									<span className="text-xs w-8 text-right">
										{Math.round(pref.strength * 100)}%
									</span>
								</div>
								{pref.context && (
									<p className="text-xs text-muted-foreground">
										Context: {pref.context}
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									Confidence: {Math.round(pref.confidence * 100)}%
								</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function PromptView({ promptId }: { promptId: Id<"prompts"> }) {
	const { currentVersion } = usePrompt(promptId);

	if (!currentVersion) {
		return (
			<div className="text-muted-foreground text-center py-12">
				No prompt generated yet. Start tuning to build your prompt.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-medium">Generated System Prompt</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						navigator.clipboard.writeText(currentVersion.promptText);
						toast.success("Copied to clipboard");
					}}
				>
					Copy
				</Button>
			</div>
			<pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
				{currentVersion.promptText || "(Empty prompt)"}
			</pre>
		</div>
	);
}

type PromptVersion = {
	_id: Id<"promptVersions">;
	_creationTime: number;
	versionNumber: number;
	versionName?: string;
	source: string;
};

function VersionHistory({ promptId }: { promptId: Id<"prompts"> }) {
	const { versions, rollback } = usePrompt(promptId);

	if (!versions || versions.length === 0) {
		return (
			<div className="text-muted-foreground text-center py-12">
				No version history yet.
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{(versions as PromptVersion[]).map((version: PromptVersion) => (
				<div
					key={version._id}
					className="flex items-center justify-between p-3 border rounded-lg"
				>
					<div>
						<div className="font-medium">
							{version.versionName ?? `v${version.versionNumber}`}
						</div>
						<div className="text-sm text-muted-foreground">
							{version.source.replace(/_/g, " ")} •{" "}
							{new Date(version._creationTime).toLocaleDateString()}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => rollback({ promptId, versionId: version._id })}
					>
						Restore
					</Button>
				</div>
			))}
		</div>
	);
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
		description: "Collect feedback and detect patterns but never suggest or apply fixes",
		icon: Eye,
	},
	{
		value: "suggest_fixes",
		label: "Suggest Fixes",
		description: "Detect patterns and suggest fixes for your review",
		icon: Lightbulb,
	},
	{
		value: "auto_fix_guardrailed",
		label: "Auto-Fix (Guardrailed)",
		description: "Automatically apply fixes that pass test suite validation",
		icon: Sparkles,
	},
	{
		value: "full_autopilot",
		label: "Full Autopilot",
		description: "Automatically detect, fix, and deploy without manual review",
		icon: Zap,
	},
];

function PromptSettings({ promptId }: { promptId: Id<"prompts"> }) {
	const { prompt } = usePrompt(promptId);
	const updateTrustLevel = useMutation(api.prompts.updateTrustLevel);

	if (!prompt) {
		return <Loading />;
	}

	const handleTrustLevelChange = async (trustLevel: TrustLevel) => {
		try {
			await updateTrustLevel({ promptId, trustLevel });
			toast.success("Trust level updated");
		} catch {
			toast.error("Failed to update trust level");
		}
	};

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h2 className="text-lg font-medium">Prompt Settings</h2>
				<p className="text-sm text-muted-foreground">
					Configure how this prompt behaves in production
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Automation Trust Level</CardTitle>
					<CardDescription>
						Control how much autonomy the system has when detecting and fixing issues
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{TRUST_LEVELS.map((level) => {
						const Icon = level.icon;
						const isSelected = prompt.trustLevel === level.value;

						return (
							<button
								key={level.value}
								type="button"
								onClick={() => handleTrustLevelChange(level.value)}
								className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
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
				</CardContent>
			</Card>

			{prompt.deploymentStatus === "deployed" && prompt.apiKey && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">API Configuration</CardTitle>
						<CardDescription>
							Use this API key to send requests to your deployed prompt
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<code className="flex-1 p-2 bg-muted rounded text-sm font-mono truncate">
								{prompt.apiKey}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigator.clipboard.writeText(prompt.apiKey);
									toast.success("API key copied");
								}}
							>
								Copy
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
