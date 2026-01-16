import { motion, useInView } from "framer-motion";
import {
	Code2,
	Database,
	Layers,
	RefreshCw,
	Rocket,
	Shield,
	Zap,
} from "lucide-react";
import { useRef } from "react";

const features = [
	{
		title: "Flow Mode",
		description:
			"Express your taste through intuitive feedback. Approve, reject, or refine responses in a fluid discovery process that feels natural.",
		icon: RefreshCw,
		span: "md:col-span-2 md:row-span-2",
		large: true,
	},
	{
		title: "Pattern Detection",
		description: "AI identifies recurring issues and suggests targeted improvements.",
		icon: Layers,
	},
	{
		title: "Test Cases",
		description:
			"Approved responses become regression tests. Your prompts stay consistent.",
		icon: Shield,
	},
	{
		title: "Better Prompts",
		description:
			"Transform vague requirements into precise, effective system prompts.",
		icon: Rocket,
		stat: "10X",
	},
	{
		title: "Production Ready",
		description:
			"Deploy prompts with versioning, monitoring, and rollback capabilities.",
		icon: Database,
	},
	{
		title: "Real-Time Insights",
		description:
			"Monitor production performance and iterate based on actual user feedback.",
		icon: Code2,
	},
];

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function Features() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	return (
		<section id="features" className="py-24 px-6 bg-background">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<motion.span
							initial={{ opacity: 0, scale: 0.9 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
							className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-4"
						>
							<Layers className="h-4 w-4" />
							FEATURES
						</motion.span>
						<h2 className="text-4xl font-bold text-foreground md:text-5xl">
							Built for Discovery
						</h2>
						<p className="mt-4 text-lg text-muted-foreground max-w-xl">
							Everything you need to craft, test, and deploy production-ready prompts.
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="mt-6 md:mt-0"
					>
						<span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
							<Zap className="h-4 w-4" />6 Core Features
						</span>
					</motion.div>
				</div>

				{/* Bento Grid */}
				<motion.div
					ref={ref}
					variants={container}
					initial="hidden"
					animate={isInView ? "show" : "hidden"}
					className="grid gap-4 md:grid-cols-3 auto-rows-fr"
				>
					{features.map((feature) => (
						<motion.div
							key={feature.title}
							variants={item}
							className={`relative rounded-lg overflow-hidden ${feature.span || ""} ${
								feature.large
									? "bg-primary p-8 text-white"
									: feature.stat
										? "bg-muted p-6"
										: "border border-border bg-card p-6"
							}`}
						>
							{/* Large Feature Card */}
							{feature.large && (
								<div className="flex h-full flex-col justify-between">
									<div>
										<div className="mb-6 inline-flex items-center gap-2 rounded-md bg-white/20 px-3 py-1.5">
											<feature.icon className="h-4 w-4" />
											<span className="text-sm font-medium">Flow Mode</span>
										</div>
										<h3 className="mb-4 text-2xl font-bold">
											Discover Your Perfect Prompt
										</h3>
										<p className="text-white/80 leading-relaxed">
											{feature.description}
										</p>
									</div>

									<div className="mt-8 flex items-center gap-2">
										<Zap className="h-5 w-5" />
										<span className="font-medium">Intuitive feedback loop</span>
									</div>
								</div>
							)}

							{/* Stat Card */}
							{feature.stat && (
								<div>
									<div className="mb-4">
										<span className="text-5xl font-bold text-primary">
											{feature.stat}
										</span>
									</div>
									<h3 className="mb-2 text-lg font-bold text-foreground">
										{feature.title}
									</h3>
									<p className="text-muted-foreground">{feature.description}</p>
								</div>
							)}

							{/* Regular Feature Card */}
							{!feature.large && !feature.stat && (
								<>
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
										<feature.icon className="h-5 w-5 text-primary" />
									</div>
									<h3 className="mb-2 text-lg font-bold text-card-foreground">
										{feature.title}
									</h3>
									<p className="text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</>
							)}
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
