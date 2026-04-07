# PRD: vibex-xss-token-security

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-xss-token-security |
| **类型** | 安全修复 |
| **目标** | 将 Auth token 从 localStorage 迁移到 sessionStorage，消除 XSS 劫持风险 |
| **完成标准** | 令牌存储在 sessionStorage，登录流程正常 |
| **工作量** | 1 天 |
| **页面集成** | 【需页面集成】LoginPage (/login), AuthContext |

---

## 2. 问题陈述

当前认证令牌存储在 localStorage，存在 XSS 攻击风险。攻击者可注入恶意脚本读取 localStorage 并传输令牌到攻击者服务器。

---

## 3. Epic 拆分

### Epic 1: 存储迁移

**Story F1.1**: 修改 auth.ts 存储逻辑
- 将 `localStorage.setItem('auth_token', token)` 改为 `sessionStorage.setItem('auth_token', token)`
- **验收标准**:
  - `expect(sessionStorage.getItem('auth_token')).toBe(token)`
  - `expect(localStorage.getItem('auth_token')).toBe(null)`

**Story F1.2**: 检查 useAuth hook
- **验收标准**:
  - `expect(useAuth).toReadFrom('sessionStorage')`
  - `expect(useAuth).not.toReadFrom('localStorage')`

### Epic 2: 测试验证

**Story F2.1**: 编写 E2E 测试
- **验收标准**:
  - `expect(await page.evaluate(() => sessionStorage.getItem('auth_token'))).toBeDefined()`
  - 登录后跳转到首页，`expect(currentUrl).toContain('/home')`

**Story F2.2**: 手动验证登录流程
- **验收标准**:
  - `expect(loginFlow).toCompleteWithoutError()`

### Epic 3: 回归检查

**Story F3.1**: 验证页面刷新行为
- **验收标准**:
  - 页面 F5 刷新后，`expect(sessionStorage.getItem('auth_token')).not.toBeNull)`

**Story F3.2**: 验证标签页隔离
- **验收标准**:
  - 关闭标签页后，`expect(sessionStorage.getItem('auth_token')).toBeNull)`
  - 新标签页打开应用，`expect(sessionStorage.getItem('auth_token')).toBeNull)`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 登录成功 | 存储令牌 | sessionStorage 有值 |
| AC1.2 | 检查存储 | DevTools | localStorage 无值 |
| AC2.1 | 页面刷新 | F5 | 令牌保持 |
| AC2.2 | 关闭标签页 | 关闭窗口 | 令牌清除 |
| AC2.3 | 新标签页打开 | 复制 URL | 需重新登录 |
| AC3.1 | 登录流程 | E2E 测试 | 流程正常 |

---

## 5. 影响范围

| 模块 | 状态 | 说明 |
|------|------|------|
| auth.ts | 需修改 | 存储 API 变更 |
| useAuth hook | 需检查 | 依赖检查 |
| 登录组件 | 需测试 | 登录后验证 |

---

## 6. 非功能需求

- **安全性**: XSS 无法获取令牌
- **用户体验**: 会话保持正常
- **兼容性**: 不影响现有功能

---

## 7. DoD

- [ ] 令牌存储在 sessionStorage
- [ ] 页面刷新后令牌保持
- [ ] 关闭标签页后令牌清除
- [ ] E2E 测试通过
- [ ] Code Review 通过
