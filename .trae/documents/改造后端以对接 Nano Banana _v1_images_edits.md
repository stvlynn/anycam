## 现状
- 现用接口：`/v1/chat/completions`，返回结构不稳定，出现“Invalid upstream response”。
- 前端上传自拍为 JPEG Base64（最大 1MB，≤1024x1024）。
- 后端路由：`backend/server.js:37` `POST /api/generate`。

## 目标
- 依据新文档切换到 `POST https://api.tu-zi.com/v1/images/edits`（multipart/form-data）。
- 统一由后端完成图片规范化（PNG、方形、≤4MB），并返回 `imageUrl`（URL 或 Base64）。
- 保持前端调用不变（`/api/generate`）。

## 接口与请求体
- 端点：`/v1/images/edits`（Bearer 认证）。
- 表单字段：
  - `model`: 默认 `gemini-3-pro-image-preview`（可用 env 配置高清版）。
  - `prompt`: 由 `buildPrompt(location, time)` 生成。
  - `image`: 源图 PNG 文件（由后端将前端 Base64 转为 PNG）。
  - 可选：`n`（默认 1）、`response_format`（`url` 或 `b64_json`，默认 `url`）、`quality`（`1k/2k/4k`）、`size`（如 `1024x1024`）。

## 图片处理（后端）
- 将前端 Base64 Data URL 解码为 Buffer。
- 使用 `sharp`：
  - 若非方形，居中裁剪或透明填充为方形。
  - 转换为 PNG；控制大小 ≤4MB；目标尺寸默认 `1024x1024`（与 PRD 前端压缩一致）。
- 生成 `source.png` 文件流写入 `FormData`。

## 响应解析（后端）
- 成功：`response.data.data[0].url`（当 `response_format=url`）。
- 备选：`response.data.data[0].b64_json`（当 `response_format=b64_json`），包装为 `data:image/png;base64,...`。
- 统一返回：`{ imageUrl, generationTime }`。

## 错误与边界
- 缺少 `API_KEY`：`400 { error: 'Missing NANO_BANANA_API_KEY' }`。
- 文件过大/格式不符：`400 { error: 'Invalid image payload' }`。
- 上游返回异常：`502 { error: 'Upstream generation failed', code, details }`。
- 上游返回成功但无可解析图像：`502 { error: 'Invalid upstream response', generationTime }`（日志包含原始片段以便定位）。

## 环境变量
- `NANO_BANANA_API_KEY`
- `NANO_BANANA_API_URL`（默认 `https://api.tu-zi.com/v1/images/edits`）
- `NANO_BANANA_MODEL`（默认 `gemini-3-pro-image-preview`，可设 `...-hd`）
- `NANO_BANANA_RESPONSE_FORMAT`（`url` 或 `b64_json`，默认 `url`）
- `NANO_BANANA_QUALITY`（`1k/2k/4k` 可选）
- `NANO_BANANA_SIZE`（如 `1024x1024` 可选）
- `TIMEOUT_MS`（默认 60000）

## 依赖与改动
- 新增依赖：`form-data`（Node 端构造 multipart）、`sharp`（图片处理）。
- 修改文件：
  - `backend/server.js`：
    - `POST /api/generate` 切换到 `images/edits`；构造 `FormData`；接入 `sharp` 转 PNG 方形；解析返回。
    - 保留现有 `buildPrompt(location, time)`（可微调以适配 edits 语义）。
  - `backend/.env.example`：增加上述新键、更新默认 API URL。

## 兼容与迁移
- 保留 `/api/generate` 路由签名不变，前端无需改动。
- 若未来需要“生成”而非“编辑”，可支持 `images/generations` 端点并以 env 切换。

## 验证
- 单元验证：伪造 JPEG Base64 输入，核验后端转 PNG 方形与大小控制。
- 集成验证：真实调用 `images/edits`（有 Key），返回 URL；切换 `response_format=b64_json` 验证 Base64 路径。
- 前端流程：上传→选点→选时间→生成，观察 `imageUrl` 展示与耗时统计。

## 备注
- 文档约束“PNG、小于4MB、方形、透明度”已由后端处理；前端仍维持压缩逻辑以减轻后端负载。
- 安全：仅后端持有密钥，绝不暴露到前端。