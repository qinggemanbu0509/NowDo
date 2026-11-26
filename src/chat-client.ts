import type { ChatMessage, ChatReply } from "../shared/chat.ts";
import type { Language } from "../shared/language.ts";

export type ChatMode = "demo" | "live";

export async function getChatMode(): Promise<ChatMode> {
  const response = await fetch("/api/chat/config", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error("Chat configuration request failed");
  const config: { available?: unknown } | null = await response.json();
  if (typeof config?.available !== "boolean") throw new Error("Invalid chat configuration");
  return config.available ? "live" : "demo";
}

export async function requestReply(messages: ChatMessage[], language: Language): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.slice(-11),
      language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error("Chat request failed");
  const result: Partial<ChatReply> | null = await response.json();
  if (typeof result?.reply !== "string" || !result.reply.trim()) {
    throw new Error("Invalid chat reply");
  }
  return result.reply;
}
