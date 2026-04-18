# AGENTS.md — vibex-sprint6-ai-coding-integration-qa

**项目**: vibex-sprint6-ai-coding-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## 开发约束

### 绝对禁止

1. **禁止删除 mockAgentCall()** → 这是有意的架构占位符，UI 测试依赖它
2. **禁止创建 `/canvas/delivery/version/page.tsx` 而不确认路由规范** → 先与 analyst 对齐路由
3. **禁止引入新依赖** → 修复仅使用已有依赖
4. **禁止修改 VersionDiff.tsx 核心逻辑** → diffVersions() 已正确使用 jsondiffpatch

### 约束理由

| 约束 | 原因 |
|------|------|
| #1 mockAgentCall | UI 完整，mock 是正确的工程选择，后端 API 就绪前禁止删除 |
| #2 路由对齐 | `/version-history` 与 `/canvas/delivery/version` 需 PM/analyst 确认哪个正确 |
| #4 VersionDiff | jsondiffpatch 是成熟库，核心逻辑已通过测试 |

---

## 文件路径

```
src/services/agent/CodingAgentService.ts       ← E2-U1 BLOCKER（只读，不修改）
src/components/agent/AgentFeedbackPanel.tsx     ← UI 组件，完整
src/components/agent/AgentSessions.tsx           ← UI 组件，完整
src/components/version-diff/VersionDiff.tsx      ← E3-U1（只读）
src/lib/version/VersionDiff.ts                 ← diffVersions()，完整
src/app/version-history/page.tsx                ← E3 实际路由入口
src/app/canvas/delivery/version/page.tsx        ← E3-U2 BLOCKER（NOT FOUND）
src/app/api/chat/route.ts                      ← E1-U1，完整
src/lib/figma/image-ai-import.ts              ← E1-U1，完整
```

---

## 驳回条件

- 删除 `mockAgentCall()` → 驳回重做（破坏 UI 测试）
- 创建 `/canvas/delivery/version/page.tsx` 前未与 analyst 对齐路由 → 驳回重做
- 引入新依赖 → 驳回重做
