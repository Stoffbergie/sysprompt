import { spawnSync } from "node:child_process";

const result = spawnSync(
	"bunx",
	[
		"react-doctor",
		"--json",
		"--no-score",
		"--blocking",
		"error",
		"--category",
		"Bugs",
		"--category",
		"Security",
		"--category",
		"Accessibility",
		"--yes",
	],
	{ encoding: "utf8" },
);

if (result.stderr) {
	process.stderr.write(result.stderr);
}

const output = result.stdout.trim();

if (!output) {
	process.exit(result.status ?? 1);
}

let report;

try {
	report = JSON.parse(output);
} catch {
	process.stdout.write(output);
	process.exit(result.status ?? 1);
}

const diagnostics = report.diagnostics ?? [];
const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");

if (errors.length > 0 || report.ok === false) {
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
	process.exit(1);
}

console.log("React Doctor passed");
