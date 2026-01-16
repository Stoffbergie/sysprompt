import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { streamStatusValidator } from "./lib/validators";

export const createStream = mutation({
	args: {
		promptId: v.optional(v.id("prompts")),
		question: v.optional(v.string()),
		modifier: v.optional(v.union(v.literal("shorter"), v.literal("longer"))),
		feedback: v.optional(
			v.object({
				previousResponse: v.string(),
				feedbackText: v.string(),
			}),
		),
	},
	returns: v.id("streams"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("streams", {
			status: "pending",
			promptId: args.promptId,
			question: args.question,
			modifier: args.modifier,
			feedback: args.feedback,
		});
	},
});

export const addChunk = mutation({
	args: {
		streamId: v.id("streams"),
		text: v.string(),
		final: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const stream = await ctx.db.get(args.streamId);
		if (!stream) {
			throw new Error("Stream not found");
		}
		if (stream.status === "pending") {
			await ctx.db.patch(args.streamId, {
				status: "streaming",
			});
		} else if (stream.status !== "streaming") {
			throw new Error("Stream is not streaming; did it timeout?");
		}
		await ctx.db.insert("chunks", {
			streamId: args.streamId,
			text: args.text,
		});
		if (args.final) {
			await ctx.db.patch(args.streamId, {
				status: "done",
			});
		}
		return null;
	},
});

export const setStreamStatus = mutation({
	args: {
		streamId: v.id("streams"),
		status: streamStatusValidator,
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const stream = await ctx.db.get(args.streamId);
		if (!stream) {
			throw new Error("Stream not found");
		}
		if (stream.status !== "pending" && stream.status !== "streaming") {
			console.log(
				"Stream is already finalized; ignoring status change",
				stream,
			);
			return null;
		}
		await ctx.db.patch(args.streamId, {
			status: args.status,
		});
		return null;
	},
});

export const getStreamStatus = query({
	args: {
		streamId: v.id("streams"),
	},
	returns: streamStatusValidator,
	handler: async (ctx, args) => {
		const stream = await ctx.db.get(args.streamId);
		return stream?.status ?? "error";
	},
});

export const getStreamText = query({
	args: {
		streamId: v.id("streams"),
	},
	returns: v.object({
		text: v.string(),
		status: streamStatusValidator,
	}),
	handler: async (ctx, args) => {
		const stream = await ctx.db.get(args.streamId);
		if (!stream) {
			throw new Error("Stream not found");
		}
		let text = "";
		if (stream.status !== "pending") {
			const chunks = await ctx.db
				.query("chunks")
				.withIndex("by_streamId", (q) => q.eq("streamId", args.streamId))
				.collect();
			text = chunks.map((chunk) => chunk.text).join("");
		}
		return {
			text,
			status: stream.status,
		};
	},
});

export const getStreamContext = query({
	args: {
		streamId: v.id("streams"),
	},
	returns: v.union(
		v.object({
			status: streamStatusValidator,
			promptId: v.id("prompts"),
			question: v.string(),
			modifier: v.optional(v.union(v.literal("shorter"), v.literal("longer"))),
			feedback: v.optional(
				v.object({
					previousResponse: v.string(),
					feedbackText: v.string(),
				}),
			),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const stream = await ctx.db.get(args.streamId);
		if (!stream || !stream.promptId || !stream.question) {
			return null;
		}
		return {
			status: stream.status,
			promptId: stream.promptId,
			question: stream.question,
			modifier: stream.modifier,
			feedback: stream.feedback,
		};
	},
});

const EXPIRATION_TIME = 20 * 60 * 1000; // 20 minutes
const BATCH_SIZE = 100;

export const cleanupExpiredStreams = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const now = Date.now();
		const pendingStreams = await ctx.db
			.query("streams")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.take(BATCH_SIZE);
		const streamingStreams = await ctx.db
			.query("streams")
			.withIndex("by_status", (q) => q.eq("status", "streaming"))
			.take(BATCH_SIZE);

		for (const stream of [...pendingStreams, ...streamingStreams]) {
			if (now - stream._creationTime > EXPIRATION_TIME) {
				console.log("Cleaning up expired stream", stream._id);
				await ctx.db.patch(stream._id, {
					status: "timeout",
				});
			}
		}
		return null;
	},
});
