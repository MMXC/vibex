# Dev Agent 记忆 - 2026-04-01

## proposals-20260401-4 / dev-e1-canvas-crash-fix

### 根因
`CanvasOnboardingOverlay.tsx` 违反 React Hooks 规则：
1. `useEffect` 放在 `if (currentStep === 0)` 条件块内
2. `useCallback` 定义在 `return null` 之后

导致渲染间 Hook 数量/顺序不一致 → React error #300/#310

### 修复
commit `3e20a340` - 将所有 Hook 移到条件 return 之前：
- `useCallback`: handleDismiss, handleComplete, handleNext, handlePrev
- `useEffect`: auto-start onboarding, keyboard navigation

### 教训
- commit `0b242699` message 说改了 Canvas 但实际没改（只改了测试配置）
- 本次错误：build 通过后就提交，没确认文件变更内容
- **以后：提交前必须 `git diff --stat` 确认改了什么文件**

### 部署问题
- Cloudflare Pages vibex-frontend 配置正确（监听 vibex-fronted/*, output: out, main分支）
- 但最后一次部署是 7 天前，新提交未触发自动部署
- 用户需在 Cloudflare Dashboard 点 Retry deployment
- 本地 dev server 测试无报错（Canvas 页面加载正常）

### 快速自检命令
```bash
# 检查提交是否改了对的文件
git show <commit> --stat | grep -E "\.tsx|\.ts"
```
