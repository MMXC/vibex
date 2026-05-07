# AGENTS.md — Sprint 25 E5 RBAC 安全漏洞修复

## 工作目录
`/root/.openclaw/vibex`

## Epic 1 — RBAC 安全漏洞修复

### dev-epic1
1. 修复 `useCanvasRBAC.ts:83-84`
2. 验证 TS 编译通过
3. commit 并 push

### tester-epic1
1. 运行 `pnpm test -- --run`
2. 验证 RBAC 测试通过
3. 验证 TypeScript 无错误

### reviewer-epic1
1. 检查变更仅涉及两行逻辑
2. 检查 commit message 规范
3. 检查 changelog 更新

### reviewer-push-epic1
1. 验证 push 到 origin/main
2. 最终 CI 检查通过
