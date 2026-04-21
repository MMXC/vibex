# vibex-tech-debt-qa 经验沉淀

**项目**: Tech Debt QA — 修复测试债务 + 建立质量基线
**完成日期**: 2026-04-21
**经验等级**: 中

---

## 问题概述

VibeX 项目存在 4 个阻断性测试失败 + 关键组件测试缺失，阻断 CI 进度。

## 产出物

| Epic | Commit | 关键成果 |
|------|--------|---------|
| E1: page.test.tsx 修复 | `55e6fdf6` | 189/189 测试通过（1 skipped） |
| E2: proposal-dedup 验证 | `d09ab6cb` | regex 修复 + 10/10 pytest 去重测试 |
| E3: 组件测试补全 | `5741e408` | CardTreeNode 覆盖率 69%→89%，新增 23+8 测试 |
| E4: ErrorBoundary 去重 | `92b7418b` | ErrorBoundary 实例统一导出 |
| E5: HEARTBEAT 追踪 | `92b7418b` | heartbeat_tracker.py 话题变化追踪 |

---

## 关键经验

### 1. Tech Debt 项目的前置诊断必须彻底

E1 的根因不是测试本身有问题，而是 `pre-test-check.js` 的 TypeScript 类型检查先失败，导致测试实际未运行。教训：遇到测试失败，先确认测试是否真的运行了。

### 2. 覆盖率目标要基于实际基线设定

CardTreeNode 已有 149 行测试代码，E3-U1 应聚焦覆盖率缺口（lazy loading、root 类型）而非从零重建。盲目推倒重来浪费 80% 的已有工作。

### 3. ErrorBoundary 多实例问题需要精确盘点

不能简单"合并所有 ErrorBoundary"——`CardErrorBoundary` 有语义隔离价值（卡片级错误捕获），`VisualizationPlatform` 的 class ErrorBoundary 有 custom fallback UI。策略：保留特化边界，统一全局根边界。

### 4. proposal_tracker.py 去重逻辑需用真实数据验证

代码中已有去重逻辑（Strategy 1+2），但无生产验证。必须写 pytest 测试套件用 tmp_path fixture 模拟边界场景（跨日期同名 proposal、Strategy 双重匹配），才能确保 prod 无误报。

### 5. 测试覆盖率阈值要分场景

- 工具类脚本（proposal_tracker.py）：分支覆盖 100%
- 组件（CardTreeNode）：行覆盖率 > 80%（已有基线）
- API 错误处理：关键路径覆盖即可（401/500/timeout）

---

## 相关文件变更

- `vibex-fronted/src/__tests__/page.test.tsx` — 修复 TS 错误后测试通过
- `scripts/proposal_tracker.py` — 正则修复 + 去重逻辑增强
- `vibex-fronted/src/components/visualization/CardTreeNode/__tests__/` — 覆盖率补充
- `vibex-fronted/src/components/ui/ErrorBoundary.tsx` — 统一导出
- `scripts/heartbeat_tracker.py` — 新建，话题变化追踪

## 提交记录

- `55e6fdf6` docs(tech-debt-qa): E1-U1/U2 page.test.tsx verification — 189/189 pass
- `d09ab6cb` feat(E2): proposal-dedup — fix regex, add dedup, write test suite (10/10)
- `625bd311` feat(E3): component tests — CardTreeNode + AuthError (23+8 tests)
- `5741e408` feat(E3-U1): CardTreeNode coverage 69.38% → 89.79% (+11 tests)
- `92b7418b` feat(E4-U1, E5-U1): ErrorBoundary 去重 + HEARTBEAT 话题追踪脚本
- `d7972f81` docs: update CHANGELOG for vibex-tech-debt-qa E4+E5

## 可复用模式

### Tech Debt 诊断模板

```bash
# 1. 确认测试是否真的运行
node scripts/pre-test-check.js

# 2. 运行测试获取真实失败
pnpm test <file> --reporter=verbose

# 3. 按文件分类 TS 错误
pnpm exec tsc --noEmit 2>&1 | grep "page.test.tsx" | sort -u

# 4. 覆盖率基线
pnpm test --coverage --reporter=verbose
```

### ErrorBoundary 多实例盘点模板

```typescript
// 1. 找到所有 ErrorBoundary 实例
grep -rn "ErrorBoundary" src --include="*.tsx" | grep -v "test\|spec"

layout.tsx → AppErrorBoundary (全局根)
MermaidPreview.tsx → ui/ErrorBoundary (局部边界)
VisualizationPlatform.tsx → class ErrorBoundary (custom fallback)
CardRenderer.tsx → CardErrorBoundary (语义隔离)
```
