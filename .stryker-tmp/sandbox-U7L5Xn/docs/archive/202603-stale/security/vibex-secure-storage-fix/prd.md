# PRD: vibex-secure-storage-fix

> **状态**: 建设中 | **优先级**: P0 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: oauth.ts 两处空 catch 块导致 OAuth 错误被静默吞掉

---

## 1. 执行摘要

OAuth 刷新 token 和登出时存在空 catch 块，错误被静默吞掉。刷新失败时用户无感知（可能导致认证静默失效），revoke 失败可能引发 token 泄露风险。修复方案：添加错误日志 + 保持业务逻辑不变。

---

## 2. Epic 拆分

### Epic 1: OAuth 空 catch 块修复（P0）

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 刷新 token catch 修复 | 添加 console.error + provider 上下文 |
| S1.2 | revoke catch 修复 | 添加 console.warn（不阻塞登出） |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 刷新 token 错误日志 | catch 块含 console.error + provider + error | expect(code).toContain('console.error') | - |
| F1.2 | revoke 错误日志 | catch 块含 console.warn + provider + error | expect(code).toContain('console.warn') | - |
| F1.3 | 登出仍删除 token | revoke 失败不影响本地 token 删除 | 登出流程最终删除本地 token | - |

---

## 4. 技术约束

1. **不改变返回逻辑**：刷新失败仍返回 false，revoke 失败仍继续删除 token
2. **日志需包含上下文**：provider 名称 + 错误对象（error.message）
3. **关键错误用 error 级别**：刷新失败用 console.error（非 warn）

---

## 5. 实施步骤

```
1. 修改 oauth.ts 刷新 token catch 块 → 添加 console.error
2. 修改 oauth.ts revoke catch 块 → 添加 console.warn
3. npm run lint 验证
```

**预估工时**: 15 分钟

---

## 6. 验收标准汇总

- [ ] F1.1: console.error 存在于刷新 catch 块
- [ ] F1.2: console.warn 存在于 revoke catch 块
- [ ] F1.3: 无空 catch 块（catch 块包含 error 引用）
- [ ] npm run lint 通过

---

*PM Agent | 2026-03-20*
