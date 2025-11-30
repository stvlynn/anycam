# 部署检查

## 前端环境变量
- 在 Vercel 项目设置中新增 `VITE_MAPBOX_TOKEN`，值为 Mapbox Access Token。
- 本地开发在 `frontend/.env` 中设置相同键。

## 构建与运行
- 前端构建：`npm run build` 于 `frontend` 目录。
- 确认地图交互正常（有 Token）或占位降级（无 Token）。

## 变更范围
- `frontend/package.json`：新增 `mapbox-gl` 依赖。
- `frontend/src/components/MapSelector.jsx`：接入 Mapbox GL。
- `frontend/.env.example`：包含 `VITE_MAPBOX_TOKEN` 示例。
