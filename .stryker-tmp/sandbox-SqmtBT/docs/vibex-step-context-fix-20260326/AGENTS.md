# AGENTS.md: vibex-step-context-fix-20260326

## 开发约束

本文档定义 Dev Agent 在实施本项目时的开发约束和检查要点。

---

## 文件修改清单

| 文件 | 修改类型 | 关键约束 |
|------|---------|---------|
| `vibex-backend/src/app/api/v1/analyze/stream/route.ts` | 修改 | 只改 SSE 事件字段，不改 AI prompt |
| `vibex-fronted/src/lib/canvas/api/dddApi.ts` | 修改 | 只改类型定义，不改业务逻辑 |
| `vibex-fronted/src/lib/canvas/canvasStore.ts` | 修改 | 只改 `onStepContext` 回调，不改 `addContextNode` 签名 |

---

## 强制检查项

### 代码质量

- [ ] TypeScript 编译零错误：`npm run build` 通过
- [ ] 单元测试全部通过：`npm test` 相关测试通过
- [ ] E2E 测试通过：Playwright 端到端场景通过
- [ ] 提交信息规范：`fix(step_context): ...` 格式

### 兼容性

- [ ] **向后兼容**：当后端 SSE 不含 `boundedContexts` 时，前端不报错，显示"AI 分析上下文"单节点
- [ ] **类型安全**：所有 `boundedContexts` 字段访问做可选链（`?.`）或空值检查
- [ ] **降级逻辑**：任何异常路径都回退到单节点逻辑

### 性能约束

- [ ] 节点数量硬限制：最多 10 个（`MAX_CONTEXTS = 10`）
- [ ] 名称截断：最长 30 字符（`MAX_NAME_LENGTH = 30`）
- [ ] 循环创建时单次 `addContextNode` 调用不阻塞主线程

---

## 禁止事项

🚫 **禁止修改 AI prompt 或 LLM 调用逻辑**
- 只修改 SSE 事件传输层，不改变 AI 生成逻辑
- boundedContexts 的生成是 AI 已有能力，不需改动 prompt

🚫 **禁止新增文件**
- 仅修改现有 3 个文件，不新增任何文件
- 不新增 API endpoint，不新增组件文件

🚫 **禁止破坏现有功能**
- 不修改其他 SSE 事件类型（`step_domain_event`、`step_entity`、`step_relationship`）
- 不修改 `addContextNode` 的签名或行为

---

## Dev 实施顺序

1. **Epic 1**: 先改后端 `route.ts` → 手动 SSE 验证
2. **Epic 2**: 再改前端 `dddApi.ts` → TypeScript 编译验证
3. **Epic 3**: 最后改前端 `canvasStore.ts` → 单元测试验证
4. **Epic 4**: E2E 测试 → 提交代码

---

## Tester 验收重点

1. 多节点场景：验证 3+ 个节点正确展示
2. 降级场景：验证无 boundedContexts 时单节点正常
3. 边界场景：15 个 contexts 限制为 10 个
4. 边界场景：50 字符名称截断为 30 字符
5. 类型场景：unknown type 映射为 generic
6. 编译场景：前后端 TypeScript 编译无错误

---

## Reviewer 审查重点

1. 确认只修改了 3 个指定文件，无新增文件
2. 确认无 AI prompt 修改
3. 确认向后兼容逻辑完整
4. 确认测试覆盖所有边界场景
5. 确认提交信息规范
