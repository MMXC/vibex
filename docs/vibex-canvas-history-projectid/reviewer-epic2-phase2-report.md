# Review Report: Epic2-深度修复（Phase 2）

**Agent**: REVIEWER | 日期: 2026-04-14 02:12
**Commit**: `438af56f` | **项目**: vibex-canvas-history-projectid
**阶段**: reviewer-epic2-深度修复（phase-2）

---

## INV 镜子检视

- [ ] **INV-0** ✅ 实际读取了 CanvasPage.tsx diff
- [ ] **INV-1** ✅ 改 CanvasPage.tsx，sessionStore.setProjectId 是唯一 setter
- [ ] **INV-2** ✅ TypeScript 正确，useToast 在 useEffect 之前声明
- [ ] **INV-4** ✅ useToast 从 line 230 移到 line 137，一处改动
- [ ] **INV-5** ✅ 理解 Phase 2 意图：URL 注入，从根本上解决时序问题
- [ ] **INV-6** ✅ TypeScript tsc --noEmit 通过，逻辑内聚
- [ ] **INV-7** ✅ sessionStore.setProjectId 是唯一 setter，无竞争

---

## Scope Check: CLEAN

**Intent**: Phase 2 URL 注入 projectId + 合法性校验

**Delivered**:
- `438af56f`: CanvasPage.tsx URL ?projectId= 注入 + 校验

**Result**: CLEAN

---

## 代码审查

### ✅ S2.1: CanvasPage URL 注入

```typescript
const toast = useToast(); // moved up so useEffect can reference it

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlProjectId = params.get('projectId');
  if (!urlProjectId) return;

  const currentProjectId = useSessionStore.getState().projectId;
  if (urlProjectId === currentProjectId) return; // skip if already set

  useSessionStore.getState().setProjectId(urlProjectId); // set before async check

  fetch(`/api/projects/${encodeURIComponent(urlProjectId)}`)
    .then((res) => {
      if (!res.ok) {
        useSessionStore.getState().setProjectId(null);
        toast.showToast('项目不存在或无权限访问', 'error');
      }
    })
    .catch(() => {
      useSessionStore.getState().setProjectId(null);
      toast.showToast('项目验证失败，请稍后重试', 'error');
    });
}, []);
```

**优点**:
- `useToast` 在 useEffect 之前声明，避免 Temporal Dead Zone ✅
- `setProjectId` 在校验前先设置（避免校验期间 store 仍为 null）✅
- `encodeURIComponent` 防止路径遍历 ✅
- 404 时 `setProjectId(null)` 回退到 Phase 1 引导模式 ✅
- fetch 失败时同样回退 ✅
- `window.location.search` 在客户端 useEffect 中安全读取 ✅
- `urlProjectId === currentProjectId` 避免不必要的重复设置 ✅

### 🔴 Security: Information Disclosure

⚠️ **潜在问题**: fetch `/api/projects/[id]` 用于校验会泄露有效 projectId 枚举。

不过这是现有 API 设计的固有限制，不在本 PR 修改范围内。且：
- 404 时正确清除 projectId ✅
- 无 projectId 时不发送请求 ✅
- toast 消息无用户输入拼接 ✅

**结论**: 作为 Phase 2 验收可接受，建议后续在 PRD 中标注此为已知限制。

---

## 安全审查

| 检查项 | 结果 |
|--------|------|
| XSS | ✅ encodeURIComponent(urlProjectId) |
| URL traversal | ✅ encodeURIComponent 防止 `%2F` 等 |
| API 泄露 | ⚠️ 已知限制，不在本 PR 范围内 |
| 错误处理 | ✅ fetch 失败 → setProjectId(null) + toast |

---

## 测试结果

| 检查项 | 结果 |
|--------|------|
| pnpm tsc --noEmit | ✅ 无错误 |

Note: Phase 2 无新增单元测试（PRD Epic 2 未列具体测试任务）。Phase 1 有 5 tests。

---

## 质量检查

| 检查项 | 结果 |
|--------|------|
| TypeScript | ✅ |
| 架构设计 | ✅ useToast 提前声明 ✅ |
| PRD 一致性 | ✅ S2.1+S2.2 覆盖 |
| CHANGELOG.md (root) | ✅ c29dd31a 已添加 |
| CHANGELOG.md (frontend) | ✅ 已添加 Epic2 条目 |
| CHANGELOG page.tsx | ✅ 已更新 |

---

## 结论

**VERDICT**: ✅ **PASSED**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 0 |
| 🟡 Suggestions | 1（Information disclosure via /api/projects/[id]，已知限制）|

Phase 2 深度修复完整，URL 注入 + 合法性校验逻辑正确，CHANGELOG 已更新。

**提交记录**:
- `438af56f` feat(canvas): Phase2 URL 注入 projectId — CanvasPage 深度修复
- `a1984e32` review: vibex-canvas-history-projectid/epic2-phase2 approved
