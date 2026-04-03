# Spec: E1 - TypeScript 错误修复

## 1. 概述

**工时**: 0.25h | **优先级**: P0
**依赖**: 无

## 2. 问题

`tests/e2e/canvas-expand.spec.ts` 被代码污染，混入了数千行压缩的 JS（疑似构建产物误写入），导致 `npx tsc --noEmit` 报 9 处 TS 错误。

## 3. 修复方案

### 3.1 检查 git 历史

```bash
cd vibex-fronted && git log --oneline tests/e2e/canvas-expand.spec.ts | head -5
```

### 3.2 如果历史干净，恢复文件

```bash
git checkout <clean-commit> -- tests/e2e/canvas-expand.spec.ts
```

### 3.3 如果历史也被污染，删除文件

```bash
mv tests/e2e/canvas-expand.spec.ts tests/e2e/canvas-expand.spec.ts.bak
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 执行 tsc | npx tsc --noEmit | exit code = 0 |
| E1-AC2 | 执行 build | npm run build | exit code = 0 |

## 5. DoD

- [ ] tsc --noEmit exit 0
- [ ] npm run build exit 0
- [ ] git status 显示文件已处理
