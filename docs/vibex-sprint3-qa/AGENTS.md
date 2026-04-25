# AGENTS.md — vibex-sprint3-qa / design-architecture

**项目**: vibex-sprint3-qa
**角色**: Architect（开发约束）
**日期**: 2026-04-25
**上游**: architecture.md + IMPLEMENTATION_PLAN.md
**状态**: ✅ 设计完成

---

## 1. 开发约束总览

### 1.1 语言与框架

- **语言**: TypeScript（严格模式）
- **前端框架**: Next.js 16 + React 19
- **测试框架**: Vitest（单元/集成）+ Playwright（UI 集成）
- **测试库**: @testing-library/react ^16.3.2 + @testing-library/user-event ^14.5.2
- **HTTP Mock**: MSW ^2.12.10

### 1.2 代码质量门槛

| 检查项 | 标准 | 命令 |
|--------|------|------|
| TypeScript 类型 | 0 errors | `pnpm exec tsc --noEmit` |
| ESLint | 0 warnings | `pnpm lint` |
| 单元测试通过 | 100% | `pnpm test:unit` |
| 测试覆盖率 | ≥ 80% | `pnpm test:unit:coverage` |
| Playwright E2E | 0 failures | `pnpm test:e2e:qa` |

### 1.3 关键约束

**约束 1: 四态必须全部覆盖**
- 每个组件/页面的四态（理想态/空状态/加载态/错误态）必须有独立测试用例
- 禁止只测试 Happy path

**约束 2: Delete 键模拟必须用 user-event**
- E1-AC2 删除连线使用 `userEvent.keyboard('{Delete}')`，禁止用 `fireEvent.keyDown`

**约束 3: SVG 连线渲染用 Playwright 验证**
- Vitest jsdom 无法完全模拟 SVG 交互和渲染，SVG 连线渲染验证必须在 Playwright E2E 中

**约束 4: MSW Mock 覆盖 AI Vision API**
- E4 的 `/api/vision/recognize` 必须使用 MSW 拦截，禁止使用真实网络请求

**约束 5: prototypeStore.edges 前置检查**
- E1 测试必须验证 `prototypeStore.edges` 存在且为数组，非空时报 Skip 而非 Fail

---

## 2. 技术规范

### 2.1 测试文件命名

```
tests/unit/
  stores/
    prototypeStore.test.ts           # E1-AC1~AC3 + E3-AC1~AC3
    PropertyPanel.test.tsx           # E2-AC1~AC5
  services/
    imageRecognition.test.ts          # E4-AC1~AC4
  docs/
    coverage-map.test.ts             # E5-AC1
    dod-checklist.test.ts            # E5-AC2
    prd-format.test.ts              # E5-AC3

tests/e2e/sprint3-qa/
  E1-flow-panel.spec.ts              # E1-AC1~AC3 UI 四态
  E2-property-panel.spec.ts         # E2-AC1~AC5 四 Tab
  E3-breakpoint-toolbar.spec.ts     # E3-AC1~AC3 设备切换
  E4-import-panel.spec.ts           # E4-AC1~AC4 图片导入
```

### 2.2 测试数据约定

**Edge 工厂函数**:
```typescript
function createMockEdge(overrides: Partial<Edge> = {}): Edge {
  return {
    id: `edge-${Date.now()}`,
    source: 'page-1',
    target: 'page-2',
    type: 'smoothstep',
    ...overrides,
  };
}
```

**ComponentNode 工厂函数**:
```typescript
function createMockNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id: `node-${Date.now()}`,
    type: 'Button',
    data: {
      component: { label: 'Click', styles: {}, props: {} },
      breakpoints: { mobile: true, tablet: true, desktop: true },
      ...overrides.data,
    },
    ...overrides,
  };
}
```

### 2.3 MSW Handler 结构

```typescript
// tests/unit/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// E4: AI Vision Mock
export const visionApiHandlers = [
  http.post('/api/vision/recognize', async () => {
    return HttpResponse.json({
      components: [
        { id: 'c1', type: 'Button', label: 'Button', bounds: { x: 10, y: 10, width: 80, height: 32 }, confidence: 0.95 },
        { id: 'c2', type: 'Input', label: 'Input', bounds: { x: 10, y: 50, width: 200, height: 32 }, confidence: 0.90 },
      ],
    });
  }),
];

// E4 Error Mock
export const visionApiErrorHandlers = [
  http.post('/api/vision/recognize', () => {
    return HttpResponse.json({ error: 'recognition failed' }, { status: 500 });
  }),
];
```

---

## 3. 关键检查清单

### 3.1 每个 Unit 必须完成

- [ ] 创建测试文件
- [ ] 编写四态（或指定场景）测试用例
- [ ] 所有 `expect()` 断言可执行（无假阳性）
- [ ] 运行 `pnpm vitest run <test-file>` 通过
- [ ] 在 IMPLEMENTATION_PLAN.md 更新 Status 为 `✅`

### 3.2 E1 连线测试必须覆盖

- [ ] `addEdge` 返回非空 id
- [ ] `addEdge` 后 `edges` 包含 source/target/type
- [ ] `removeEdge` 清除指定 edge
- [ ] `removeNode` 级联清除关联 edges
- [ ] SVG edge 元素在 Playwright 中可见

### 3.3 E3 断点测试必须覆盖

- [ ] `setBreakpoint` 更新状态
- [ ] 断点切换后，新节点自动标记断点可见性
- [ ] `updateNodeBreakpointVisibility` 部分更新（保留其他字段）

### 3.4 E2 属性面板测试必须覆盖

- [ ] Data Tab 修改文字，store 节点实时更新
- [ ] Navigation Tab 设置跳转页面，自动生成/更新 edge
- [ ] Responsive Tab 设置断点规则，节点 breakpoints 更新

---

## 4. 禁止事项

- ❌ 禁止在 E1-AC2 测试中使用 `fireEvent.keyDown` 替代 `userEvent.keyboard`
- ❌ 禁止使用 `any` 类型绕过 TypeScript 检查
- ❌ 禁止提交 `// @ts-ignore` 或 `// @ts-nocheck`
- ❌ 禁止跳过四态中的任何一态
- ❌ 禁止在 CI 环境使用真实 AI Vision API（必须 MSW 拦截）
- ❌ 禁止 SVG 连线渲染用 Vitest jsdom 验证（必须 Playwright）

---

## 5. 依赖关系与执行顺序

```
E5-U1 (Specs 覆盖率检查) — 前置验证
    ↓
E1-U1 (prototypeStore.edges) → E1-U2 (FlowTreePanel UI)
    ↓
E2-U1 (PropertyPanel 数据同步) → E2-U2 (四 Tab UI)
    ↓
E3-U1 (prototypeStore.breakpoint) → E3-U2 (设备切换 UI)
    ↓
E4-U1 (AI Vision Mock) → E4-U2 (ImportPanel UI)
    ↓
E5-U2 + E5-U3 (DoD + PRD 格式)
```

**说明**: E5-U1（Specs 覆盖率检查）最先执行，确认测试文件与 Specs 覆盖关系正确。

---

## 6. 验收命令

```bash
# 1. 类型检查
pnpm exec tsc --noEmit

# 2. Lint
pnpm lint

# 3. 单元测试 + 覆盖率
pnpm test:unit:coverage

# 4. E2E QA 完整测试
pnpm test:e2e:qa

# 5. 最终检查
pnpm test
```

**全部通过后，更新 task status 为 done。**

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint3-qa
- **执行日期**: 2026-04-25

---

*约束文件时间: 2026-04-25 12:00 GMT+8*
