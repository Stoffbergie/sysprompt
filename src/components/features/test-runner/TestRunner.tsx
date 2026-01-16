import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import {
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Loader2,
	Play,
	Trash2,
	XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Progress,
	Skeleton,
} from "@/components/ui";

interface TestRunnerProps {
	promptId: Id<"prompts">;
}

type TestResult = {
	testCaseId: Id<"testCases">;
	question: string;
	expectedResponse: string;
	actualResponse: string;
	passed: boolean;
	score: number;
};

type TestResults = {
	total: number;
	passed: number;
	failed: number;
	results: TestResult[];
};

export function TestRunner({ promptId }: TestRunnerProps) {
	const testCases = useQuery(api.testCases.list, { promptId });
	const runTests = useAction(api.testCases.runTests);
	const deleteTestCase = useMutation(api.testCases.remove);

	const [isRunning, setIsRunning] = useState(false);
	const [results, setResults] = useState<TestResults | null>(null);

	const handleRunTests = useCallback(async () => {
		setIsRunning(true);
		setResults(null);

		try {
			const testResults = await runTests({ promptId });
			setResults(testResults);
			if (testResults.failed === 0) {
				toast.success(`All ${testResults.total} tests passed!`);
			} else {
				toast.warning(
					`${testResults.passed}/${testResults.total} tests passed`,
				);
			}
		} catch {
			toast.error("Failed to run tests");
		} finally {
			setIsRunning(false);
		}
	}, [promptId, runTests]);

	const handleDelete = useCallback(
		async (testCaseId: Id<"testCases">) => {
			try {
				await deleteTestCase({ testCaseId });
				toast.success("Test case deleted");
				setResults(null);
			} catch {
				toast.error("Failed to delete");
			}
		},
		[deleteTestCase],
	);

	if (testCases === undefined) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (testCases.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<p>No test cases yet</p>
				<p className="text-sm mt-1">
					Test cases are created automatically when you approve responses
				</p>
			</div>
		);
	}

	const passRate = results
		? Math.round((results.passed / results.total) * 100)
		: null;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium">Test Suite</h3>
					<p className="text-sm text-muted-foreground">
						{testCases.length} test cases
					</p>
				</div>
				<Button
					onClick={handleRunTests}
					disabled={isRunning || testCases.length === 0}
				>
					{isRunning ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Running...
						</>
					) : (
						<>
							<Play className="h-4 w-4 mr-2" />
							Run Tests
						</>
					)}
				</Button>
			</div>

			{results && (
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">Test Results</CardTitle>
							<Badge
								variant={results.failed === 0 ? "default" : "destructive"}
							>
								{results.passed}/{results.total} passed
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<Progress value={passRate ?? 0} className="h-2 mb-4" />
						<div className="grid grid-cols-3 gap-4 text-center text-sm">
							<div>
								<div className="text-2xl font-bold">{results.total}</div>
								<div className="text-muted-foreground">Total</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">
									{results.passed}
								</div>
								<div className="text-muted-foreground">Passed</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-red-600">
									{results.failed}
								</div>
								<div className="text-muted-foreground">Failed</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="space-y-2">
				{testCases.map((testCase) => {
					const result = results?.results.find(
						(r) => r.testCaseId === testCase._id,
					);
					return (
						<TestCaseCard
							key={testCase._id}
							testCase={testCase}
							result={result}
							onDelete={() => handleDelete(testCase._id)}
						/>
					);
				})}
			</div>
		</div>
	);
}

interface TestCaseCardProps {
	testCase: {
		_id: Id<"testCases">;
		question: string;
		approvedResponse: string;
		source: string;
	};
	result?: TestResult;
	onDelete: () => void;
}

function TestCaseCard({ testCase, result, onDelete }: TestCaseCardProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{isOpen ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
								{result && (
									result.passed ? (
										<CheckCircle className="h-4 w-4 text-green-600" />
									) : (
										<XCircle className="h-4 w-4 text-red-600" />
									)
								)}
								<span className="text-sm font-medium truncate max-w-md">
									{testCase.question}
								</span>
							</div>
							<div className="flex items-center gap-2">
								{result && (
									<Badge variant="outline" className="text-xs">
										{Math.round(result.score * 100)}% match
									</Badge>
								)}
								<Badge variant="secondary" className="text-xs">
									{testCase.source}
								</Badge>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={(e) => {
										e.stopPropagation();
										onDelete();
									}}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-0 space-y-3">
						<div>
							<h4 className="text-xs font-medium text-muted-foreground mb-1">
								Expected Response
							</h4>
							<p className="text-sm p-2 bg-muted rounded">
								{testCase.approvedResponse}
							</p>
						</div>
						{result && (
							<div>
								<h4 className="text-xs font-medium text-muted-foreground mb-1">
									Actual Response
								</h4>
								<p
									className={`text-sm p-2 rounded ${
										result.passed
											? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
											: "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
									}`}
								>
									{result.actualResponse}
								</p>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
