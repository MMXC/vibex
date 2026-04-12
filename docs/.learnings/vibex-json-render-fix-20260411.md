# Learnings: vibex-json-render-fix — 组件预览空白修复

**项目**: vibex-json-render-fix
**完成时间**: 2026-04-11
**基线**: `41f5aec4`
**结果**: ✅ Epic1 完成

---

## 项目结果

- **Epic1**: ✅ `41f5aec4` — generateDefaultProps 修复组件预览空白
- **验证**: Vitest 10 tests passed ✅

---

## 教训

### 1. API 层返回空数据 vs UI 层渲染假设

**问题**: `canvasApi.ts` 的 `fetchComponentTree()` 硬编码 `props: {}`，导致下游 `nodesToSpec()` → `JsonRenderPreview` 只能收到 `{ title }` 的数据，渲染空组件。

**教训**: API 层的数据转换函数（如 `fetchComponentTree`）不应该只做"透传"而不做"填充"。如果后端返回的组件数据缺少必要字段，前端 API 层应该：
1. 填充默认值（类似 `generateDefaultProps`）
2. 或者向后端报告字段缺失
3. **不应该**静默返回空数据，导致下游渲染失败

**适用场景**: 任何 API response transformation layer 负责将后端数据映射到前端数据模型时。

---

### 2. 历史经验利用

**发现**: Analysis 通过 learnings 搜索找到了 `canvas-jsonrender-preview/analysis.md`（2026-04-05），包含完整的 json-render 集成架构设计和 E1/E2/E3 Sprint 记录。

**教训**: 这个问题的"根因"（props为空）在2026-04-05的文档中已经通过 Option B 混合方案有所涉及。快速搜索历史 learnings 可以避免重复发现已知的架构设计。

---

## PR 审查发现

| 项目 | 描述 |
|------|------|
| 修复范围 | 添加 `generateDefaultProps()` 函数（47行），根据组件 type 生成合规默认 props |
| 组件类型覆盖 | page, form, list, detail, modal |
| 超出范围 | 无，修复精准 |

---

## 文档引用

- PRD: `/root/.openclaw/vibex/docs/vibex-json-render-fix/prd.md`
- 分析: `/root/.openclaw/vibex/docs/vibex-json-render-fix/analysis.md`
- 架构: `/root/.openclaw/vibex/docs/vibex-json-render-fix/architecture.md`
