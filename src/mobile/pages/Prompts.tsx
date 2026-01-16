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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Skeleton,
} from "@/components/ui";

export function PromptsPage() {
	const { prompts, isLoading, createPrompt } = usePrompts();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newPromptName, setNewPromptName] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const handleCreate = async () => {
		if (!newPromptName.trim()) return;

		setIsCreating(true);
		try {
			await createPrompt({ name: newPromptName.trim() });
			toast.success("Prompt created");
			setShowCreateDialog(false);
			setNewPromptName("");
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
		return (
			<div className="p-4 space-y-4">
				<Skeleton className="h-8 w-32" />
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20" />
				))}
			</div>
		);
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
					</DialogHeader>
					<div className="py-4">
						<Input
							placeholder="Enter prompt name..."
							value={newPromptName}
							onChange={(e) => setNewPromptName(e.target.value)}
							className="text-base"
							autoFocus
						/>
					</div>
					<DialogFooter className="flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => setShowCreateDialog(false)}
							disabled={isCreating}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!newPromptName.trim() || isCreating}
							className="flex-1"
						>
							{isCreating ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
