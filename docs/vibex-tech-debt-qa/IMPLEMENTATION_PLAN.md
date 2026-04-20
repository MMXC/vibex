# Tech Debt QA — 实施计划

**项目**: vibex-tech-debt-qa
**日期**: 2026-04-20

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: page.test.tsx 修复 | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |
| E2: proposal-dedup 验证 | E2-U1 | 0/1 | E2-U1 |
| E3: 组件测试补全 | E3-U1 ~ E3-U3 | 0/3 | E3-U1 |
| E4: ErrorBoundary 去重 | E4-U1 ~ E4-U2 | 0/2 | E4-U1 |
| E5: HEARTBEAT 话题追踪 | E5-U1 | 0/1 | E5-U1 |

---

## E1: page.test.tsx 修复

### E1-U1: 根因诊断

**Owner**: Dev
**依赖**: 无
**交付物**: TS 错误完整列表 + 按文件分类

**验收标准**:
- AC1: `pnpm exec tsc --noEmit` 无错误，或错误列表按文件分类输出
- AC2: 每个失败的 page.test.tsx 对应到一个 TS 错误源

**实施步骤**:
```bash
cd vibex-fronted
pnpm exec tsc --noEmit 2>&1 | grep "page.test.tsx" | sort -u
```
输出格式：`file:line:column: error message`

---

### E1-U2: TS 错误修复 + 测试通过

**Owner**: Dev
**依赖**: E1-U1
**交付物**: `pnpm test <file>` 全部 PASS

**验收标准**:
- AC1: `pre-test-check.js` 通过（TypeScript 检查 PASS）
- AC2: `pnpm test src/app/page.test.tsx` PASS（或确认 4 个预存失败已修复）
- AC3: 其他 page.test.tsx 文件 `pre-test-check.js` 不再因 TS 报错退出

**实施步骤**:
1. 按 E1-U1 错误列表逐文件修复 TS 错误（类型补全、缺失导入）
2. 修复后运行 `node scripts/pre-test-check.js` 验证
3. `pnpm test <file>` 确认测试通过
4. 不修改测试代码本身来绕过类型问题（修复被测组件的类型）

---

## E2: proposal-dedup 生产验证

### E2-U1: 去重逻辑验证脚本

**Owner**: Dev
**依赖**: 无
**交付物**: `scripts/test_proposal_dedup.py`

**验收标准**:
- AC1: 脚本输出验证结果：重复 task 数 = 0
- AC2: 包含边界用例：跨日期同名 proposal、Strategy 1+2 双重匹配、PRD 解析失败
- AC3: 在当前生产数据上运行无报错

**实施步骤**:
```python
# scripts/test_proposal_dedup.py

# 测试用例 1: 重复 task 匹配
proposals = [
    {"id": "P0-1", "date_dir": "20260329"},
    {"id": "P0-1", "date_dir": "20260401"},  # 同 ID 不同日期
]
# 期望: linked_tasks 无重复

# 测试用例 2: Strategy 1+2 双重匹配
# proposal 有 proposal_id 且 PRD Epic 表也有映射
# 期望: linked_tasks 去重后只保留一个

# 测试用例 3: PRD 解析边界
# PRD 中有 Epic 总览表但 proposal_id 格式不标准
# 期望: graceful fallback，不 crash
```

---

## E3: 组件测试补全

### E3-U1: CardTreeNode 单元测试补全

**Owner**: Dev
**依赖**: 无
**交付物**: `components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx` 扩增

**验收标准**:
- AC1: `isExpanded` 状态切换测试（展开/折叠点击）
- AC2: 深层嵌套（> 3 层）渲染测试
- AC3: `root` 类型节点样式差异测试
- AC4: 覆盖率报告新增行覆盖率 > 70%

**实施步骤**:
```bash
pnpm test src/components/visualization/CardTreeNode/__tests__/CardTreeNode.test.tsx --coverage
```

---

### E3-U2: API 错误处理测试

**Owner**: Dev
**依赖**: 无
**交付物**: `src/lib/__tests__/api.test.ts`（新建）

**验收标准**:
- AC1: 401 响应 → 调用 `redirect('/login')`
- AC2: 网络异常 → 抛出 `NetworkError` 类型
- AC3: 500 响应 → 记录错误日志

**实施步骤**:
```typescript
// src/lib/__tests__/api.test.ts
describe('fetchWithAuth error handling', () => {
  it('401 → redirect to /login', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', { status: 401 })
    );
    await fetchWithAuth('/api/test');
    expect(window.location.href).toContain('/login');
  });
});
```

---

### E3-U3: Accessibility 测试基线

**Owner**: Dev
**依赖**: 无
**交付物**: 核心组件 a11y 基线测试

**验收标准**:
- AC1: `Button`、`Input`、`Modal` 组件 `jest-axe` 测试通过（无 a11y 违规）
- AC2: 新增代码不引入 WCAG 2.1 AA 级别违规

**实施步骤**:
```bash
pnpm add -D jest-axe
```
```typescript
import { axe } from 'jest-axe';
it('Button has no a11y violations', async () => {
  const { container } = render(<Button>Click</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## E4: ErrorBoundary 去重

### E4-U1: ErrorBoundary 统一导出

**Owner**: Dev
**依赖**: 无
**交付物**: `ui/ErrorBoundary.tsx` 统一导出，其他 ErrorBoundary 引用它

**验收标准**:
- AC1: `VisualizationPlatform.tsx` 中的 `ErrorBoundary` class 组件替换为函数组件调用 `ui/ErrorBoundary`
- AC2: `JsonRenderErrorBoundary` 继承或委托到 `ui/ErrorBoundary`
- AC3: 编译通过，运行时无回归

**实施步骤**:
1. 检查 `ui/ErrorBoundary.tsx` 的 API（`resetKeys`, `onReset`, `fallback`）
2. `VisualizationPlatform.tsx`：将 `class ErrorBoundary` 替换为 `<ErrorBoundary>`
3. `JsonRenderErrorBoundary`：继承 `ui/ErrorBoundary`，覆写 `renderFallback`
4. 运行 `pnpm build` 验证

---

### E4-U2: 渲染树验证

**Owner**: Dev
**依赖**: E4-U1
**交付物**: 验证脚本（只读检测）

**验收标准**:
- AC1: 渲染树中 `AppErrorBoundary` 实例数 = 1
- AC2: `CardErrorBoundary` 独立保留（语义隔离）

**实施步骤**:
```typescript
// scripts/verify-error-boundary.ts
// 读取 React DevTools 组件树（开发模式）或检查渲染输出
// 统计 ErrorBoundary 实例数量
// 输出: { AppErrorBoundary: 1, CardErrorBoundary: N, JsonRenderErrorBoundary: 0 }
```

---

## E5: HEARTBEAT 话题追踪

### E5-U1: heartbeat_tracker.py

**Owner**: Dev
**依赖**: 无
**交付物**: `scripts/heartbeat_tracker.py`

**验收标准**:
- AC1: 读取 `/workspace-coord/heartbeat/*.json`，输出话题状态变化报告
- AC2: 检测连续 3 天状态不变且非 `done` 的话题（幽灵任务）
- AC3: 输出格式：CSV 或 Markdown 表格

**实施步骤**:
```python
# scripts/heartbeat_tracker.py
# 1. glob 所有 heartbeat-*.json
# 2. 按日期排序
# 3. 对比相邻天：for each topic, diff(prev, curr)
# 4. 输出变化行
# 5. 检测幽灵任务: stale > 3 天 → 告警
```

---

## 测试策略

| Epic | 测试类型 | 工具 | 覆盖率目标 |
|------|---------|------|-----------|
| E1 | 端到端（pre-test-check + test） | Vitest | 100%（修复文件） |
| E2 | 单元（去重逻辑） | Python pytest | 分支覆盖 100% |
| E3 | 单元 + a11y | Vitest + jest-axe | CardTreeNode > 70% |
| E4 | 集成（渲染树验证） | Vitest | 边界场景 |
| E5 | 脚本验证 | Python assert | 关键路径 |

---

## 风险缓解

| 风险 | 可能性 | 影响 | 预案 |
|------|--------|------|------|
| E1: 某些 TS 错误来自 node_modules | 低 | 低 | 用 `// @ts-ignore` 局部豁免，MEMO 注释 |
| E3: jest-axe 与 jsdom 不兼容 | 低 | 中 | 降级到手动 a11y 测试 |
| E4: ErrorBoundary 去重导致错误恢复失效 | 低 | 高 | 保留 `CardErrorBoundary`，只合并 AppErrorBoundary |
| E5: heartbeat JSON 格式不统一 | 中 | 低 | 脚本内 graceful fallback |

---

## DoD

- [x] E1: `pre-test-check.js` 通过（2026-04-20: tsc --noEmit PASS），`pnpm test src/app/**/page.test.tsx` 全部 PASS (189 passed, 1 skipped)
- [ ] E2: `test_proposal_dedup.py` 输出 "0 duplicates"
- [ ] E3: CardTreeNode 覆盖率 > 70%，API 错误测试通过，a11y 基线建立
- [ ] E4: 编译通过，ErrorBoundary 实例数验证通过
- [ ] E5: `heartbeat_tracker.py` 输出话题变化报告
- [ ] `pnpm build` 通过
- [ ] CHANGELOG.md 更新
