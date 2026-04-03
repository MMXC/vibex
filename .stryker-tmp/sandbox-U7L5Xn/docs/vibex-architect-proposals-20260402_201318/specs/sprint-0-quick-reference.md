# Spec: Sprint 0 — CI 阻断解除 + 安全修复（本周实施）

**Sprint**: Sprint 0  
**预计工时**: 6-8h  
**目标**: 解除 CI 阻断，建立安全基线

---

## 1. Sprint 0 任务清单

| # | Story | 提案ID | 预计工时 | 前置条件 |
|---|-------|--------|---------|---------|
| 1 | TS 错误清理 | D-001 | 2h | 无 |
| 2 | DOMPurify 安全加固 (L1) | D-002 | 1h | 无 |
| 3 | Checkbox 样式统一 | D-E1 | 1.5h | 无 |
| 4 | 级联确认交互 | D-E2 | 1.5h | D-E1 |
| 5 | CSS 废弃样式清理 | ADR-003 | 0.5h | D-E1 |

**总计**: 6-7h（可并行实施）

---

## 2. Story S1.1: TS 错误清理

### 实施步骤

```bash
# 1. 运行 TS 检查
npx tsc --noEmit 2>&1 | head -100

# 2. 识别错误类型
# - 缺失类型注解
# - 类型不匹配
# - 隐式 any

# 3. 修复策略
# - 高优先级: canvasStore, API client, 核心组件
# - 低优先级: 次要组件（可添加 @ts-ignore 并记录）
```

### 验收

- [ ] `npm run build` 无 TS 错误
- [ ] `npx tsc --noEmit` exit code 0
- [ ] CI TS 检查通过

---

## 3. Story S1.2: DOMPurify 安全加固（L1）

### 实施步骤

```bash
# 1. 添加 overrides 到 package.json
# 2. npm install
# 3. 验证版本: npm list dompurify
# 4. npm audit
# 5. npm run build
```

### 验收

- [ ] package.json overrides 已添加
- [ ] npm audit 无 DOMPurify 漏洞
- [ ] 构建正常

---

## 4. Story S1.3: Checkbox 样式统一

### 实施步骤

```bash
# 1. 识别 checkbox 相关组件
grep -r "checkbox\|Checkbox" --include="*.tsx" src/components/

# 2. 统一样式
# - 使用 border 颜色表示确认状态
# - 符合 ADR-003 命名规范
```

### 验收

- [ ] checkbox 样式统一
- [ ] 4 种状态（default/hover/checked/disabled）正确

---

## 5. Story S1.4: 级联确认交互

### 实施步骤

```typescript
// stores/flowStore.ts - 添加级联方法
const toggleNodeWithCascade = (nodeId: string, checked: boolean) => {
  set((state) => {
    const newSelected = new Set(state.selectedNodeIds);
    
    if (checked) {
      // 勾选: 选中当前节点 + 递归勾选所有子节点
      newSelected.add(nodeId);
      getChildNodes(nodeId).forEach(child => newSelected.add(child.id));
    } else {
      // 取消勾选: 取消当前节点 + 递归取消所有子节点
      newSelected.delete(nodeId);
      getChildNodes(nodeId).forEach(child => newSelected.delete(child.id));
    }
    
    return { selectedNodeIds: newSelected };
  });
};
```

### 验收

- [ ] 勾选父节点自动勾选所有子节点
- [ ] 取消勾选父节点自动取消所有子节点
- [ ] 部分选中时父节点显示 indeterminate

---

## 6. Story S1.5: CSS 废弃样式清理

### 实施步骤

```bash
# 1. 确认无引用
grep -r "\.nodeTypeBadge" src/
grep -r "\.confirmedBadge" src/

# 2. 删除 CSS 文件中的样式定义
# 3. npm run build 验证无错误
```

### 验收

- [ ] 废弃样式已删除
- [ ] 构建无警告

---

## 7. Sprint 0 验收门禁

| 验收项 | 标准 |
|--------|------|
| CI 构建 | `npm run build` 成功 |
| TypeScript | `npx tsc --noEmit` 通过 |
| 安全扫描 | `npm audit` 无阻断漏洞 |
| E2E 冒烟 | Playwright 冒烟测试通过（可选）|
| 样式检查 | 无废弃 CSS 残留 |

---

## 8. DoD

- [ ] 所有 5 个 Story 验收标准通过
- [ ] PR 审查通过并合并到 main
- [ ] CI 流水线绿色
- [ ] Sprint 1 可正常启动
