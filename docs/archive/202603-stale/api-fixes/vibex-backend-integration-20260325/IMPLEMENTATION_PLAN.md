# VibeX 三树画布后端对接 - 实施计划

**项目**: vibex-backend-integration-20260325
**Epic 1**: 后端 API 实现（P0）
**Commit**: f805f08f

---

## Epic 1 完成状态

### ST-E1-01: generate-contexts 端点
- ✅ 实现 `/api/canvas/generate-contexts`
- ✅ 输入校验：`requirementText` ≥ 10 字符
- ✅ 返回 `id/name/description/type/ubiquitousLanguage/confidence`
- ✅ 返回 `generationId`
- ✅ 错误处理：400 / 200 + error / 500
- ✅ TypeScript 0 errors
- ✅ `pnpm build` 通过

### ST-E1-02: generate-flows 端点
- ✅ 实现 `/api/canvas/generate-flows`
- ✅ 输入校验：`contexts` 非空数组
- ✅ 返回 `id/name/contextId/steps/confidence`
- ✅ 返回 `generationId`
- ✅ 每个 flow 至少 2 个 step
- ✅ 错误处理：400 / 200 + error / 500

### ST-E1-03: generate-components 端点
- ✅ 实现 `/api/canvas/generate-components`
- ✅ 输入校验：`contexts` 和 `flows` 非空
- ✅ 返回 `id/name/flowId/contextId/type/apis/confidence`
- ✅ 返回 `generationId/totalCount`
- ✅ 最多 20 个 component 截断
- ✅ 错误处理：400 / 200 + error / 500

---

## Epic 1 遗留（P1）
- ST-E1-04: 统一 API 错误处理中间件
- ST-E1-05: API 超时与重试配置

---

## Epic 2 待完成
- ST-E2-01: `canvasStore` 新增三树生成方法
- ST-E2-02: CanvasPage "启动画布" 集成
- ST-E2-03: `confirmContextNode` → generate-flows
- ST-E2-04: `confirmFlowNode` → generate-components
- ST-E2-05: Loading skeleton UI
- ST-E2-06: Toast 错误提示

---

## 验收标准
- [x] TypeScript 0 errors
- [x] `pnpm build` 通过
- [x] 3 个 API 端点响应格式符合 PRD
