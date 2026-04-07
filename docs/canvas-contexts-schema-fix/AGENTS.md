# AGENTS.md — canvas-contexts-schema-fix 开发约束

**项目**: canvas-contexts-schema-fix
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 字段命名规范

```typescript
// ✅ 正确：统一使用 generationId
{ success: true, contexts: [], generationId: 'xxx', confidence: 0.85 }

// ❌ 错误：使用 sessionId
{ success: true, contexts: [], sessionId: 'xxx', confidence: 0.85 }
```

### 1.2 JSDoc 注释规范

```typescript
// ✅ 正确：JSDoc 与代码一致
/**
 * @returns { success: boolean, contexts: BoundedContext[], generationId: string, confidence: number }
 */

// ❌ 错误：JSDoc 与代码不一致
/**
 * @returns { success: boolean, contexts: BoundedContext[], sessionId: string, confidence: number }
 */
```

---

## 2. 代码审查清单

- [ ] JSDoc 注释无 `sessionId`
- [ ] Validator 测试使用 `generationId`
- [ ] 新增 `sessionId` 反向测试

---

*本文档由 Architect Agent 生成于 2026-04-05 01:12 GMT+8*
