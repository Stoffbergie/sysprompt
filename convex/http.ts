import { httpRouter } from "convex/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

const http = httpRouter();

function buildSystemPrompt(
	basePrompt: string,
	hardRules: Array<{ type: string; value: string; scope: string }>,
	softPrefs: Array<{ dimension: string; direction: string; strength: number }>,
	modifier?: string,
	feedback?: { previousResponse: string; feedbackText: string },
): string {
	let prompt = basePrompt || "";

	if (hardRules.length > 0) {
		const bans = hardRules.filter((r) => r.type === "phrase_ban");
		const requires = hardRules.filter((r) => r.type === "phrase_require");

		if (bans.length > 0) {
			prompt += "\n\nNEVER use these phrases:\n";
			prompt += bans.map((r) => `- "${r.value}"`).join("\n");
		}

		if (requires.length > 0) {
			prompt += "\n\nALWAYS include:\n";
			prompt += requires.map((r) => `- ${r.value}`).join("\n");
		}
	}

	if (softPrefs.length > 0) {
		prompt += "\n\nStyle preferences:\n";
		for (const pref of softPrefs) {
			if (pref.dimension === "length") {
				prompt +=
					pref.direction === "shorter"
						? "- Keep responses concise and brief.\n"
						: "- Provide thorough, detailed responses.\n";
			} else if (pref.dimension === "tone") {
				prompt += `- Use a ${pref.direction} tone.\n`;
			} else if (pref.dimension === "formality") {
				prompt +=
					pref.direction === "casual"
						? "- Use a casual, conversational style.\n"
						: "- Use a formal, professional style.\n";
			}
		}
	}

	if (modifier === "shorter") {
		prompt +=
			"\n\nIMPORTANT: Make this response SHORTER. Be more concise while keeping the key information.";
	} else if (modifier === "longer") {
		prompt +=
			"\n\nIMPORTANT: Make this response LONGER. Add more detail, examples, and thorough explanation.";
	}

	if (feedback) {
		prompt += `\n\nIMPORTANT: The user rejected a previous response with this feedback: "${feedback.feedbackText}"\nMake sure to address this concern in your response.`;
	}

	return prompt;
}

http.route({
	path: "/api/stream/generate",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		let body: { streamId: Id<"streams"> };

		try {
			body = await request.json();
		} catch {
			return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { streamId } = body;

		const streamContext = await ctx.runQuery(api.streams.getStreamContext, {
			streamId,
		});
		if (!streamContext) {
			return new Response(JSON.stringify({ error: "Stream not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		if (streamContext.status !== "pending") {
			return new Response(null, { status: 205 });
		}

		const { promptId, question, modifier, feedback } = streamContext;

		const context = await ctx.runQuery(
			internal.tuningHelpers.getStreamingContext,
			{ promptId },
		);

		const systemPrompt = buildSystemPrompt(
			context.promptText,
			context.hardRules,
			context.softPrefs,
			modifier,
			feedback,
		);

		const apiKey = process.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			await ctx.runMutation(api.streams.setStreamStatus, {
				streamId,
				status: "error",
			});
			return new Response(
				JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "https://sysprompt.app",
					"X-Title": "SysPrompt",
				},
				body: JSON.stringify({
					model: "anthropic/claude-sonnet-4",
					messages: [
						{
							role: "system",
							content: systemPrompt || "You are a helpful assistant.",
						},
						{ role: "user", content: question },
					],
					stream: true,
					max_tokens: 2000,
				}),
			},
		);

		if (!response.ok || !response.body) {
			await ctx.runMutation(api.streams.setStreamStatus, {
				streamId,
				status: "error",
			});
			return new Response(JSON.stringify({ error: "Failed to call LLM" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		const encoder = new TextEncoder();
		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		let buffer = "";

		const stream = new ReadableStream({
			async start(controller) {
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || "";

						for (const line of lines) {
							if (line.startsWith("data: ")) {
								const data = line.slice(6);
								if (data === "[DONE]") continue;

								try {
									const parsed = JSON.parse(data);
									const content = parsed.choices?.[0]?.delta?.content;
									if (content) {
										controller.enqueue(encoder.encode(content));
										await ctx.runMutation(api.streams.addChunk, {
											streamId,
											text: content,
											final: false,
										});
									}
								} catch {}
							}
						}
					}

					await ctx.runMutation(api.streams.addChunk, {
						streamId,
						text: "",
						final: true,
					});
					controller.close();
				} catch (error) {
					await ctx.runMutation(api.streams.setStreamStatus, {
						streamId,
						status: "error",
					});
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	}),
});

http.route({
	path: "/api/v1/chat/completions",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Missing or invalid Authorization header" }),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			);
		}

		const apiKey = authHeader.substring(7);

		const prompt = await ctx.runQuery(internal.productionHelpers.getPromptByApiKey, {
			apiKey,
		});

		if (!prompt) {
			return new Response(JSON.stringify({ error: "Invalid API key" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		let body: {
			messages?: Array<{ role: string; content: string }>;
			model?: string;
		};
		try {
			body = await request.json();
		} catch {
			return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const messages = body.messages ?? [];
		const userMessage = messages.find((m) => m.role === "user")?.content ?? "";

		const startTime = Date.now();

		try {
			const response = await ctx.runAction(internal.production.proxyRequest, {
				promptId: prompt.promptId,
				versionId: prompt.versionId,
				systemPrompt: prompt.promptText,
				userMessage,
				model: body.model ?? "gpt-4o-mini",
			});

			const latencyMs = Date.now() - startTime;

			await ctx.runMutation(internal.productionHelpers.logCall, {
				promptId: prompt.promptId,
				versionId: prompt.versionId,
				input: userMessage,
				output: response,
				latencyMs,
			});

			return new Response(
				JSON.stringify({
					id: `chatcmpl-${Date.now()}`,
					object: "chat.completion",
					created: Math.floor(Date.now() / 1000),
					model: body.model ?? "gpt-4o-mini",
					choices: [
						{
							index: 0,
							message: {
								role: "assistant",
								content: response,
							},
							finish_reason: "stop",
						},
					],
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			const latencyMs = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await ctx.runMutation(internal.productionHelpers.logCall, {
				promptId: prompt.promptId,
				versionId: prompt.versionId,
				input: userMessage,
				output: "",
				latencyMs,
				error: errorMessage,
			});

			return new Response(JSON.stringify({ error: errorMessage }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	}),
});

http.route({
	path: "/api/v1/feedback",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "Missing or invalid Authorization header" }),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			);
		}

		const apiKey = authHeader.substring(7);

		const prompt = await ctx.runQuery(internal.productionHelpers.getPromptByApiKey, {
			apiKey,
		});

		if (!prompt) {
			return new Response(JSON.stringify({ error: "Invalid API key" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		let body: { callId?: string; rating?: string; comment?: string };
		try {
			body = await request.json();
		} catch {
			return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!body.callId || !body.rating) {
			return new Response(
				JSON.stringify({ error: "Missing callId or rating" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		if (body.rating !== "up" && body.rating !== "down") {
			return new Response(
				JSON.stringify({ error: "Rating must be 'up' or 'down'" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		try {
			await ctx.runMutation(internal.productionHelpers.recordFeedback, {
				callId: body.callId,
				rating: body.rating,
				comment: body.comment,
			});

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} catch {
			return new Response(
				JSON.stringify({ error: "Failed to record feedback" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
	}),
});

export default http;
