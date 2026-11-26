import { Router } from "express";
import { z } from "zod";
import { clockTimePattern, readDueDate } from "../shared/scheduling.ts";
import { taskPriorities } from "../shared/tasks.ts";
import type { TaskStore } from "./task-store.ts";

export const createTaskSchema = z.strictObject({ title: z.string().trim().min(1).max(200) });
const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    done: z.boolean().optional(),
    dueDate: z.iso.date().nullable().optional(),
    startTime: z.string().regex(clockTimePattern).nullable().optional(),
    priority: z.enum(taskPriorities).nullable().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0);

const taskNotFound = { error: "找不到这条任务。" };

export function taskRouter(tasks: TaskStore) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(tasks.list());
  });

  router.post("/", (req, res) => {
    const input = createTaskSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ error: "请提供 1 至 200 个字符的任务标题。" });
    }
    res.status(201).json(tasks.create(input.data.title));
  });

  router.patch("/:id", (req, res) => {
    const input = updateTaskSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ error: "请提供有效的标题、完成状态、日期、时间或优先级。" });
    }

    if (input.data.startTime) {
      const current = tasks.list().find((task) => task.id === req.params.id);
      if (!current) return res.status(404).json(taskNotFound);
      const dueDate =
        input.data.dueDate === undefined ? readDueDate(current.dueDate) : input.data.dueDate;
      if (!dueDate) return res.status(400).json({ error: "设置时间前，请先选择日期。" });
    }

    const updated = tasks.update(req.params.id, input.data);
    if (!updated) return res.status(404).json(taskNotFound);
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    if (!tasks.remove(req.params.id)) return res.status(404).json(taskNotFound);
    res.sendStatus(204);
  });

  return router;
}
