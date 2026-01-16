import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/prompts")({
	component: PromptsLayout,
});

function PromptsLayout() {
	return <Outlet />;
}
