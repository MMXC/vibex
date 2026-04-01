# Epic 8: 测试覆盖率提升 — Spec

**Epic ID**: E8
**优先级**: P2
**工时**: 5h
**页面集成**: E2E 测试 / CI/CD / package.json

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E8-S1 | 创建限界上下文旅程测试 | `journey-create-context.spec.ts`：建模者创建限界上下文并确认 | `await page.getByRole('button', { name: '确认' }).click()`；`expect(await page.locator('.tree-node.confirmed')).toHaveCount(1)` | tests/e2e/journey-create-context.spec.ts |
| E8-S2 | 创建业务流程旅程测试 | `journey-generate-flow.spec.ts`：生成流程并拖拽调整 | `expect(flowNodeCount).toBeGreaterThan(0)`；拖拽后位置更新 | tests/e2e/journey-generate-flow.spec.ts |
| E8-S3 | 创建多选操作旅程测试 | `journey-multi-select.spec.ts`：三树跨树多选 + 批量确认 | 多选后批量确认；`expect(confirmedNodes.length).toBe(5)` | tests/e2e/journey-multi-select.spec.ts |
| E8-S4 | 设置覆盖率门禁 | `package.json` 添加 `coverage:check` 脚本，Statements 门禁 > 60% | `expect(coverage.statements.pct).toBeGreaterThanOrEqual(60)` | package.json |
| E8-S5 | 关键路径单元测试 | `handleGenerate` / `confirmContextNode` 单元测试覆盖 | `expect(confirmContextNode({ id: '1', state: 'selected' })).toEqual(expect.objectContaining({ state: 'confirmed' }))` | src/__tests__/ |
| E8-S6 | Tester 介入设计 review | Tester 参与 design review，提前评审可测试性 | 设计评审记录包含 tester 评审意见 | — |

---

## 详细验收条件

### E8-S1: 限界上下文旅程测试

- [ ] 文件：`tests/e2e/journey-create-context.spec.ts`
- [ ] 测试步骤：打开页面 → 点击「新建上下文」→ 输入名称 → 确认 → 验证节点出现
- [ ] 验证：`expect(treeNodes).toHaveCount(1)` 且 `expect(treeNodes[0]).toHaveClass(/confirmed/)`

### E8-S2: 业务流程旅程测试

- [ ] 文件：`tests/e2e/journey-generate-flow.spec.ts`
- [ ] 测试步骤：进入 Flow 页面 → 点击生成 → 验证流程节点出现 → 拖拽节点 → 验证位置更新
- [ ] 验证：`expect(flowNodeCount).toBeGreaterThan(0)` 且 `expect(newPosition).not.toEqual(oldPosition)`

### E8-S3: 多选操作旅程测试

- [ ] 文件：`tests/e2e/journey-multi-select.spec.ts`
- [ ] 测试步骤：三树各选 2 个节点 → 批量确认 → 验证所有节点 confirmed
- [ ] 验证：`expect(confirmedNodes.length).toBe(6)`

### E8-S4: 覆盖率门禁

- [ ] `package.json` 包含 `coverage:check` 脚本
- [ ] 使用 Istanbul/nyc 生成覆盖率报告
- [ ] 门禁配置：`statements: 60, branches: 50, functions: 60, lines: 60`
- [ ] `npm run coverage:check` 在 CI 中运行

### E8-S5: 关键路径单元测试

- [ ] `src/__tests__/handleGenerate.test.ts` 存在
- [ ] `src/__tests__/confirmContextNode.test.ts` 存在
- [ ] 测试覆盖：正常路径 + 异常路径 + 边界条件

### E8-S6: Tester 介入设计 review

- [ ] team-tasks 流程支持 design review 阶段派发 tester 任务
- [ ] PRD 评审记录包含 tester 评审意见
- [ ] 可测试性检查项：可验证的验收标准 / mock 接口 / 测试数据

---

## 实现注意事项

1. **旅程优先**：优先覆盖核心用户旅程（3 个 spec 文件），再补充边界场景
2. **CI 集成**：覆盖率检查必须进入 CI gate，失败则 PR 无法合并
3. **Tester 提前**：Epic 8-S6 修改 team-tasks 流程，提前在 design review 阶段介入
