# P1-001: 原生 confirm() / window.prompt() 阻塞 UI（Reviewer UX 建议）

**严重性**: P1 (UX)
**Epic**: E1
**Spec 引用**: vibex-sprint2-spec-canvas/reviewer-epic1-三章节卡片管理-review.md

## 问题描述

Reviewer E1 发现以下原生浏览器 API 使用，阻塞 UI 线程且体验差：
1. `confirm()` dialog 用于卡片删除确认
2. `window.prompt()` 用于 FlowStep stepName 输入

## 代码证据

```bash
grep -rn "confirm(" src/components/dds/
# 预期：0 处
# 实际（待验证）：有使用

grep -rn "window.prompt" src/components/dds/
# 预期：0 处
# 实际（待验证）：有使用
```

## 修复建议

1. 删除 `confirm()` → 替换为 Modal 组件
2. 删除 `window.prompt()` → 替换为 InlineForm 组件

## 影响范围

- `src/components/dds/` 卡片相关组件
