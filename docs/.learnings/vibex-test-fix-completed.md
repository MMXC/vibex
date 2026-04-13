# 项目经验沉淀: vibex-test-fix

## 概述

修复 vibex 前端项目 `npm test` 大量失败，交付 4 个 Epic：
- **Epic 1**：全局 `IntersectionObserver` mock（setup.ts）
- **Epic 2**：`jest-axe` 包安装 + accessibility 测试修复
- **Epic 3**：页面测试选择器修复（page / dashboard / export）
- **Epic 4**：全量回归验证

## 做得好的

- **历史经验复用**：直接参考 `vibex-test-env-fix` 的解决思路，集中式 mock 优于分散修复
- **验收测试先行**：为每个 Epic 创建 `setup.spec.ts` / `accessibility.spec.ts` / `selector-patterns.spec.ts`，用 26 个独立测试覆盖 PRD 验收标准，确保修复不退化
- **Epic 拆分颗粒度合理**：4 个 Epic 独立可交付，回归范围清晰

## 做得困难的

- **根因预判偏差**：PRD 描述的失败原因（"元素未找到" / "Found multiple"）与实测不符，Epic 3 实施前必须先跑测试拿真实堆栈
- **jest-axe ES module mock**：`{ __esModule: true, default: ... }` 格式是 vitest+ts 的坑，花了额外时间排查
- **全量测试 OOM**：292 个测试文件无法一次跑完，只能分批验证，Epic 4 耗时比预期长

## 下次改进

1. **不要在 PRD 阶段假设根因**——先 `npx vitest run` 拿真实错误再写方案
2. **Server Component 测试策略**：HomePage 直接 redirect 的场景，不需要渲染断言，只需验证 redirect 行为即可
3. **全局 mock 引入前**，先检查是否已有类似 mock，避免覆盖已有配置

## 技术笔记

- `IntersectionObserver` mock 关键：`vi.fn((callback) => ({...}))` 直接返回对象，不要在回调里 `return`
- `jest-axe` 配合 `@testing-library/jest-dom` 无冲突，vitest ESM 环境需注意 `{ __esModule: true }` 格式
- `getAllByText` + count 验证是解决 "Found multiple" 的标准做法；`getByTestId('format-card-{id}')` 是项目内约定的精确选择器模式
