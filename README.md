# Tokenow · NowDo

NowDo 是一个面向移动端的待办与日程助手。网页演示包括「当下」的 AI Insight、任务池、周日历和「洞察」中的 Smart Focus。Smart Recovery 可以按未完成原因给出调整方案。应用支持中英文、深浅色主题和移动端布局。

## 快速开始

安装 Node.js 24.12 或更高版本（含 npm），在项目根目录执行以下命令。

```sh
npm ci
npm run dev
```

浏览器打开 [127.0.0.1:3000](http://127.0.0.1:3000)。配置 `.env` 后，网页底部聊天默认连接真实 Agent。未配置密钥时，聊天显示演示摘要。可访问 [Demo 入口](http://127.0.0.1:3000/?mode=demo) 直接进入演示。正式启动可使用 `npm run build` 和 `npm start`。本地调试和 API 请求示例见[开发指南](GETTING_STARTED.md)。

## 演示与真实 Agent

| 入口 | 数据与行为 |
| --- | --- |
| 网页演示 | 固定在 **2026-11-27 12:00（Europe/Berlin）**，从 T01 到 T32 共 32 项日程。四个页面和底部聊天共用同一份演示任务。AI Insight、Smart Focus、Smart Recovery 和聊天摘要都由本地规则生成。 |
| 网页真实聊天及 `POST /api/chat` | 使用真实 DeepSeek 识别意图，支持创建、查询、标记完成和删除单条任务，以及明确起止时段的冲突预检。API 使用实时日期，可传入 `timeZone`，任务写入本地 `data/tasks.json`。 |
| `/api/tasks` | 提供独立的任务 CRUD，详见 [OpenAPI](server/openapi.yaml)。 |

在「任务池」标记完成、调整优先级，或通过 Smart Recovery 改期后，可以到「计划」或「洞察」查看更新。刷新网页会恢复 32 项初始日程并清空演示聊天，语言、主题等设置保存在浏览器中。四个页面始终使用演示任务。通过真实聊天创建的任务可以继续在聊天中查询，重启服务后仍可查到。

## 环境变量

要调用真实 Agent，把 `.env.example` 复制为项目根目录的 `.env`，填写自己的密钥并重启服务。

| 变量 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥，仅由服务端读取。 |
| `DEEPSEEK_MODEL` | 模型配置，默认 `deepseek-flash`。 |
| `PORT` | 本地服务端口，默认 `3000`。服务监听 `127.0.0.1`。 |

调用真实 Agent 会将任务标题、状态、日期、开始时间和近期对话发送给 DeepSeek，可能产生 API 费用。工作区的 `.env` 和 `data/` 均由 Git 忽略。

## 技术栈与项目结构

React、TypeScript 和 CSS 用于页面，esbuild 打包前端。服务端使用 Node.js、Express、Zod、OpenAI SDK（连接 DeepSeek）和本地 JSON 文件。

| 目录 | 内容 |
| --- | --- |
| `src/` | 页面、浏览器设置、演示任务、推荐和恢复规则 |
| `public/` | 网页入口、样式和标志 |
| `server/` | API、真实 Agent、任务持久化和测试 |
| `shared/` | 前后端共用的任务、日期与对话类型 |

`npm run build`、`npm run typecheck`、`npm run lint` 和 `npm test` 可分别检查构建、类型、Lint 和本地测试。测试使用模拟模型和临时任务文件，无需密钥。

## 已知限制与后续方向

- 四个演示页面和真实任务分别使用各自的数据源。后续可将真实任务接入日历、推荐和恢复流程。
- 冲突预检需要明确的同日起止时间。任务缺少结束时间时，空档可能无法核实。Agent 暂未开放改期、批量操作和任务拆解工具。
- 提醒、通知和外部日历集成尚未启用。服务面向本机单用户场景。

## 原始编程题与提交说明

项目源自 TokeNow 的小明待办清单编程题。原题及验收对话见 `git show 6116143:README.md`，项目提交说明见 [SUBMIT.md](SUBMIT.md)。
