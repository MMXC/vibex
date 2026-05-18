**Agent**: hermes (coord self-implement)
**日期**: 2026-05-18
**项目**: vibex-proposals-sprint38
**触发**: architect-review ghost — AGENTS.md missing; coord created from architecture.md

---

# AGENTS.md — Sprint 38 开发约束

## 开发环境

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm dev          # 开发服务器
pnpm test         # 单元测试
pnpm test:e2e     # E2E 测试
pnpm build        # 构建
pnpm exec tsc --noEmit  # TypeScript 检查
```

## 关键技术约束

### i18n (P001)
- 使用 `next-intl` ≥ 3.x，App Router 原生集成
- 创建 `src/i18n/messages/en.json` 和 `zh.json`
- DDSToolbar 按钮文本必须通过 `useTranslations('toolbar')()` 获取
- 中间件自动检测 `Accept-Language` header

### 协作感知 (P002)
- `businessFlowStore` 增加 `oplog: OperationEntry[]` 字段
- AI Agent 操作时写入 `oplog` entry，`type='ai'`
- 同一 `nodeId` 在 5s 内两次写入 → 冲突警告

### AI 反馈回路 (P003)
- Diff overlay 使用 `diff` npm 包（jsdiff）
- 评分卡存储到 `userPreferencesStore.aiScores[]`
- `useAIAgent` hook 增加 `lastResult` 和 `lastError`

### E2E 稳定性 (P004)
- `waitForTimeout` 替换为 Playwright 原生 waitForSelector
- retry 配置：`retries: 2`，`timeout: 30_000`

### 虚拟化 (P005)
- 使用 `@tanstack/react-virtual`（非 react-window）
- Feature flag 控制，默认关闭

## Phase2 Epic DoD（从 IMPLEMENTATION_PLAN.md 读取具体条目）

详见 `/root/.openclaw/vibex/docs/vibex-proposals-sprint38/IMPLEMENTATION_PLAN.md`

## 禁止事项

- 禁止在 `src/app/` 下手动编辑页面文件
- 禁止使用内联 `style={{}}` 定义颜色/间距/字体
- 禁止 commit 无 Epic 标识的 message
- 所有 Epic 变更必须更新 `CHANGELOG.md`
