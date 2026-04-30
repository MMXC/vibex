# VibeX Sprint 19 QA — Developer Guide

**版本**: v1.0
**日期**: 2026-04-30
**Agent**: architect
**项目**: vibex-sprint19-qa
**状态**: 已采纳

---

## 1. 项目概述

### 背景

Sprint 19 QA 验证：检查 E19-1 Design Review MCP 集成四层代码（API Route / Hook / UI / E2E）的产出完整性、代码质量、交互可用性。

### 验证目标

- 确认 E19-1 代码已消除 mock、实现优雅降级、通过 TypeScript 编译、E2E 覆盖真实路径
- 确认 CHANGELOG E19-1 条目存在（Blocker B1 已解除）
- 确认 E19-1 commit `2f493df6d` 存在于 `origin/main`

### 工作目录

```
/root/.openclaw/vibex/vibex-fronted/
```

---

## 2. 涉及文件清单

| 文件 | 路径 | 操作 | 行数要求 |
|------|------|------|----------|
| API Route | `src/app/api/mcp/review_design/route.ts` | 已实现 | ≥200 行 |
| Hook | `src/hooks/useDesignReview.ts` | 已实现 | ≥150 行 |
| UI 组件 | `src/components/design-review/ReviewReportPanel.tsx` | 已实现 | ≥200 行 |
| E2E 测试 | `tests/e2e/design-review.spec.ts` | 已实现 | ≥100 行 |
| CHANGELOG | `CHANGELOG.md` | 已更新 | 含 E19-1 条目 |

---

## 3. 验证执行规范

### 3.1 文件完整性验证

```bash
# 验证 E19-1 commit 存在
cd /root/.openclaw/vibex/vibex-fronted
git log origin/main --oneline | grep "2f493df6d"

# 验证文件行数
wc -l src/app/api/mcp/review_design/route.ts
wc -l src/hooks/useDesignReview.ts
wc -l src/components/design-review/ReviewReportPanel.tsx
wc -l tests/e2e/design-review.spec.ts

# 验证 CHANGELOG
grep "E19-1" CHANGELOG.md
```

### 3.2 Mock 清除验证

**禁止**在 `useDesignReview.ts` 中出现以下关键词：

- `setTimeout`
- `// Mock`
- `simulated`

```bash
# 验证 mock 已清除
grep -n "setTimeout" src/hooks/useDesignReview.ts
grep -n "// Mock" src/hooks/useDesignReview.ts
grep -n "simulated" src/hooks/useDesignReview.ts
```

**预期**: 0 matches（`// E19-1-S2: Real API call — replaces setTimeout mock` 注释除外）

### 3.3 TypeScript 编译验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm exec tsc --noEmit --project tsconfig.json 2>&1 | grep -E "route\.ts|useDesignReview|ReviewReportPanel" || echo "E19-1 files: 0 TS errors"
```

**注意**: `/api/analytics/funnel` 的 TS 错误与 E19-1 无关，忽略。

### 3.4 API 错误处理验证

```bash
# 缺 canvasId → 400
curl -X POST http://localhost:3000/api/mcp/review_design \
  -H "Content-Type: application/json" \
  -d '{}'

# 正常请求 → 200
curl -X POST http://localhost:3000/api/mcp/review_design \
  -H "Content-Type: application/json" \
  -d '{"canvasId":"test-canvas"}'
```

### 3.5 UI 四态验证

四态必须可通过用户操作触发：

| 状态 | 触发条件 | data-testid |
|------|---------|-------------|
| loading | isLoading === true | `panel-loading` |
| error | error !== null | `panel-error` |
| empty | result === null && !loading && !error | `panel-empty` 含 "Ctrl+Shift+R" 文案 |
| success | result !== null | `panel-tabs` |

```bash
# gstack browse 截图验证
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# 加载态截图
/root/.openclaw/workspace/skills/gstack-browse/bin/browse goto http://localhost:3000/canvas
/root/.openclaw/workspace/skills/gstack-browse/bin/browse screenshot /tmp/qa-loading.png

# 空状态截图（panel 出现后检查文案）
/root/.openclaw/workspace/skills/gstack-browse/bin/browse screenshot /tmp/qa-empty.png
```

### 3.6 E2E 测试执行

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 完整执行
npx playwright test tests/e2e/design-review.spec.ts --reporter=line

# TC1-TC4 新增路径
npx playwright test tests/e2e/design-review.spec.ts \
  --grep "TC[1-4]" --reporter=line

# TC5-TC7 回归路径
npx playwright test tests/e2e/design-review.spec.ts \
  --grep "TC[5-7]" --reporter=line
```

**预期**: TC1-TC7 全部 passed/skipped（无 failed）

---

## 4. 建议修复项追踪

| ID | 问题 | 优先级 | 状态 | 说明 |
|----|------|--------|------|------|
| S1 | autoOpen prop 未使用 | 低 | 建议修复 | 删除 prop 或加入 useEffect deps |
| S2 | designTokens 参数被忽略 | 中 | 已知限制 | changelog 已注明，暂不接入 |
| S3 | `as unknown` 类型断言 | 低 | 建议修复 | 可优化但非阻塞 |
| S4 | TC2 静默 skip | 中 | 建议修复 | panel 不出现时应 fail 而非 pass |

---

## 5. 已知限制

| 限制项 | 说明 | 影响范围 |
|--------|------|----------|
| designTokens 参数 | 始终传空数组，changelog 已注明 | UI 展示 |
| `/api/analytics/funnel` TS 错误 | 与 E19-1 无关 | build 过程 |

---

## 6. 验收标准速查

### 产出物完整性
- [ ] E19-1 commit `2f493df6d` 存在于 `origin/main`
- [ ] CHANGELOG.md 包含 E19-1 条目
- [ ] 4 个核心文件存在且行数符合要求

### 代码质量
- [ ] TypeScript 编译无声通过（E19-1 相关文件）
- [ ] Mock 关键词 grep = 0 matches
- [ ] API 返回 400（缺 canvasId）和 500（服务端错误）

### UI/交互
- [ ] 四态全部可达（loading/error/empty/success）
- [ ] 三 tab 切换正常（compliance/a11y/reuse）
- [ ] 关闭按钮 dismiss panel

### E2E
- [ ] TC1-TC4 新增路径全部通过
- [ ] TC5-TC7 回归路径全部通过

---

## 7. 报告输出

验证完成后，产出报告到：

```
docs/vibex-sprint19-qa/qa-report.md
```

报告格式参考 `prd.md` 的 DoD 章节。

---

## 8. 沟通规范

- 发现 Blocker → 立即上报 architect
- 建议修复项 → 记录但不阻塞
- 所有验证命令结果 → 截图保存到 `/tmp/qa-*.png`
- E2E 测试失败 → 截图 + 视频保存 + 报告路径

---

*文档版本: v1.0*
*创建时间: 2026-04-30 23:25 GMT+8*
*Agent: architect*
