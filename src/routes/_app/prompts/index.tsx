import { createFileRoute } from "@tanstack/react-router";
import { PromptsPage as DesktopPrompts } from "@/desktop";
import { PromptsPage as MobilePrompts } from "@/mobile";
import { useMobile } from "@/shared";

export const Route = createFileRoute("/_app/prompts/")({
	component: PromptsIndexRoute,
});

function PromptsIndexRoute() {
	const isMobile = useMobile();
	return isMobile ? <MobilePrompts /> : <DesktopPrompts />;
}
