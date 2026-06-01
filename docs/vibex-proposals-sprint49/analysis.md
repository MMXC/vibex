# Sprint 49 技术分析

> 来源: proposals/20260601/analyst.md (coord self-impl from Sprint48 CHANGELOG gap analysis)
> 分析日期: 2026-06-01

## P001 — AI 断线重连 + 流式可靠性增强

### 技术风险
- SSE 重试逻辑复杂度：需要处理多种断连场景（网络抖动/超时/服务端断开）
- 指数退避与并发生成的状态管理交叉
- vitest mock SSE 流式响应有挑战

### 风险缓解
- 建议从 `useStreamingAgent` hook 入手，先隔离测试重试计数器
- 状态指示器 badge 可复用现有 `ConnectionStatus` 组件

---

## P002 — 画布模板管理完善

### 技术风险
- IndexedDB 缩略图存储路径需统一规范
- 搜索匹配算法（fuzzy vs exact）影响 UX
- 模板数量增长后缩略图 IndexedDB 膨胀

### 风险缓解
- 缩略图使用 SVG 字符串（无需 blob URL）
- 搜索用简单 includes 匹配，fuzzy 可后续迭代
- IndexedDB 配额检查

---

## P003 — 大型画布性能优化 v2

### 技术风险
- 性能基准测试（fps）不稳定：CI 机器 vs 用户机器差异大
- 100ms debounce 可能影响缩放实时感
- `onlyRenderVisibleElements` 对某些 React Flow 内置组件可能有副作用

### 风险缓解
- 建议 vitest 用行为测试替代性能测试（debounce 调用计数）
- 可在开发模式加 perf 面板，生产环境去掉
- 先在小范围测试 onlyRenderVisibleElements，再全量开启

---

## P004 — 画布版本历史可视化

### 技术风险
- auto-snapshot 触发时机：需精确 hook 到 AI 生成完成点
- Timeline 组件在长历史时水平滚动性能
- 快照 diff 对比算法复杂度

### 风险缓解
- AI 生成完成点可 hook `useStreamingAgent` 的 `onComplete` 回调
- Timeline 用虚拟滚动（只渲染可见节点）
- diff 可用简单 text diff，后续迭代

---

## P005 — 协作评论系统

### 技术风险
- IndexedDB 评论数据模型需支持多用户并发编辑
- 评论气泡定位依赖节点位置，缩放/拖拽时需更新
- offline-first 架构下评论同步策略

### 风险缓解
- 评论数据模型加 `version` 字段用于冲突检测
- 评论气泡用 React Flow 的 `NodeAnchor` 或手动计算偏移量
- Phase1 只做本地 IndexedDB 持久化，同步后续迭代

---

## 总体技术评估

| Epic | 复杂度 | 新文件 | 依赖现有 | 风险等级 |
|------|--------|--------|----------|----------|
| E1 | M | 1 hook | useStreamingAgent | M |
| E2 | M | 1 store + 2 组件 | templateStore | L |
| E3 | M | 视口逻辑修改 | React Flow 内置 | M |
| E4 | M | 1 store + 2 组件 | canvasHistoryStore | L |
| E5 | L | 1 store + 2 组件 | IndexedDB | L |

**结论**: 所有 Epic 均为前端改动，无后端依赖，技术风险可控。
