# 本地开发指南

## 启动

安装 Node.js 24.12 或更高版本（含 npm），在项目根目录执行以下命令。

```sh
npm ci
npm run dev
```

打开 [127.0.0.1:3000](http://127.0.0.1:3000)。服务端代码变化时服务会自动重启。修改 TSX 后运行 `npm run build` 并刷新页面。可在本地 `.env` 中设置 `PORT` 以更换端口。

## 验证真实 Agent

把 `.env.example` 复制为 `.env`，填入 DeepSeek API Key 并重启服务。刷新网页，在底部聊天框按顺序执行 [原题的六轮验收对话](https://github.com/TokeNow/todo-agent#基础要求)。每轮等到回复后再发送下一条。重启服务后可以在网页再次查询任务。

未配置密钥时，网页聊天使用演示数据。配置密钥后也可打开 [Demo 入口](http://127.0.0.1:3000/?mode=demo) 使用本地演示。

也可直接请求聊天 API。

```sh
curl -sS http://127.0.0.1:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"我有哪些任务？"}],"timeZone":"Europe/Berlin","language":"zh"}'
```

Windows PowerShell 可使用以下 `Invoke-RestMethod` 命令。

```powershell
$body = @{
  messages = @(@{ role = "user"; content = "我有哪些任务？" })
  timeZone = "Europe/Berlin"
  language = "zh"
} | ConvertTo-Json -Depth 3
Invoke-RestMethod http://127.0.0.1:3000/api/chat -Method Post -ContentType "application/json; charset=utf-8" -Body $body
```

真实模型调用可能产生费用。网页演示以及下方不经模型的任务 API 均无需密钥。

## 验证任务 API

```sh
curl -sS http://127.0.0.1:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"买牛奶"}'
curl -sS http://127.0.0.1:3000/api/tasks
```

真实任务首次写入时会创建 `data/tasks.json`，重启服务后仍可读取。接口字段见 [OpenAPI](server/openapi.yaml)。

## 本地检查

```sh
npm run build
npm run typecheck
npm run lint
npm test
```

测试使用临时目录和模拟模型。预览构建产物可运行 `npm start`。
