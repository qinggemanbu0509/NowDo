import { useEffect, useRef } from "react";
import type { ChatMessage } from "../shared/chat.ts";
import { useLanguage } from "./interface-language.tsx";

export function ChatHistory({
  messages,
  pendingMessage,
  failed,
}: {
  messages: ChatMessage[];
  pendingMessage?: string;
  failed: boolean;
}) {
  const { t } = useLanguage();
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages, pendingMessage, failed]);

  const visible = pendingMessage
    ? [...messages, { role: "user", content: pendingMessage } as const]
    : messages;

  return (
    <div
      className="agent-messages"
      ref={viewport}
      role="log"
      aria-label={t("conversationLog")}
      aria-live="polite"
    >
      {visible.length === 0 && !failed ? <p className="page-empty">{t("chatExample")}</p> : null}
      {visible.map((message, index) => (
        <div key={index} className="message" data-role={message.role}>
          <small>{message.role === "user" ? t("you") : "NowDo"}</small>
          <p>{message.content}</p>
        </div>
      ))}
      {pendingMessage ? (
        <p className="page-empty" role="status">{t("chatWaiting")}</p>
      ) : null}
      {failed ? (
        <p className="page-empty" role="alert">{t("chatFailed")}</p>
      ) : null}
    </div>
  );
}
