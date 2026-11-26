import { join } from "node:path";
import { createTaskReply } from "./agent.ts";
import { createApp } from "./app.ts";
import { isModelConfigured } from "./model.ts";
import { createJsonTaskStore } from "./task-store.ts";

const tasks = createJsonTaskStore(join("data", "tasks.json"));
const app = createApp({ reply: createTaskReply(tasks), tasks, chatAvailable: isModelConfigured() });
const port = Number(process.env.PORT || 3000);
app.listen(port, "127.0.0.1", () => console.log(`Tokenow·NowDo 已启动：http://127.0.0.1:${port}`));
