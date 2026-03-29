# AGENTS.md — VibeX Canvas Checkbox 去重

> **项目**: vibex-canvas-checkbox-dedup  
> **创建日期**: 2026-03-30  
> **任务分发者**: analyst  

---

## 1. 任务概览

| 任务 | 负责人 | 依赖 | 状态 |
|------|--------|------|------|
| Epic 1: Checkbox 重构 | dev | - | ✅ done |
| Epic 2: 批量删除优化 | dev | Epic 1 | ✅ done |
| Epic 3: 测试与验证 | tester | Epic 1+2 | ✅ done |
| Code Review | reviewer | Epic 1+2 | in-progress |

---

## 2. Agent 职责

### 2.1 Dev Agent

**任务**: 实现所有 Epic 代码改动

**职责**:
1. 执行 `IMPLEMENTATION_PLAN.md` Phase 1-2 所有改动
2. 确保代码符合现有代码风格
3. 提交代码并创建 PR
4. 响应 review 反馈

**关键文件**:
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- `vibex-fronted/src/components/canvas/canvas.module.css`

**验收标准**:
- `npm test` 通过
- PR review 通过

---

### 2.2 Tester Agent

**任务**: Epic 3 测试与验证

**职责**:
1. 更新单元测试用例
2. 使用 gstack browse 截图验证 UI
3. 验证批量删除流程
4. 更新测试文档

**测试用例更新**:
```typescript
// BoundedContextTree.test.tsx 更新项:
expect(screen.getAllByRole('checkbox').length).toBe(contextNodes.length);
expect(screen.getByText('确认所有')).toBeInTheDocument();
expect(screen.queryByRole('button', { name: '确认' })).not.toBeInTheDocument();
```

**gstack 验证清单**:
- [ ] 每个卡片只有一个 checkbox
- [ ] checkbox 出现在描述文本之前
- [ ] 点击 checkbox 直接切换 confirmed 状态
- [ ] 无"确认"按钮
- [ ] 全选按钮文案为"确认所有"
- [ ] 删除操作可直接执行（无需预勾选）

---

### 2.3 Reviewer Agent

**任务**: Code Review

**职责**:
1. 检查代码改动符合 PRD
2. 验证无 selection checkbox 残留
3. 检查 checkbox 位置正确
4. 确认删除功能无需预勾选
5. 检查 CSS 改动无副作用

**Review 清单**:
- [ ] `aria-label="选择"` 不存在
- [ ] Confirmation checkbox 在描述前
- [ ] `onConfirm` 直接绑定 checkbox onChange
- [ ] "确认"按钮已删除
- [ ] "确认所有"按钮文案正确
- [ ] 删除按钮始终可用
- [ ] CSS 无冲突

---

## 3. 执行顺序

```
analyst (task done)
    ↓
dev (Epic 1 → Epic 2)
    ↓
reviewer (review)
    ↓
tester (Epic 3: test + gstack verify)
    ↓
reviewer (final review)
    ↓
ship (merge PR)
```

---

## 4. 任务分发命令

使用 team-tasks 分发任务：

```bash
# Epic 1 + Epic 2
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py add \
  --project vibex-canvas-checkbox-dedup \
  --task impl-checkbox-dedup \
  --agent dev \
  --description "实现 Epic 1 (Checkbox 重构) + Epic 2 (批量删除优化)" \
  --epic impl \
  --prd /root/.openclaw/vibex/docs/vibex-canvas-checkbox-dedup/prd.md

# Epic 3
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py add \
  --project vibex-canvas-checkbox-dedup \
  --task test-checkbox-dedup \
  --agent tester \
  --description "Epic 3: 测试与验证 (单元测试 + gstack 截图)" \
  --epic test \
  --depends impl-checkbox-dedup

# Review
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py add \
  --project vibex-canvas-checkbox-dedup \
  --task review-checkbox-dedup \
  --agent reviewer \
  --description "Code Review: Checkbox 去重改动" \
  --epic review \
  --depends test-checkbox-dedup
```

---

## 5. 关键约束

1. **Epic 规模治理**: 遵循 ≤5 功能点/Epic
2. **单一职责**: 每个 PR 只包含一个 Epic 的改动
3. **gstack 验证**: Epic 3 必须包含可视化截图验证
4. **无 regression**: 现有功能不受影响

---

## 6. 成功标准

- [x] Epic 1+2 代码改动完成并通过 review
- [x] Epic 3 测试通过 + gstack 截图验证通过
- [ ] PR 已创建并合并
- [x] `npm test` 全部通过
- [ ] 90% 用户能正确完成确认/删除操作（预期达成）
