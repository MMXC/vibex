# Epic 1: 修复测试阻塞问题（Phase 1）

## Spec 规格

### S1.1: 修复 vitest 路径别名

**工时**: 0.5d  
**负责人**: dev

**当前问题**: `vitest.config.ts` 中 `@` alias 未正确配置，导致 `@/lib/canvas/canvasStore` 导入失败。

**修复方案**:
```typescript
// vitest.config.ts
import { resolve } from 'path'
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

**验收标准**:
- `expect(vitestConfig.resolve.alias['@']).toBeDefined()`
- `npm test` 退出码为 0

---

### S1.2: 修复 canvas-checkbox-style-unify 测试文件（E1/E2 缺失用例）

**工时**: 0.5d  
**负责人**: tester + dev

**当前问题**:
- E1: `BoundedContextTree.test.tsx` 缺少对 checkbox 数量的断言
- E2: `ComponentTree.test.tsx` 缺少对 checkbox 位置的验证

**修复方案**:

**E1 测试用例**:
```typescript
it('E1: 验证单个 checkbox（无重复）', () => {
  render(<BoundedContextTree />)
  const checkboxes = screen.queryAllByRole('checkbox')
  expect(checkboxes).toHaveLength(1)
})
```

**E2 测试用例**:
```typescript
it('E2: 验证 checkbox 在节点内（非标题后）', () => {
  const { container } = render(<ComponentTree />)
  const nodeItem = container.querySelector('.node-item')
  const checkbox = nodeItem.querySelector('.checkbox')
  expect(checkbox).toBeInTheDocument()
  expect(nodeItem.querySelector('.checkbox')).toHaveClass('checkbox')
})
```

**验收标准**:
- `expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` 通过
- `expect(container.querySelector('.checkbox')).toBeInTheDocument()` 通过

---

### S1.3: 明确 DoD 测试准备要求

**工时**: 0.25d  
**负责人**: coord + dev

**修复方案**: 在 `AGENTS.md` 的 DoD 列表中添加：

```
## DoD (Definition of Done)
- [ ] 代码实现完成
- [ ] 单元测试通过（`npm test` 退出码为 0）
- [ ] 测试文件与实现同步更新（不得遗留陈旧测试）
- [ ] E2E 测试覆盖（如涉及 UI 交互）
- [ ] PR checklist 包含测试相关检查项
```

**验收标准**:
- AGENTS.md 包含 "测试准备" 在 DoD 列表中
- PR template 包含测试相关检查项

---

### S1.4: 优化 npm test 速度（分离快慢套件）

**工时**: 0.5d  
**负责人**: dev

**当前问题**: `npm test` >120s，包含所有测试（单元 + 集成 + E2E）。

**修复方案**:

```bash
# package.json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --testTimeout=10000 --exclude='**/*.e2e.test.ts'",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

**验收标准**:
- `npm run test:unit` <60s
- `npm test` <120s（全量）
- `npm run test:e2e` 在独立套件中运行
