# S9 Epic 2 Spec: Teams 前端生产验证

## 概述

Teams 前端代码已存在（TanStack Query 状态管理），但：
1. 生产环境未验证
2. E2E 测试仅 4 个用例，不完整

## 现状澄清

**提案描述修正**：
- 原始提案说 Zustand → **实际使用 TanStack Query**
- `useQuery` + `useMutation` + `useQueryClient` 进行服务端状态管理
- 乐观更新通过 `onMutate` + `onError` + `onSettled` 实现

---

## F2.1 Teams 页面生产验证

### 描述
验证 `/dashboard/teams` 在生产环境正常渲染。

### 技术方案
1. `pnpm dev` 本地启动
2. gstack 访问 `/dashboard/teams`
3. 确认 h1 + `.teams-list` 可见

### DoD
- [ ] h1 包含 "Teams"
- [ ] `.teams-list` 可见
- [ ] 401/404/网络错误态均有 UI

---

## F2.2 E2E 测试补全

### 描述
从现有 4 个测试扩展到 8+ 测试用例。

### 新增测试场景（4 个）

| 测试编号 | 场景 | 预期结果 |
|----------|------|----------|
| E3-U5 | `/dashboard/teams/invalid-id-999` | 显示错误 UI |
| E3-U6 | 网络错误 mock（`route.abort()`）| 显示网络错误 UI |
| E3-U7 | 成员视角登录，无 settings 按钮 | settings 按钮隐藏 |
| E3-U8 | 重复创建同名团队 | 显示"已存在"错误 |

### 测试文件
`tests/e2e/teams-ui.spec.ts`

### DoD
- [ ] 总测试用例数 ≥ 8
- [ ] 100% 通过
- [ ] Console 无 error
