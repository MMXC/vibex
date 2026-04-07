# VibeX P0 Bug 修复开发规范

> **项目**: vibex-p0-fixes-20260406  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 强制规范

### 变更范围

| Epic | 改动文件 |
|------|----------|
| E1 | gateway.ts |
| E2 | BoundedContextTree.tsx |
| E3 | generate-components schema + prompt |
| E4 | aiService.ts |
| E5 | dedup.js（新建） + test-notify.js |

### 禁止事项

| 禁止项 | 原因 |
|--------|------|
| E1 中调整其他中间件顺序 | 仅改 OPTIONS 顺序 |
| E2 中修改 toggleContextNode | checkbox 和右键菜单是不同功能 |
| E4 中删除 clearTimeout | 引入内存泄漏 |
| E5 中删除原有 test-notify 逻辑 | 仅叠加去重 |

---

## 代码风格

### TypeScript

- **禁止 `any`**：使用 `unknown` + 类型守卫
- **错误处理**：所有 async 函数必须有 try-catch
- **导出类型**：`interface` / `type` 必须显式导出

---

## 测试要求

| Epic | 覆盖率目标 | 核心断言 |
|------|-----------|----------|
| E1 | 100% | OPTIONS 204 + CORS headers |
| E2 | 90% | onToggleSelect 被调用 |
| E3 | 95% | flowId 匹配 /^flow-/ |
| E4 | 90% | clearTimeout 被调用 |
| E5 | 95% | 5min 去重 |

---

## 审查清单

### E1: OPTIONS
- [ ] `gateway.ts` OPTIONS 在 authMiddleware 之前
- [ ] GET/POST/DELETE 回归测试通过

### E2: checkbox
- [ ] checkbox onChange 只调用 onToggleSelect
- [ ] toggleContextNode 右键菜单仍正常

### E3: flowId
- [ ] schema 包含 flowId
- [ ] prompt 明确要求

### E4: SSE 超时
- [ ] AbortController.timeout(10000)
- [ ] cancel() 中 clearTimeout

### E5: 去重
- [ ] checkDedup + recordSend 成对使用
- [ ] 5min 窗口正确
