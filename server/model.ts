import OpenAI from "openai";

export const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";

export class MissingDeepSeekKeyError extends Error {
  constructor() {
    super("请在 .env 中设置 DEEPSEEK_API_KEY 后重启服务。");
  }
}

function modelApiKey() {
  return process.env.DEEPSEEK_API_KEY?.trim();
}

export function isModelConfigured(): boolean {
  return Boolean(modelApiKey());
}

export function getModelClient(): OpenAI {
  const apiKey = modelApiKey();
  if (!apiKey) throw new MissingDeepSeekKeyError();
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
    timeout: 20_000,
    maxRetries: 0,
  });
}
