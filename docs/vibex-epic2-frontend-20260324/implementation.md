# Epic2-Frontend: E2E CI 集成 — 实现方案

**项目**: vibex-epic2-frontend-20260324
**任务**: dev-p1-5-e2e-ci
**创建时间**: 2026-03-25

---

## 背景

E2E 测试已存在于 `vibex-fronted/tests/e2e/`，GitHub Actions workflow `e2e-tests.yml` 已配置但存在以下问题：
1. `continue-on-error: true` 掩盖真实失败
2. 未显式指定 `playwright.ci.config.ts`
3. CI 配置可能需要内存优化

## 修复内容

### 1. e2e-tests.yml — 修复 CI 适配

**问题**: `continue-on-error: true` 导致测试失败时 CI 仍显示 green
**修复**: 移除 `continue-on-error`，仅在 flaky tests 使用条件跳过

### 2. playwright.ci.config.ts — 内存优化

已在 `playwright.ci.config.ts` 中配置：
- `--no-sandbox` / `--disable-setuid-sandbox`（Chromium CI args）
- workers: `undefined`（自动选择 CPU 核心数）
- retries: 3（CI 稳定性）
- `--shard` 分片支持

### 3. Changelog 更新

记录 E2E CI 集成为 Epic2-P1-5 完成项。

## 验收标准

- [ ] `continue-on-error: true` 已移除
- [ ] E2E 测试使用 `playwright.ci.config.ts`
- [ ] Changelog 已更新
- [ ] `git status --porcelain` 无未提交文件
