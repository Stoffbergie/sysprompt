import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
	"auto checkpoint active sessions",
	{ minutes: 30 },
	internal.checkpoints.runAutoCheckpoints,
	{},
);

crons.interval(
	"detect production patterns",
	{ hours: 1 },
	internal.patterns.runPatternDetection,
	{},
);

crons.interval(
	"cleanup expired streams",
	{ minutes: 1 },
	internal.streams.cleanupExpiredStreams,
	{},
);

export default crons;
