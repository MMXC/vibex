# SPEC: E5 — Git Hooks 强制（规划，Sprint 4）

**项目**: vibex-reviewer-proposals-20260403_024652
**Epic**: E5: Git Hooks 强制（规划，Sprint 4）
**版本**: v1.0
**日期**: 2026-04-03
**状态**: 规划中

---

## 1. Epic 概述

### 1.1 目标
通过 Git hooks 强制执行 CHANGELOG 检查和代码质量检查，作为方案 A 的增强。

### 1.2 预期收益
- 强制执行，不依赖 Dev 主动性
- 预计减少 80%+ 的可预检问题
- CI 反馈更快（在本地而非 CI 服务器）

### 1.3 风险提示
- pre-commit hook 可能增加开发摩擦
- 需要团队同意后才能实施

---

## 2. Stories

### E5-S1: commit-msg hook 安装与验证（规划）

**功能点**:
1. 安装 husky + commitlint
2. 验证 commit message 格式：`feat/fix/refactor: <描述> (E<n>-S<n>)`
3. 验证 CHANGELOG.md 在变更列表中

**验收标准**:
```javascript
expect(fs.existsSync('.husky/commit-msg')).toBe(true);
expect(fs.readFileSync('.husky/commit-msg', 'utf8')).toContain('commitlint');
expect(fs.readFileSync('.commitlintrc.js', 'utf8')).toContain('E{0-9}');
```

**工时**: 2h（规划）
**依赖**: Sprint 3 完成
**优先级**: P2（规划）

---

### E5-S2: pre-commit hook 安装与验证（规划）

**功能点**:
1. 在 pre-commit hook 中运行 `npm run lint` + `npx tsc --noEmit`
2. 失败时阻断 commit
3. 可选：集成 pre-submit-check.sh

**验收标准**:
```javascript
expect(fs.existsSync('.husky/pre-commit')).toBe(true);
const hook = fs.readFileSync('.husky/pre-commit', 'utf8');
expect(hook).toContain('tsc --noEmit');
expect(hook).toContain('eslint');
```

**工时**: 3h（规划）
**依赖**: E5-S1
**优先级**: P2（规划）

---

## 3. DoD Checklist（规划）

- [ ] husky 已安装，commit-msg hook 生效
- [ ] pre-commit hook 已安装且能阻断失败的 commit
- [ ] 团队已同意 Git hooks 强制方案
