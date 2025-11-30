## 现状确认
- 当前未接入交互式地图 SDK（无 `mapbox-gl`/`maplibre`/Google Maps 实际使用）。
- `MapSelector.jsx` 仅使用 Mapbox Static API 作为占位背景，未读取环境变量：`frontend/src/components/MapSelector.jsx:47`。
- 存在样例环境键但未使用：`frontend/.env.example` 中含 `VITE_MAPBOX_TOKEN`；真实 `frontend/.env` 未配置该键。

## 目标
- 增加环境变量以填入 Mapbox API Key，并在前端读取使用。
- 将地图组件切换为交互式 Mapbox GL JS，完成基本选点与搜索能力（搜索可先用简化输入或静态列表，后续可扩展到 Mapbox Geocoding）。
- 保留无 Token 的降级体验（静态占位 + 友好提示）。

## 环境变量与配置
- 前端（Vite）：新增并使用 `VITE_MAPBOX_TOKEN`（客户端可见）。
  - 更新 `frontend/.env.example`，在 `frontend/.env` 与 Vercel 项目环境中配置该值。
  - 代码内通过 `import.meta.env.VITE_MAPBOX_TOKEN` 读取。
- 后端：暂不需要 Mapbox Key（若未来服务端调用 Mapbox API，则新增 `MAPBOX_ACCESS_TOKEN` 并仅在服务端使用）。

## 依赖与集成
- 新增依赖：`mapbox-gl`。
- 在 `frontend/src/components/MapSelector.jsx`：
  - 引入并初始化 `mapboxgl.Map`（容器、`style`、`center`、`zoom`）。
  - 设置 `mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN`。
  - 实现基础交互：点击地图写入坐标；保留热门地点按钮进行 `flyTo`。
  - 无 Token 时显示占位背景并禁用交互（或提示配置 Token）。

## 错误与边界
- Token 缺失：展示提示与占位图，不抛出致命错误。
- 加载失败：提供重试与回退逻辑；保持页面状态。
- 速点防抖：对连续点击进行防抖，避免重复事件。

## 验证与发布
- 本地验证：加载地图、点击选择坐标、热门地点跳转、无 Token 降级确认。
- 部署前检查：Vercel 环境已配置 `VITE_MAPBOX_TOKEN`；构建产物正常。

## 文档确认（Context7）
- Mapbox GL JS 文档库 ID：`/mapbox/mapbox-gl-js`。
- 关键点：需设置 `MAPBOX_ACCESS_TOKEN`/`mapboxgl.accessToken` 并初始化 Map 实例（已通过 Context7 检索 Quickstart/Access Token 指引）。

## 变更范围
- 文件：
  - `frontend/.env.example`（新增变量示例）
  - `frontend/.env`（本地配置，不提交）
  - `frontend/package.json`（新增依赖）
  - `frontend/src/components/MapSelector.jsx`（交互式地图接入）

## 后续扩展（非本次必需）
- 搜索：接入 Mapbox Geocoding API；新增 `VITE_MAPBOX_GEOCODING_URL` 或封装服务端代理。
- 样式：可切换 `mapbox://styles/mapbox/streets-v12` 等多样式；夜景等与 PRD 时段联动。
- 访问控制：对调用频次与成本进行监控与告警。