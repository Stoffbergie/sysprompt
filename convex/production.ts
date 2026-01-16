"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const proxyRequest = internalAction({
	args: {
		promptId: v.id("prompts"),
		versionId: v.id("promptVersions"),
		systemPrompt: v.string(),
		userMessage: v.string(),
		model: v.string(),
	},
	returns: v.string(),
	handler: async (_ctx, args): Promise<string> => {
		const apiKey = process.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			throw new Error("OPENROUTER_API_KEY not configured");
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
					model: args.model,
					messages: [
						{
							role: "system",
							content: args.systemPrompt || "You are a helpful assistant.",
						},
						{ role: "user", content: args.userMessage },
					],
					max_tokens: 2000,
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`LLM call failed: ${error}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content ?? "";
	},
});
