# Epic 9: PRD / Story 规范落地 — Spec

**Epic ID**: E9
**优先级**: P2
**工时**: 3h
**页面集成**: docs/templates / docs/process

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E9-S1 | PRD 模板 | 创建 `docs/templates/prd-template.md`，包含执行摘要 / Epic 表格 / 验收标准 / DoD | 文件存在且格式完整；所有新 PRD 使用此模板 | docs/templates/prd-template.md |
| E9-S2 | Story 验收标准 GIVEN-WHEN-THEN | 所有 Story 的验收标准使用 GIVEN-WHEN-THEN 格式 | `expect(story.acceptanceCriteria.match(/GIVEN.*WHEN.*THEN/s)).toBeTruthy()` | 所有 Story 文档 |
| E9-S3 | DoD 纳入测试要求 | `docs/process/definition-of-done.md` 包含测试用例纳入要求 | 文件存在且 DoD 包含 E2E 测试通过条件 | docs/process/definition-of-done.md |

---

## 详细验收条件

### E9-S1: PRD 模板

- [ ] 文件路径：`docs/templates/prd-template.md`
- [ ] 包含章节：
  - 执行摘要（背景 / 目标 / 成功指标）
  - Epic/Story 表格（含工时估算 + expect() 断言）
  - 验收标准
  - DoD（Definition of Done）
- [ ] 包含功能点表格格式：`| ID | 功能点 | 描述 | 验收标准 | 页面集成 |`
- [ ] 所有新 PRD 必须使用此模板

### E9-S2: Story GIVEN-WHEN-THEN 格式

- [ ] 所有 Story 的验收标准使用 GIVEN-WHEN-THEN 格式
- [ ] 示例：
  ```
  GIVEN 用户已选择节点 "Order Context"
  WHEN 用户双击该节点
  THEN 节点状态变为 confirmed，显示绿色 ✓ 图标
  ```
- [ ] `expect(storyDocs.every(s => s.hasGivenWhenThen)).toBe(true)`

### E9-S3: DoD 纳入测试要求

- [ ] 文件路径：`docs/process/definition-of-done.md`
- [ ] DoD 包含：
  - [ ] 代码完成（已合并到 main）
  - [ ] 单元测试通过（覆盖率 ≥ 60%）
  - [ ] E2E 测试通过（通过率 ≥ 95%）
  - [ ] TypeScript 编译无错误
  - [ ] 验收标准满足
  - [ ] 文档已更新
  - [ ] 无回归

---

## 实现注意事项

1. **强制使用**：PM agent 负责确保所有新 PRD 使用模板
2. **存量更新**：现有 Story 不强制迁移，新 Story 必须使用新格式
3. **持续检查**：reviewer 在 design review 时检查 Story 格式合规性
