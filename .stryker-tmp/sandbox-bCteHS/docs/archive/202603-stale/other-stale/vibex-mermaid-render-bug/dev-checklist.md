# 开发检查清单 - Mermaid 实时渲染修复

**项目**: vibex-mermaid-render-bug  
**任务**: impl-mermaid-render-fix  
**日期**: 2026-03-16  
**Agent**: dev

---

## 功能点验收

| ID | 功能 | 验收标准 | 状态 |
|----|------|----------|------|
| F1 | getRenderMermaidCode 函数 | 优先使用 SSE 流式数据 | ✅ |
| F2 | SSE 状态判断 | !== 'idle' 时使用流式数据 | ✅ |
| F3 | 回退逻辑 | SSE idle 时使用静态数据 | ✅ |

---

## 验证结果

### getActiveStreamData 函数
- 位置: `HomePage.tsx:104`
- 逻辑: 优先级 CTX > MODEL > FLOW
- SSE 状态判断: `status !== 'idle'` ✅
- 回退: idle 时返回 null ✅

### 测试
- HomePage 相关测试: 38 passed ✅

---

## 说明

Mermaid 实时渲染逻辑已在 getActiveStreamData 函数中实现，满足所有验收标准。
