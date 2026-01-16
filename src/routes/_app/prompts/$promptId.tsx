import { createFileRoute } from "@tanstack/react-router";
import { TuningPage as DesktopTuning } from "@/desktop";
import { TuningPage as MobileTuning } from "@/mobile";
import { useMobile } from "@/shared";

export const Route = createFileRoute("/_app/prompts/$promptId")({
	component: TuningRoute,
});

function TuningRoute() {
	const { promptId } = Route.useParams();
	const isMobile = useMobile();
	return isMobile ? (
		<MobileTuning promptId={promptId} />
	) : (
		<DesktopTuning promptId={promptId} />
	);
}
