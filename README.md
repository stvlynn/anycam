# AnyCam

把你的自拍融合到世界任意地点与时刻的真实场景中。上传照片、选择地点与时间，AI 将生成一张你身处该地当下氛围的照片。

**在线地址**
- 连接 GitHub 后一键部署到 Vercel；前端为静态构建，`/api/generate` 由无服务器函数处理。

**核心能力**
- 上传或拍摄照片，前端自动压缩为 DataURL。
- 选择地点（内置地图与坐标），选择日期与时段（如日出/正午/夜晚）。
- 后端调用图像编辑服务生成结果，并可选融合 Google Street View 的环境参考。
- 输出 `imageUrl`（URL 或 DataURL）与生成耗时。

## 项目架构

- `frontend/`：React + Vite（TailwindCSS 等），通过 `axios` 调用 `/api/generate`。
- `api/`：Vercel 无服务器函数，`api/generate.js` 完整实现图片规范化、构建表单、调用上游与容错解析。
- `backend/`：本地开发用的 Express 版本（与函数逻辑同源），线上不需要运行。
- `vercel.json`：定义静态构建与函数绑定，以及 SPA 回退规则。

目录结构示例：
- `frontend/src/App.jsx`：前端发起 `axios.post('/api/generate', requestData)`
- `api/generate.js`：线上生成逻辑入口
- `frontend/vite.config.js`：本地开发代理 `/api -> http://localhost:3000`

## 快速开始（本地）

- 前端：
  - `cd frontend`
  - `npm install`
  - `cp .env.example .env` 后填写 `VITE_MAPBOX_TOKEN`（可选）
  - `npm run dev`

- 后端（本地联调可选）：
  - `cd backend`
  - `npm install`
  - `cp .env.example .env` 并填写 `NANO_BANANA_API_KEY` 等参数
  - `npm run dev` 或 `npm start`

## 部署到 Vercel（整仓库）

- 根目录包含 `vercel.json`：
  - 前端使用 `@vercel/static-build`，输出目录为 `dist`
  - 函数 `api/generate.js` 使用 `@vercel/node`
  - 路由规则：
    - `"/api/(.*)" -> "/api/$1"`
    - 当请求的静态文件不存在时，`"/(.*)" -> "/index.html"`（SPA 回退，避免 404）

- 在 Vercel 项目设置添加环境变量：
  - 前端（构建时）：`VITE_MAPBOX_TOKEN`
  - 函数（运行时）：`NANO_BANANA_API_KEY`（必填）、`NANO_BANANA_API_URL`、`NANO_BANANA_MODEL`、`NANO_BANANA_RESPONSE_FORMAT`、`NANO_BANANA_SIZE`、`NANO_BANANA_QUALITY`、`TIMEOUT_MS`、`NANO_BANANA_USE_MASK`、`GOOGLE_CLOUD_API_KEY`

> 注意：当 `vercel.json` 定义了 `builds` 时，仪表盘中的 Build & Development Settings 会被忽略。

## 环境变量

- 根目录示例：`.env.example`（已提供）
  - 前端：`VITE_API_BASE_URL=/api`、`VITE_MAPBOX_TOKEN=...`
  - 函数：`NANO_BANANA_*`、`GOOGLE_CLOUD_API_KEY`
  - 本地后端可选：`PORT=3000`

## API 说明

- `POST /api/generate`
  - 请求体（JSON）：
    - `photo`：前端 `data:image/...;base64,...`
    - `location`：`{ name, coords: { lat, lng } }`
    - `time`：`{ date: 'YYYY-MM-DD', timeOfDay: 'sunrise|morning|noon|afternoon|sunset|night' }`
  - 响应体（JSON）：
    - `imageUrl`：生成结果（URL 或 `data:image/png;base64,...`）
    - `generationTime`：耗时字符串（如 `10.4s`）
    - `streetview`：`{ status: 'ok' | 'skipped' }`

## 常见问题（部署）

- 首页或深链接 404：
  - 确认 `vercel.json` 已配置 “文件缺失则回退到 `/index.html`”。
  - 确保构建产出在 `dist`（日志显示 `dist/index.html`）。

- 配置冲突：
  - 若 `builds` 存在，仪表盘 Build 设置不生效，保持 `vercel.json` 为唯一来源。

## 技术栈

- 前端：React 18、Vite、TailwindCSS、Radix UI、Lucide、Framer Motion、Mapbox GL
- 后端/函数：Node.js、Axios、FormData、Sharp、Google Street View（可选参考）

## 许可

- 仅用于演示与个人使用场景。请勿提交或记录任何敏感密钥至仓库；所有密钥通过环境变量注入。
