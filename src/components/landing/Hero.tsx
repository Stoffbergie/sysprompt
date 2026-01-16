import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { useAppAuth } from "@/shared";
import { DashboardPreview } from "./DashboardPreview";

export function Hero() {
	const { signIn } = useAppAuth();

	return (
		<section className="relative overflow-hidden px-6 pt-16 pb-32 bg-background">
			<div className="relative mx-auto max-w-7xl">
				<div className="mx-auto max-w-3xl text-center">
					{/* Badge */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5"
					>
						<span className="text-sm font-medium text-muted-foreground">
							Express taste, not requirements
						</span>
					</motion.div>

					{/* Heading */}
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
					>
						Prompt Engineering{" "}
						<span className="text-primary">Through Discovery</span>
					</motion.h1>

					{/* Description */}
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="mb-10 text-lg text-muted-foreground leading-relaxed"
					>
						Stop writing specifications. Start expressing taste. SysPrompt transforms
						prompt engineering from requirements gathering into an intuitive discovery
						process. Give feedback, see improvement, ship better prompts.
					</motion.p>

					{/* CTA Buttons */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						className="flex flex-wrap items-center justify-center gap-4"
					>
						<button
							type="button"
							onClick={() => signIn()}
							className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
						>
							Start Building
						</button>

						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-accent transition-colors"
						>
							<Github className="h-4 w-4" />
							Learn More
						</a>
					</motion.div>
				</div>

				{/* Dashboard Preview */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-20"
				>
					<div className="relative mx-auto max-w-5xl">
						<div className="rounded-lg border border-border bg-card overflow-hidden">
							{/* Browser Header */}
							<div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
								<div className="flex gap-1.5">
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
									<div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
								</div>
								<div className="flex-1 flex justify-center">
									<div className="flex items-center gap-2 rounded-md bg-card border border-border px-3 py-1 text-xs text-muted-foreground">
										sysprompt.ai/flow
									</div>
								</div>
							</div>

							{/* Dashboard Content */}
							<div className="p-4 bg-muted/50">
								<DashboardPreview />
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
