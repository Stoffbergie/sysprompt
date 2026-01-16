import { motion } from "framer-motion";
import { Database, Radio, RotateCcw, Shield, Zap } from "lucide-react";
import { useState } from "react";

export function LiveDemo() {
	return (
		<section id="demo" className="py-24 px-6 bg-muted text-foreground">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<motion.span
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-4"
					>
						<Radio className="h-4 w-4" />
						INTERACTIVE DEMO
					</motion.span>
					<h2 className="text-4xl font-bold text-foreground md:text-5xl">
						See Convex in Action
					</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
						Real-time data sync with zero configuration. No WebSockets setup, no
						cache invalidation, it just works.
					</p>
				</motion.div>

				<div className="grid gap-8 lg:grid-cols-2 items-start">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.2 }}
					>
						<div className="rounded-lg border border-border bg-card overflow-hidden">
							<div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
								<div className="flex gap-1.5">
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
								</div>
								<span className="text-xs text-muted-foreground ml-2">
									component.tsx
								</span>
							</div>
							<pre className="p-4 text-sm overflow-x-auto">
								<code className="text-muted-foreground">
									<span className="text-muted-foreground/70">
										{"// Define your schema"}
									</span>
									{"\n"}
									{"export default "}
									<span className="text-foreground">defineSchema</span>
									{"({\n"}
									{"  grid: "}
									<span className="text-foreground">defineTable</span>
									{"({\n"}
									{"    row: "}
									<span className="text-muted-foreground">v.number</span>
									{"(),\n"}
									{"    col: "}
									<span className="text-muted-foreground">v.number</span>
									{"(),\n"}
									{"    checked: "}
									<span className="text-muted-foreground">v.boolean</span>
									{"(),\n"}
									{"  }),\n"}
									{"});\n\n"}
									<span className="text-muted-foreground/70">
										{"// Query - auto-updates in real-time"}
									</span>
									{"\n"}
									<span className="text-foreground">const</span>
									{" cells = "}
									<span className="text-foreground">useQuery</span>
									{"(api.grid.get);\n\n"}
									<span className="text-muted-foreground/70">
										{"// Mutation - syncs to all clients"}
									</span>
									{"\n"}
									<span className="text-foreground">const</span>
									{" toggle = "}
									<span className="text-foreground">useMutation</span>
									{"(api.grid.toggle);\n\n"}
									<span className="text-muted-foreground/70">
										{"// Use it"}
									</span>
									{"\n"}
									{"<"}
									<span className="text-muted-foreground">button</span>{" "}
									<span className="text-foreground">onClick</span>
									{"={() => "}
									<span className="text-foreground">toggle</span>
									{"({ row, col })} />\n"}
								</code>
							</pre>
						</div>
						<p className="mt-4 text-sm text-muted-foreground text-center">
							That's it. No WebSocket setup. No cache invalidation. It just
							works.
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.3 }}
					>
						<div className="rounded-lg border border-border bg-card p-8">
							<CheckboxGridDemo />
						</div>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.4 }}
					className="mt-16 grid gap-8 md:grid-cols-3"
				>
					{[
						{
							icon: Zap,
							title: "No Polling",
							description: "WebSocket-based real-time updates",
						},
						{
							icon: Database,
							title: "Automatic Caching",
							description: "Smart client-side caching built-in",
						},
						{
							icon: Shield,
							title: "Type-Safe Queries",
							description: "Full TypeScript inference",
						},
					].map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.5 + index * 0.1 }}
							className="text-center"
						>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted">
								<feature.icon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="font-bold text-foreground mb-1">
								{feature.title}
							</h3>
							<p className="text-sm text-muted-foreground">
								{feature.description}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}

const GRID_SIZE = 12;

function CheckboxGridDemo() {
	const [checkedCells, setCheckedCells] = useState<Set<string>>(new Set());

	const toggleCell = (row: number, col: number) => {
		const key = `${row}-${col}`;
		setCheckedCells((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const clearAll = () => {
		setCheckedCells(new Set());
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h3 className="text-xl font-bold text-card-foreground">
						Interactive Canvas
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Click any cell to toggle
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={clearAll}
						className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<RotateCcw className="h-3 w-3" />
						Clear
					</button>
					<div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
						</span>
						<span className="text-xs font-medium text-muted-foreground">
							Demo
						</span>
					</div>
				</div>
			</div>

			<div
				className="grid gap-1.5"
				style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
			>
				{Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
					const row = Math.floor(index / GRID_SIZE);
					const col = index % GRID_SIZE;
					const isChecked = checkedCells.has(`${row}-${col}`);

					return (
						<motion.button
							key={`${row}-${col}`}
							onClick={() => toggleCell(row, col)}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							className={`aspect-square rounded-md border-2 transition-colors ${
								isChecked
									? "border-primary bg-primary"
									: "border-border bg-muted hover:border-primary/50"
							}`}
						/>
					);
				})}
			</div>

			<div className="mt-4 text-center text-sm text-muted-foreground">
				{checkedCells.size} of {GRID_SIZE * GRID_SIZE} cells filled
			</div>
		</div>
	);
}
