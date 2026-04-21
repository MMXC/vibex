# Tech Debt — PRD

**项目**: vibex-tech-debt-qa
**日期**: 2026-04-20

## Epic P0 — 阻断性问题修复

### E1: page.test.tsx 4 个预存失败

**验收标准**: `pnpm test page.test.tsx` 全部通过

### E2: proposal-dedup 生产验证缺失

**验收标准**: proposal_tracker.py 能正确去重，无误报

## Epic P1 — 重要改进

### E3: 组件测试补全

- CardTreeNode 单元测试
- API 错误处理测试
- Accessibility 测试基线

### E4: ErrorBoundary 去重

**验收标准**: 只有一个 ErrorBoundary 实例被渲染

## Epic P2 — 改进项

### E5: HEARTBEAT 话题追踪

**验收标准**: 脚本能追踪 heartbeat 话题变化
