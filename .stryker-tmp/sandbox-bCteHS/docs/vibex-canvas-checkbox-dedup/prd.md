# PRD: VibeX Canvas Checkbox 去重 — 统一确认状态

> **任务**: vibex-canvas-checkbox-dedup/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/vibex-canvas-checkbox-dedup/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas 卡片同时显示 selection checkbox（批量删除用）和 confirmation checkbox（确认用），用户混淆 |
| **目标** | 移除 selection checkbox，统一确认状态交互 |
| **关键决策** | 删除操作直接执行，无需勾选确认 |
| **成功指标** | 90% 用户能正确完成确认/删除操作 |

---

## 2. 功能需求

### F1: 移除 Selection Checkbox

**描述**：移除 header 区域的 selection checkbox（用于批量删除的勾选框）

**验收标准**：
```
expect(code).not_toContain('aria-label="选择');
expect(code).not_toContain('onToggleSelect');
expect(document.querySelectorAll('[type="checkbox"]').length).toBe(1);
```

### F2: 确认 Checkbox 移至描述前

**描述**：将 confirmation checkbox 从 header 移至描述文本之前，点击直接切换 `confirmed` 状态

**验收标准**：
```
expect(checkboxPosition).toBeBefore(descriptionElement);
expect(clickCheckbox).toToggleConfirmedState();
```

### F3: 移除"确认"按钮

**描述**：删除操作已被 checkbox 取代，移除单独的"确认"按钮

**验收标准**：
```
expect(page).not_toHaveButton('确认');
```

### F4: 全选按钮改为"确认所有"

**描述**：全选按钮文案更新为"确认所有"，调用 `handleConfirmAll`

**验收标准**：
```
expect(page).toHaveButton('确认所有');
expect(clickConfirmAll).toCall('handleConfirmAll');
```

### F5: 批量删除保留（无需预勾选）

**描述**：删除功能保留，但用户可直接删除，无需先勾选 selection checkbox

**验收标准**：
```
expect(deleteButton).toBeEnabled();
expect(deleteWithoutSelect).toExecute();
```

---

## 3. UI/UX 流程

### 3.1 当前结构
```
┌─────────────────────────────────┐
│ [□选择] [type] [✓已确认]        │  ← 两个 checkbox 混淆
├─────────────────────────────────┤
│ 标题                            │
│ 描述                    [删除]  │
└─────────────────────────────────┘
```

### 3.2 目标结构
```
┌─────────────────────────────────┐
│ [type] [✓确认 checkbox]         │  ← 单一 checkbox
├─────────────────────────────────┤
│ 标题                            │
│ [✓] 描述                [删除]  │  ← checkbox 在描述前
└─────────────────────────────────┘
```

### 3.3 交互流程

| 操作 | 当前 | 目标 |
|------|------|------|
| 确认节点 | 点击"确认"按钮 | 点击描述前 checkbox |
| 删除节点 | 勾选 → 点击删除 | 直接点击删除 |
| 批量确认 | 全选 → 确认 | 点击"确认所有" |
| 批量删除 | 勾选 → 删除 | 直接批量删除 |

---

## 4. Epic 拆分

### Epic 1: Checkbox 重构（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S1.1 | 移除 header selection checkbox | P0 | 1h |
| S1.2 | 将 confirmation checkbox 移至描述前 | P0 | 1h |
| S1.3 | 点击 checkbox 切换 confirmed 状态 | P0 | 1h |
| S1.4 | 移除"确认"按钮 | P0 | 0.5h |
| S1.5 | 修改全选按钮文案为"确认所有" | P0 | 0.5h |

### Epic 2: 批量删除优化（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S2.1 | 批量删除无需预勾选 | P0 | 1h |
| S2.2 | 验证批量删除流程 | P0 | 0.5h |

### Epic 3: 测试与验证（P1）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S3.1 | 单元测试更新 | P1 | 1h |
| S3.2 | gstack 截图验证 | P1 | 1h |

---

## 5. 优先级矩阵

| 功能 | 价值 | 成本 | 优先级 |
|------|------|------|--------|
| F1 移除 selection checkbox | 高 | 低 | P0 |
| F2 checkbox 移至描述前 | 高 | 中 | P0 |
| F3 移除确认按钮 | 中 | 低 | P0 |
| F4 全选改确认所有 | 中 | 低 | P0 |
| F5 批量删除保留 | 高 | 中 | P0 |

**决策**：所有功能均为 P0，5h 内可完成

---

## 6. 验收标准

### 6.1 代码检查
```bash
# 无 selection checkbox 残留
grep -rn 'aria-label="选择' BoundedContextTree.tsx
# 期望: 无输出

grep -rn 'onToggleSelect.*checkbox' BoundedContextTree.tsx  
# 期望: 无输出
```

### 6.2 UI 验证
```
checklist:
□ 每个卡片只有一个 checkbox
□ checkbox 出现在描述文本之前
□ 点击 checkbox 直接切换 confirmed 状态
□ 无"确认"按钮
□ 全选按钮文案为"确认所有"
□ 删除操作可直接执行（无需预勾选）
```

### 6.3 自动化测试
```typescript
expect(screen.getAllByRole('checkbox').length).toBe(1);
expect(screen.getByText('确认所有')).toBeInTheDocument();
expect(screen.queryByRole('button', { name: '确认' })).not.toBeInTheDocument();
```

---

## 7. 非功能需求

| 需求 | 要求 |
|------|------|
| 性能 | checkbox 切换 < 50ms |
| 可访问性 | checkbox 有清晰的 aria-label |
| 兼容性 | 保持现有快捷键支持 |

---

## 8. 依赖

| 依赖 | 来源 |
|------|------|
| `node.confirmed` 状态 | 现有状态管理 |
| `handleConfirmAll` 函数 | 现有实现 |
| 删除菜单/按钮 | 现有 UI 组件 |

---

## 9. DoD (Definition of Done)

- [ ] 代码已提交（git commit）
- [ ] `npm test` 全部通过
- [ ] gstack 截图验证通过
- [ ] PR 已创建并通过 review
