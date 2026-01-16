import { cn } from "@/lib/utils";

interface LogoProps {
	className?: string;
}

export function Logo({ className }: LogoProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			className={cn("text-primary", className)}
			xmlns="http://www.w3.org/2000/svg"
			aria-label="SysPrompt logo"
			role="img"
		>
			<path
				d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm-2.5 7h5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5h-5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5zm6 6h-7c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5h7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function LogoBrand({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Logo className="h-7 w-7" />
			<span className="text-lg font-semibold text-foreground">SysPrompt</span>
		</div>
	);
}
