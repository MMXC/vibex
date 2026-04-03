# Spec: PM Proposals E1-E6 Summary

## 1. 概述

**工时**: 15h | **优先级**: P0-P2
**来源**: PM 提案综合 — 6 项体验改进

## 2. Epic 总览

| Epic | 名称 | 工时 | P | 依赖 |
|------|------|------|---|------|
| E1 | 确认状态可视化 | 2h | P0 | D-E1, D-E2 |
| E2 | 面板状态持久化 | 1h | P0 | 无 |
| E3 | 导出向导 | 3h | P1 | D-003 |
| E4 | 空状态引导 | 2h | P1 | 无 |
| E5 | 移动端降级 | 3h | P2 | PWA |
| E6 | PRD 导出 | 4h | P2 | 导出 API |

## 3. E1 详细规格

### 视觉规范
- 未确认节点: `border: 2px dashed var(--color-warning)`（黄色虚线）
- 已确认节点: `border: 2px solid var(--color-success)`（绿色实线）
- 工具栏增加筛选按钮: 「全部 / 已确认 / 待确认」

### 导出提示
```tsx
<Toast type="warning" message="有 2 个节点未确认，导出时将被忽略" />
```

## 4. E2 详细规格

### localStorage key
```ts
const PANEL_STATE_KEY = 'vibex-panel-collapsed-state';
// 值: { left: boolean, right: boolean, bottom: boolean }
```

### 恢复逻辑
```tsx
useEffect(() => {
  const saved = localStorage.getItem(PANEL_STATE_KEY);
  if (saved) setCollapsed(JSON.parse(saved));
}, []);
```

## 5. E3 详细规格

### 向导步骤
1. Step 1: 选择导出格式（Markdown / JSON / 代码）
2. Step 2: 填写元信息（项目名称、描述、作者）
3. Step 3: 确认预览 → 导出

### 必填项标记
```tsx
<label>
  <span className={styles.required}>*</span> 项目名称
</label>
```

## 6. E4 详细规格

### 引导卡片
```tsx
{!hasData && (
  <GuideCard>
    <h3>开始使用 VibeX</h3>
    <p>创建您的第一个限界上下文</p>
    <QuickActions>
      <Button icon="add-context">新建上下文</Button>
      <Button icon="import">导入数据</Button>
    </QuickActions>
  </GuideCard>
)}
```

## 7. E5 详细规格

### 设备检测
```ts
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
```

### 降级提示
```tsx
<MobileWarning>
  <h3>移动端暂不支持编辑</h3>
  <p>请使用桌面浏览器获得完整体验</p>
  <Button href="/preview/...">查看只读预览</Button>
</MobileWarning>
```

## 8. E6 详细规格

### Markdown 结构
```markdown
# {项目名称}

## 限界上下文
- {context1}: {描述}
- {context2}: {描述}

## 业务流程
### {flow1}
1. {step1}
2. {step2}

## 组件清单
| 组件 | 类型 | API |
|------|------|-----|
| {comp} | {type} | {method} {path} |
```

## 9. DoD

- [ ] E1: 黄色/绿色边框 + 筛选 + 导出提示
- [ ] E2: localStorage 存储 + 状态恢复
- [ ] E3: 3步向导 + 必填标记 + 进度条
- [ ] E4: 引导卡片 + 快捷操作 + 有数据时隐藏
- [ ] E5: 移动检测 + 降级提示 + 只读入口
- [ ] E6: Markdown 导出 + 完整内容 + 飞书兼容
