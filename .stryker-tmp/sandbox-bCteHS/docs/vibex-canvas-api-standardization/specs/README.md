# VibeX Canvas API 标准化规格索引

**项目**: vibex-canvas-api-standardization  
**版本**: 1.0  
**日期**: 2026-03-29

---

## 📁 规格文件列表

| 文件 | 功能域 | 优先级 | 状态 |
|------|--------|--------|------|
| [F1-API-Route-Standardization.md](./F1-API-Route-Standardization.md) | 前端路由标准化 | P0 | 待开发 |
| [F2-SSE-Endpoint-Integration.md](./F2-SSE-Endpoint-Integration.md) | SSE 端点整合 | P1 | 待开发 |
| [F3-Backend-Legacy-Route-Deprecation.md](./F3-Backend-Legacy-Route-Deprecation.md) | 后端旧路由废弃 | P0 | 待开发 |
| [F4-Two-Step-Design-Flow.md](./F4-Two-Step-Design-Flow.md) | 两步设计流程验证 | P1 | 待开发 |
| [F5-E2E-Test-Coverage.md](./F5-E2E-Test-Coverage.md) | E2E 测试覆盖 | P1 | 待开发 |

---

## 🎯 功能域概览

### EPIC: Canvas API 标准化
> 统一 Canvas API 调用入口为 `/api/v1/canvas/*`，废弃旧路由 `/api/canvas/*`

### User Stories

| # | 故事 | 对应功能域 |
|---|------|-----------|
| US-1 | 统一 API 调用入口 | F1 |
| US-2 | SSE 端点集中管理 | F2 |
| US-3 | 旧路由安全废弃 | F3 |
| US-4 | 完整流程可追溯 | F4 |
| US-5 | 回归测试覆盖 | F5 |

---

## 📊 开发优先级

| 优先级 | 功能域 | 工时 |
|--------|--------|------|
| **P0** | F1.1 api-config.ts 审查 | 0.25d |
| **P0** | F1.2 canvasApi.ts 清理 | 0.25d |
| **P0** | F3.1 依赖扫描 | 0.25d |
| **P0** | F3.2 旧路由目录删除 | 0.25d |
| **P1** | F2.1 dddApi.ts 迁移 | 0.25d |
| **P1** | F2.2 导出路径更新 | 0.25d |
| **P1** | F3.3 v1 路由功能验证 | 0.25d |
| **P1** | F4.1-F4.3 sessionId 链路验证 | 0.25d |
| **P1** | F5.1 完整流程 E2E | 0.5d |
| **P2** | F5.2 主页无 404 | 0.25d |
| **P2** | F1.3 死代码清理 | 0.25d |
| **P2** | F2.3 SSE 命名空间统一 | 0.25d |

**总工时**: ~3 人天

---

## 🔗 依赖关系

```
F1 (API 路由标准化)
  ├── F1.1 api-config.ts 审查
  ├── F1.2 canvasApi.ts 清理
  └── F1.3 死代码清理

F2 (SSE 端点整合) [依赖 F1 完成]
  ├── F2.1 dddApi.ts 迁移
  ├── F2.2 导出路径更新
  └── F2.3 SSE 命名空间统一

F3 (后端旧路由废弃) [依赖 F1 扫描完成]
  ├── F3.1 依赖扫描
  ├── F3.2 旧路由目录删除
  └── F3.3 v1 路由功能验证

F4 (两步设计流程) [依赖 F1, F3 完成]
  ├── F4.1 sessionId 生成
  ├── F4.2 sessionId 传递
  └── F4.3 sessionId 存储确认

F5 (E2E 测试) [依赖 F1-F4 全部完成]
  ├── F5.1 完整流程 E2E
  └── F5.2 主页无 404
```

---

## 📋 验收标准速查

| ID | 验收标准 | 对应功能域 |
|----|----------|-----------|
| AC-1 | api-config.ts 中所有 Canvas 端点均以 `/v1/canvas/` 开头 | F1.1 |
| AC-2 | canvasApi.ts 中所有 `fetch` 调用均指向 `getApiUrl()` | F1.2 |
| AC-3 | 全库无 `/api/canvas/`（不含 v1）引用 | F1.3, F3.1 |
| AC-4 | `/app/api/canvas/` 目录已删除 | F3.2 |
| AC-SSE-1 | `canvasSseApi.ts` 文件存在 | F2.1 |
| AC-SSE-2 | 所有 `dddApi.ts` 引用已更新 | F2.2 |
| AC-SSE-3 | SSE 函数以 `canvasSse` 为前缀 | F2.3 |
| AC-SID-1 | `generate-contexts` 返回包含 `sessionId` | F4.1 |
| AC-SID-2 | `generate-flows` 请求必须包含 `sessionId` | F4.2 |
| AC-SID-3 | `generate-components` 请求必须包含 `sessionId` | F4.3 |
| AC-SID-4 | `sessionId` 刷新页面后可恢复 | F4.3 |
| AC-E2E-1 | Canvas 完整流程 E2E 测试通过 | F5.1 |
| AC-E2E-2 | 无 404 资源请求 | F5.2 |
| AC-E2E-3 | 无控制台错误 | F5.2 |
| AC-E2E-4 | sessionId 链路正确 | F5.1 |

---

*规格索引由 pm 生成 | 2026-03-29*
