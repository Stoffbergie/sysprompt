import { Link } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { usePrompts } from "@/shared";

type Prompt = {
	_id: Id<"prompts">;
	name: string;
	deploymentStatus: string;
	lastActivityAt: number;
};

import { Clock, FileText, Pause, Plus, Rocket } from "lucide-react";
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
	Input,
	Label,
	Loading,
	Textarea,
} from "@/components/ui";

export function PromptsPage() {
	const { prompts, isLoading, createPrompt } = usePrompts();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newPromptName, setNewPromptName] = useState("");
	const [newPromptGoal, setNewPromptGoal] = useState("");
	const [newPromptContext, setNewPromptContext] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const canCreate =
		newPromptName.trim() && newPromptGoal.trim() && newPromptContext.trim();

	const handleCreate = async () => {
		if (!canCreate) return;

		setIsCreating(true);
		try {
			await createPrompt({
				name: newPromptName.trim(),
				goal: newPromptGoal.trim(),
				context: newPromptContext.trim(),
			});
			toast.success("Prompt created");
			setShowCreateDialog(false);
			setNewPromptName("");
			setNewPromptGoal("");
			setNewPromptContext("");
		} catch (_error) {
			toast.error("Failed to create prompt");
		} finally {
			setIsCreating(false);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "deployed":
				return (
					<Badge variant="default" className="bg-green-500">
						<Rocket className="h-3 w-3 mr-1" />
						Deployed
					</Badge>
				);
			case "paused":
				return (
					<Badge variant="secondary">
						<Pause className="h-3 w-3 mr-1" />
						Paused
					</Badge>
				);
			default:
				return (
					<Badge variant="outline">
						<FileText className="h-3 w-3 mr-1" />
						Draft
					</Badge>
				);
		}
	};

	if (isLoading) {
		return <Loading />;
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-semibold">Prompts</h1>
					<p className="text-muted-foreground">
						Create and tune your AI prompts
					</p>
				</div>
				<Button onClick={() => setShowCreateDialog(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New Prompt
				</Button>
			</div>

			{prompts && prompts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{(prompts as Prompt[]).map((prompt: Prompt) => (
						<Link
							key={prompt._id}
							to="/prompts/$promptId"
							params={{ promptId: prompt._id }}
						>
							<Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
								<CardHeader>
									<div className="flex justify-between items-start">
										<CardTitle className="text-lg">{prompt.name}</CardTitle>
										{getStatusBadge(prompt.deploymentStatus)}
									</div>
									<CardDescription className="flex items-center gap-1 text-xs">
										<Clock className="h-3 w-3" />
										Last active{" "}
										{new Date(prompt.lastActivityAt).toLocaleDateString()}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-sm text-muted-foreground">
										Click to open tuning interface
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No prompts yet</h3>
						<p className="text-muted-foreground mb-4 text-center max-w-md">
							Create your first prompt to start tuning AI responses through
							simple reactions.
						</p>
						<Button onClick={() => setShowCreateDialog(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Create First Prompt
						</Button>
					</CardContent>
				</Card>
			)}

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Create New Prompt</DialogTitle>
						<DialogDescription>
							Provide a name, goal, and context to generate a starter prompt.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="e.g., Customer Support Bot"
								value={newPromptName}
								onChange={(e) => setNewPromptName(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="goal">Goal</Label>
							<Textarea
								id="goal"
								placeholder="What should this prompt help accomplish?"
								value={newPromptGoal}
								onChange={(e) => setNewPromptGoal(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="context">Context</Label>
							<Textarea
								id="context"
								placeholder="What's the context? (e.g., target audience, product, constraints)"
								value={newPromptContext}
								onChange={(e) => setNewPromptContext(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCreateDialog(false)}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button onClick={handleCreate} disabled={!canCreate || isCreating}>
							{isCreating ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
