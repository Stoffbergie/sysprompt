import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Convex Cron Jobs
 *
 * Cron jobs run on a schedule and execute internal functions.
 * Use internal functions (not public mutations) for security.
 *
 * @see https://docs.convex.dev/scheduling/cron-jobs
 */
const crons = cronJobs();

/**
 * Reset the demo grid to show a smiley face pattern every hour.
 * This keeps the landing page demo fresh and engaging.
 */
crons.interval(
	"reset demo grid to smiley",
	{ hours: 1 },
	internal.demoGrid.resetToSmiley,
	{},
);

/**
 * Clean up old demo todos every 6 hours.
 * Removes demo todos older than 24 hours to prevent clutter.
 */
crons.interval(
	"cleanup old demo todos",
	{ hours: 6 },
	internal.todos.cleanupOldDemoTodos,
	{},
);

/**
 * Auto-checkpoint active prompt tuning sessions every 30 minutes.
 * Creates automatic version snapshots for sessions with activity.
 * Also triggers background optimization after checkpoint.
 */
crons.interval(
	"auto checkpoint active sessions",
	{ minutes: 30 },
	internal.checkpoints.runAutoCheckpoints,
	{},
);

/**
 * Detect patterns in production feedback every hour.
 * Analyzes unhappy responses and clusters them into actionable patterns.
 */
crons.interval(
	"detect production patterns",
	{ hours: 1 },
	internal.patterns.runPatternDetection,
	{},
);

/**
 * Clean up expired streams every minute.
 * Streams older than 20 minutes in pending/streaming state are marked as timeout.
 */
crons.interval(
	"cleanup expired streams",
	{ minutes: 1 },
	internal.streams.cleanupExpiredStreams,
	{},
);

export default crons;
