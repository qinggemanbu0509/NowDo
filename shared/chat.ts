import { z } from "zod";
import { languages } from "./language.ts";
import type { TaskRecord } from "./tasks.ts";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export type ChatMessage = z.infer<typeof messageSchema>;

export interface ChatReply {
  reply: string;
  change?: { type: "created" | "completed"; task: TaskRecord };
}

export const chatRequestSchema = z.object({
  language: z.enum(languages).optional(),
  timeZone: z
    .string()
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    })
    .optional(),
  messages: z
    .array(messageSchema)
    .min(1)
    .refine((messages) => messages.at(-1)?.role === "user"),
});
