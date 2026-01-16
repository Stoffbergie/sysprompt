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

import { ChevronRight, FileText, Pause, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";
import {
	Badge,
	Button,
	Card,
	CardContent,
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
					<Badge variant="default" className="bg-green-500 text-xs">
						<Rocket className="h-3 w-3 mr-1" />
						Live
					</Badge>
				);
			case "paused":
				return (
					<Badge variant="secondary" className="text-xs">
						<Pause className="h-3 w-3 mr-1" />
						Paused
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="text-xs">
						Draft
					</Badge>
				);
		}
	};

	if (isLoading) {
		return <Loading />;
	}

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b">
				<h1 className="text-xl font-semibold">Prompts</h1>
			</div>

			<div className="flex-1 overflow-auto p-4 space-y-3">
				{prompts && prompts.length > 0 ? (
					(prompts as Prompt[]).map((prompt: Prompt) => (
						<Link
							key={prompt._id}
							to="/prompts/$promptId"
							params={{ promptId: prompt._id }}
						>
							<Card className="active:bg-muted/50">
								<CardContent className="p-4 flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium truncate">
												{prompt.name}
											</span>
											{getStatusBadge(prompt.deploymentStatus)}
										</div>
										<div className="text-xs text-muted-foreground">
											Last active{" "}
											{new Date(prompt.lastActivityAt).toLocaleDateString()}
										</div>
									</div>
									<ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
								</CardContent>
							</Card>
						</Link>
					))
				) : (
					<div className="flex flex-col items-center justify-center py-12">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground mb-4 text-center">
							No prompts yet
						</p>
					</div>
				)}
			</div>

			<div
				className="p-4 border-t"
				style={{
					paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
				}}
			>
				<Button
					className="w-full h-12"
					onClick={() => setShowCreateDialog(true)}
				>
					<Plus className="h-4 w-4 mr-2" />
					New Prompt
				</Button>
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
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
								className="text-base"
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
								className="text-base"
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
								className="text-base"
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter className="flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => setShowCreateDialog(false)}
							disabled={isCreating}
							className="flex-1 h-12"
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!canCreate || isCreating}
							className="flex-1 h-12"
						>
							{isCreating ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
