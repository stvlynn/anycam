## 目标
- 从 Google Street View 以坐标获取 600x300 的静态街景图。
- 在生成图像的服务器端合成：将街景图作为 Header 叠加到 AI 生成图像上（顶部 600x300）。
- 在 Prompt 中加入街景环境描述与坐标信息；街景失败时降级仍可生成。
- 严格通过环境变量读取密钥，不做硬编码；对街景启用缓存与异步以优化性能。

## 环境与安全
- 在 `backend/.env` 增加：`GOOGLE_CLOUD_API_KEY=YOUR_GOOGLE_CLOUD_API_KEY`
- 后端读取：`process.env.GOOGLE_CLOUD_API_KEY`；不在日志打印密钥。
- 仅后端调用 Google API；前端不暴露密钥。

## 后端接口改造
- 路由仍为 `POST /api/generate`，请求体包含：`{ photo, location, time }`，其中 `location.coords: { lat, lng }`。
- 增加街景获取：
  - URL：`https://maps.googleapis.com/maps/api/streetview?size=600x300&location={lat},{lng}&key={API_KEY}`
  - 获取：`axios.get(url, { responseType: 'arraybuffer' })`
  - 缓存：以 `cacheKey = streetview:{lat}:{lng}:600x300` 缓存 `Buffer`，TTL 24h（内存 LRU + 可选 FS 落盘到 `tmp/streetview/`）。
  - 失败降级：记录原因，后续流程继续。
- Prompt 增强：
  - 模板增加街景与坐标，例如：
    - "请结合提供的街景图片 (坐标: ${lat},${lng})，生成与该环境一致的光线、道路纹理、建筑与标识。"
  - 若街景成功，将街景作为第二参考图片传入（与自拍并列）；若失败，仅加入坐标描述。
- 合成输出：
  - 步骤：
    1) 拿到 AI 输出（URL 或 Base64）→ 读取为 Buffer。
    2) 若有街景 Buffer：
       - 调整两者宽度为 600（`sharp.resize({ width: 600 })`）。
       - 计算最终高度为 `300 + aiHeightResized`。
       - 用 `sharp({ create: { width: 600, height: 300 + aiHeight, channels: 3, background: '#000' } })` 创建画布。
       - `composite`: 先放街景 `{ top: 0, left: 0 }`，再放 AI 图 `{ top: 300, left: 0 }`。
       - 输出 PNG 或 JPEG；返回 `data:image/png;base64,...`。
    3) 若街景失败：直接返回 AI 图像（不阻塞）。
  - 保持当前返回结构 `{ imageUrl, generationTime }`，其中 `imageUrl` 为合成后的最终图。

## 错误处理
- 密钥缺失：返回 `400 { error: 'Missing GOOGLE_CLOUD_API_KEY' }`（仅当需要街景且未配置时）。
- Google API 失败（4xx/5xx）：
  - 响应体增加 `streetview: { status: 'failed', code, details }`；主流程继续。
- 坐标无效：
  - 跳过街景，提示 `streetview.status='invalid_coords'`。
- 统一控制台日志（结构化）：`event: 'streetview_fetch' | 'streetview_error'`，不含密钥与图片内容。

## 性能优化
- 缓存：LRU（容量限制，如 200 条）+ 可选文件缓存（TTL 24h），命中后直接使用 Buffer。
- 异步：
  - 街景抓取与 AI 生成可并发；但为在 Prompt 中参考街景，优先发起街景请求，设置整体 2s 超时，超时直接降级。
- 连接复用：启用 Axios Keep-Alive；限制并发与重试策略。

## 前端配合（最小改动）
- 前端不需层叠显示街景；直接展示后端合成的最终 `imageUrl`。
- 如需前端分层显示，可返回 `streetViewUrl` 与 `finalImageUrl` 双字段（可作为后续扩展）。

## 开发步骤
1. 增加环境变量项与读取逻辑。
2. 实现 `fetchStreetView(lat, lng, size)`，带缓存与降级。
3. 增强 `buildPrompt(location, time, hasStreetView)` 与消息构建，街景存在时添加第二张 `image_url`。
4. 实现合成：`composeWithHeader(streetBuf, aiBuf)` 返回最终图。
5. 接入到 `/api/generate` 流程并完善错误与日志。
6. 验证：有/无街景、无密钥、无坐标、超时、Google 4xx/5xx；确保主流程不阻塞。

## 交付
- 后端代码改动：`backend/server.js`（最小），`backend/.env.example`（新增键与说明）。
- 文档：在 `docs/DEPLOY.md` 增加 Google API Key 配置与配额说明。
- 不提交密钥与缓存文件；遵循安全最佳实践。