# 补充需求：UI页面组件节点生成

**项目**: vibex-homepage-core-layout
**日期**: 2026-03-14
**角色**: Analyst
**类型**: 需求补充

---

## 1. 用户反馈

> "UI页面组件节点生成没体现，这一步决定用户的项目生成哪些页面交互..."

---

## 2. 需求澄清

### 2.1 当前问题

现有 PRD 仅描述了：
- 预览/录入分离布局
- Mermaid 节点勾选功能

但缺少关键环节：**用户如何决定最终生成哪些页面/组件？**

### 2.2 需求定义

**UI页面组件节点生成** 指的是：

在 DDD 分析完成后，系统应展示识别出的页面和组件节点列表，用户可：
1. 查看系统分析出的所有页面/组件
2. 勾选需要实际生成的页面/组件
3. 未勾选的节点将不会出现在最终生成的代码中

---

## 3. 功能需求

### F3: UI页面组件节点选择 【新增】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 页面树展示 | `expect(pageTree).toRender()` | P0 |
| F3.2 | 组件节点展示 | `expect(componentNodes).toBeVisible()` | P0 |
| F3.3 | 节点勾选 | `expect(nodeCheckbox).toToggle()` | P0 |
| F3.4 | 全选/反选 | `expect(selectAll).toWork()` | P1 |
| F3.5 | 节点预览 | `expect(nodePreview).toShow()` | P2 |
| F3.6 | 选择状态持久化 | `expect(selection).toPersist()` | P1 |

---

## 4. 交互流程

```
用户输入需求
    ↓
AI 分析 (DDD 建模)
    ↓
生成页面树 + 组件节点  ← 【新增环节】
    ↓
用户勾选需要的节点
    ↓
确认生成
    ↓
生成代码
```

---

## 5. 目标布局更新

```
┌─────────────────────────────────────┐
│      实时预览区域 (60%)              │
│   [Mermaid 图表/节点图]              │
│   ┌─────────────────────────────┐   │
│   │ 页面树组件 (新增)            │   │
│   │ ├─ 首页 [✓]                 │   │
│   │ ├─ 登录页 [✓]               │   │
│   │ ├─ 用户中心 [ ]             │   │
│   │ └─ 设置页 [ ]               │   │
│   └─────────────────────────────┘   │
├─────────────────────────────────────┤
│      需求录入区域 (40%)              │
│   [需求输入框 + 示例 + 开始按钮]      │
└─────────────────────────────────────┘
```

---

## 6. 数据结构

```typescript
interface PageNode {
  id: string;
  name: string;
  type: 'page' | 'component';
  children?: PageNode[];
  selected: boolean;
  description?: string;
}

interface GenerationSelection {
  nodes: PageNode[];
  selectAll: boolean;
  lastUpdated: Date;
}
```

---

## 7. API 接口

### 7.1 获取页面树

```
GET /api/v1/pages/tree?projectId={projectId}
Response: { nodes: PageNode[] }
```

### 7.2 更新选择状态

```
POST /api/v1/pages/selection
Body: { projectId: string, nodeIds: string[] }
Response: { success: boolean }
```

---

## 8. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC5 | 页面树展示 | `expect(pageTree).toHaveNodes()` |
| AC6 | 节点可勾选 | `expect(checkbox).toToggle()` |
| AC7 | 选择影响生成 | `expect(generation).toRespectSelection()` |
| AC8 | 状态持久化 | `expect(selection).toPersistAfterRefresh()` |

---

## 9. 与现有需求的关系

| 需求 | 关系 |
|------|------|
| F1: 预览/录入分离 | 布局基础，本需求在预览区域展示 |
| F2: 节点勾选 | 合并到本需求，统一节点选择交互 |
| F3: 页面组件节点选择 | 新增核心功能 |

---

## 10. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 节点过多导致 UI 混乱 | 中 | 支持折叠/搜索 |
| 选择状态丢失 | 高 | 本地存储 + 后端持久化 |
| 与现有节点勾选功能冲突 | 中 | 统一组件设计 |

---

## 11. 建议

1. **合并 F2 和 F3**：将 Mermaid 节点勾选与页面树选择统一为一个交互模型
2. **渐进展示**：先展示页面树，再支持详细节点勾选
3. **默认全选**：默认生成所有节点，用户可取消不需要的

---

**下一步**: PM 更新 PRD，将此补充需求整合到主 PRD 文档中。