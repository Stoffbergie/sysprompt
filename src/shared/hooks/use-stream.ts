import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type StreamStatus = "pending" | "streaming" | "done" | "error" | "timeout";

interface StreamBody {
	text: string;
	status: StreamStatus;
}

export function useStream(
	streamUrl: string,
	driven: boolean,
	streamId: Id<"streams"> | undefined,
	opts?: {
		authToken?: string | null;
		headers?: Record<string, string>;
	},
): StreamBody {
	const [streamEnded, setStreamEnded] = useState<boolean | null>(null);
	const streamStarted = useRef(false);

	const usePersistence = useMemo(() => {
		if (streamEnded === false) {
			return true;
		}
		if (!driven) {
			return true;
		}
		return false;
	}, [driven, streamEnded]);

	const persistentBody = useQuery(
		api.streams.getStreamText,
		usePersistence && streamId ? { streamId } : "skip",
	);

	const [streamBody, setStreamBody] = useState<string>("");

	useEffect(() => {
		if (driven && streamId && !streamStarted.current) {
			void (async () => {
				const success = await startStreaming(
					streamUrl,
					streamId,
					(text) => {
						setStreamBody((prev) => prev + text);
					},
					{
						...opts?.headers,
						...(opts?.authToken
							? { Authorization: `Bearer ${opts.authToken}` }
							: {}),
					},
				);
				setStreamEnded(success);
			})();
			return () => {
				streamStarted.current = true;
			};
		}
	}, [driven, streamUrl, streamId, opts?.authToken, opts?.headers]);

	const body = useMemo<StreamBody>(() => {
		if (persistentBody) {
			return persistentBody;
		}
		let status: StreamStatus;
		if (streamEnded === null) {
			status = streamBody.length > 0 ? "streaming" : "pending";
		} else {
			status = streamEnded ? "done" : "error";
		}
		return {
			text: streamBody,
			status,
		};
	}, [persistentBody, streamBody, streamEnded]);

	return body;
}

async function startStreaming(
	url: string,
	streamId: Id<"streams">,
	onUpdate: (text: string) => void,
	headers: Record<string, string>,
): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: "POST",
			body: JSON.stringify({ streamId }),
			headers: { "Content-Type": "application/json", ...headers },
		});

		if (response.status === 205) {
			console.error("Stream already finished", response);
			return false;
		}
		if (!response.ok) {
			console.error("Failed to reach streaming endpoint", response);
			return false;
		}
		if (!response.body) {
			console.error("No body in response", response);
			return false;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				if (value) {
					onUpdate(decoder.decode(value));
				}
				return true;
			}
			onUpdate(decoder.decode(value));
		}
	} catch (e) {
		console.error("Error reading stream", e);
		return false;
	}
}
