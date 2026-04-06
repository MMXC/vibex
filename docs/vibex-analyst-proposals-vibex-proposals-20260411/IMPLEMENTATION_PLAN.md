# IMPLEMENTATION_PLAN: VibeX Analyst Proposals — Execution Closure 2026-04-11

> **项目**: vibex-analyst-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 AM | E1: P0 止血修复 | 3.5h |
| Sprint 2 | Day 1 PM | E2: 提案闭环机制 | 2h |
| Sprint 3 | Day 2 | E3: Tree Toolbar + flowId | 1.5h |

**总工时**: 7h | **团队**: 1 Dev

---

## Sprint 1: P0 止血（3.5h）

### S1.1: Slack Token（0.5h）

```bash
# 修复 task_manager.py
sed -i 's/SLACK_BOT_TOKEN = "xoxp.*"/SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")/g' task_manager.py
```

### S1.2: ESLint any（1h）

```bash
grep -rn "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | head -20
# 逐文件修复
```

### S1.3: PrismaClient Workers（1h）

```typescript
# lib/prisma.ts
export function getPrisma() {
  if (isWorkers()) return new PrismaClient();
  if (!globalThis.__prisma) globalThis.__prisma = new PrismaClient();
  return globalThis.__prisma;
}
```

### S1.4: @ci-blocking（1h）

```bash
grep -rn "@ci-blocking" tests/e2e/ | head -40
# 逐文件评估修复或移除
```

---

## Sprint 2: 提案闭环（2h）

### E2: CLI CI 集成

```yaml
# .github/workflows/proposal-tracking.yml
- name: Check Proposal Tracking
  run: node scripts/proposal-cli.js check
```

---

## Sprint 3: UI + 测试（1.5h）

### E3: Tree Toolbar 统一

```bash
grep -rn "TreeToolbarButton\|Button.*style" vibex-fronted/src/
# 统一为 2 种样式
```

### E3: flowId E2E

```typescript
test('generate-components includes flowId', async ({ page }) => {
  const flowId = await page.evaluate(() => window.__FLOW_ID__);
  expect(flowId).toMatch(/^[0-9a-f-]{36}$/);
});
```

---

## 验收

```bash
# Slack Token
grep "xoxp" task_manager.py  # 应为空

# ESLint
pnpm exec tsc --noEmit  # 0 errors

# Prisma
pnpm run deploy  # 成功

# @ci-blocking
grep "@ci-blocking" tests/ | wc -l  # 0
```

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
