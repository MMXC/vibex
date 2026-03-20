# PRD: vibex-ddd-api-fix

> **状态**: 建设中 | **优先级**: P1 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: AI 提示词过于简单，JSON Schema 缺少 relationships 字段，Mermaid 生成逻辑缺少边

---

## 1. 执行摘要

`/api/ddd/bounded-context` 返回的限界上下文过于简单，缺少上下文之间的关系（上下游、合作伙伴等），导致前端渲染的 Mermaid 图只有孤立节点。用户无法理解业务领域的协作结构。

---

## 2. Epic 拆分

### Epic 1: API 增强

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 优化提示词 | 添加 EventStorming + Context Mapping 引导，包含示例 |
| S1.2 | 更新 Schema | 增加 keyResponsibilities + relationships 字段 |
| S1.3 | 更新 Mermaid 生成 | 基于 relationships 生成边（edges），非孤立节点 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 提示词优化 | 添加详细引导 + 示例 JSON，提示词包含 Context Mapping 模式 | API 返回 ≥ 2 条 relationships | - |
| F1.2 | Schema 更新 | keyResponsibilities (string[]), relationships (targetContextName + type + description) | expect(schema).toContain('relationships') | - |
| F1.3 | Mermaid 边生成 | 基于 relationships 生成 `A --> B` 边，type 映射到不同边样式 | Mermaid SVG 包含 `<path>` 或 `<line>` 元素（非纯节点） | - |

---

## 4. 技术约束

1. **向后兼容**：relationships 和 keyResponsibilities 为新增字段，旧版数据兼容
2. **格式验证**：添加 Zod schema 验证，AI 返回格式错误时重试
3. **Mermaid 样式**：upstream-downstream → 实线，partnership → 双线，shared-kernel → 虚线

---

## 5. 实施步骤

```
1. 更新 /api/ddd/bounded-context 提示词（添加 Context Mapping 引导）
2. 更新 Zod schema（添加 relationships + keyResponsibilities）
3. 更新 Mermaid 生成逻辑（添加边生成）
4. 单元测试覆盖
```

**预估工时**: 3.5 小时

---

## 6. 验收标准汇总

- [ ] F1.1: API 返回 ≥ 2 条 relationships
- [ ] F1.2: Schema 包含 relationships 和 keyResponsibilities
- [ ] F1.3: Mermaid SVG 包含边（`<path>` 或 `<line>` 元素）
- [ ] npm run build 成功
- [ ] 单元测试通过

---

*PM Agent | 2026-03-20*
