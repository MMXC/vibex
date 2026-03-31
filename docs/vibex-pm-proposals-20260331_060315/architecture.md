# Architecture: vibex-pm-proposals-20260331_060315

**Project**: PM 自检提案 — 状态管理 + 提案追踪 + 用户引导 + PRD 模板
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-pm-proposals-20260331_060315/prd.md

---

## 1. Epic 1: Canvas 状态管理规范

### 问题
`selectedNodeIds` (store) vs `node.confirmed` (data) 两套状态并行，容易不一致。

### 方案：单一状态源
```
checkbox 点击 → action: toggleConfirmed(nodeId) → 直接修改 node.confirmed
                                            → Zustand action
                                            → 触发 selectedNodeIds 重算
```

```typescript
// contextSlice.ts
const toggleConfirmed = (nodeId: string) => {
  set(state => ({
    contextNodes: state.contextNodes.map(n =>
      n.id === nodeId ? { ...n, confirmed: !n.confirmed } : n
    )
  }));
};

// derived: selectedNodeIds = contextNodes.filter(n => n.confirmed).map(n => n.id)
```

### 状态机
```
未确认 → 点击 → 已确认
已确认 → 点击 → 未确认
```

---

## 2. Epic 2: 提案生命周期追踪

### 状态机
```
submitted → reviewing → adopted → executed
                  ↘ rejected
```

### 追踪表结构
```sql
CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  title TEXT,
  agent TEXT,
  status TEXT,  -- submitted/reviewing/adopted/rejected/executed
  created_at INTEGER,
  updated_at INTEGER,
  adopted_at INTEGER,
  executed_at INTEGER,
  sprint TEXT,
  notes TEXT
);
```

### Slack 通知
状态变更时自动通知：
```bash
# team-tasks/status-change.sh
if [ "$NEW_STATUS" == "adopted" ]; then
  openclaw message send --message "✅ 提案已采纳：$PROPOSAL_TITLE"
elif [ "$NEW_STATUS" == "rejected" ]; then
  openclaw message send --message "❌ 提案已拒绝：$PROPOSAL_TITLE"
fi
```

---

## 3. Epic 3: 用户引导流程

### 引导触发点
| 场景 | 引导内容 |
|------|---------|
| 首次登录（无项目） | 快速上手教程（3 步） |
| Canvas 三栏空白 | 空状态引导文案 |
| 关键操作悬停 | Tooltip 说明 |

### 可跳过教程
```typescript
// onboardingStore.ts
const ONBOARDING_KEY = 'vibex_onboarding_completed';
const skipOnboarding = () => localStorage.setItem(ONBOARDING_KEY, 'true');
const isOnboardingComplete = () => localStorage.getItem(ONBOARDING_KEY) === 'true';
```

---

## 4. Epic 4: PRD 模板标准化

### 统一模板位置
`/root/.openclaw/vibex/docs/analysis-template.md`

### 模板验证脚本
```bash
#!/bin/bash
# scripts/validate-prd.sh
required_fields=("背景" "目标" "Epic" "验收标准" "DoD")
for field in "${required_fields[@]}"; do
  if ! grep -q "$field" "$1"; then
    echo "Missing: $field"
    exit 1
  fi
done
```

---

*Architect 产出物 | 2026-03-31*
