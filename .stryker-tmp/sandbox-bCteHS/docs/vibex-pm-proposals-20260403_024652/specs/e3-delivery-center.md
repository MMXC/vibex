# Epic E3 Spec: 统一交付中心

**Epic**: E3 - 统一交付中心
**优先级**: P2
**工时**: 8-10h
**依赖**: 导出 API 稳定
**状态**: 规划中

---

## 1. Overview

### 1.1 目标
提供统一的交付面板，聚合所有设计产出的导出功能，让用户知道设计产出的所有去向。

### 1.2 用户价值
- 不再需要到处找导出入口
- 统一的导出体验，所有交付物一目了然
- 批量导出功能提升效率

---

## 2. Page Structure

### 2.1 路由设计
- URL: `/canvas/delivery`
- Layout: 与 Canvas 共享布局（左侧工具栏、顶部导航）
- Tab 区域: 页面主体部分

### 2.2 页面布局

```
┌──────────────────────────────────────────────────────┐
│  ← 返回 Canvas              交付中心                   │
├────────┬─────────────────────────────────────────────┤
│        │  [限界上下文] [流程文档] [组件清单] [PRD]      │
│  Canvas │──────────────────────────────────────────────│
│  工具栏  │                                              │
│        │   Tab 内容区域                                  │
│        │                                              │
│        │                                              │
│        │                                              │
│        │   [导出全部]                                   │
├────────┴─────────────────────────────────────────────┤
│  项目: 电商系统 v1.0           最后更新: 2小时前        │
└──────────────────────────────────────────────────────┘
```

---

## 3. Tab Content Design

### 3.1 限界上下文 Tab

```
限界上下文
───────────────────────────────────────────────
搜索: [____________]  筛选: [全部 ▼]

┌─────────────────────────────────────────────────┐
│ 商品域                                          │
│ 商品目录和库存管理                                │
│ 节点: 5  |  关系: 3                            │
│ [预览] [JSON] [Markdown] [PlantUML]           │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 订单域                                          │
│ 订单处理和履约                                   │
│ 节点: 8  |  关系: 5                            │
│ [预览] [JSON] [Markdown] [PlantUML]           │
└─────────────────────────────────────────────────┘

[导出全部上下文为 ZIP]
```

**导出格式说明**:
- JSON: 完整的上下文数据（节点、关系、属性）
- Markdown: 格式化的文档（# 商品域\n## 描述...）
- PlantUML: UML 图描述（用于生成类图）

### 3.2 流程文档 Tab

```
流程文档
───────────────────────────────────────────────
搜索: [____________]  筛选: [全部 ▼]

┌─────────────────────────────────────────────────┐
│ 下单流程                                        │
│ 订单域  |  步骤: 5  |  决策点: 2               │
│ [预览] [BPMN JSON] [Markdown 步骤说明]          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 注册流程                                        │
│ 用户域  |  步骤: 3  |  决策点: 1               │
│ [预览] [BPMN JSON] [Markdown 步骤说明]          │
└─────────────────────────────────────────────────┘

[导出全部流程为 ZIP]
```

### 3.3 组件清单 Tab

```
组件清单
───────────────────────────────────────────────
搜索: [____________]  筛选: [全部 ▼]  类型: [全部 ▼]

┌─────────────────────────────────────────────────┐
│ 商品服务 (Service)                               │
│ 描述: 商品相关业务逻辑                            │
│ 引用: 3  |  方法: 12                            │
│ [预览] [TypeScript 接口] [JSON Schema]          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 订单控制器 (Controller)                          │
│ 描述: 订单 API 接口                              │
│ 引用: 5  |  方法: 8                             │
│ [预览] [TypeScript 接口] [JSON Schema]          │
└─────────────────────────────────────────────────┘

[导出全部组件为 ZIP]
```

### 3.4 PRD Tab

```
PRD 导出
───────────────────────────────────────────────

自动生成的项目 PRD 大纲:

┌─────────────────────────────────────────────────┐
│ 项目概述                                          │
│ - 项目名称: 电商系统                              │
│ - 领域: 电商平台                                  │
│ - 核心目标: ...                                  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 限界上下文                                        │
│ - 商品域: ...                                   │
│ - 订单域: ...                                   │
│ - 用户域: ...                                   │
└─────────────────────────────────────────────────┘
... (更多章节)

[预览] [Markdown] [飞书文档] [Word]
```

---

## 4. Component Design

### 4.1 核心组件

| 组件名 | 文件 | 职责 |
|--------|------|------|
| DeliveryCenter | `pages/canvas/delivery.tsx` | 交付中心页面容器 |
| DeliveryTabs | `components/delivery/DeliveryTabs.tsx` | Tab 切换组件 |
| ContextTab | `components/delivery/ContextTab.tsx` | 限界上下文 Tab |
| FlowTab | `components/delivery/FlowTab.tsx` | 流程文档 Tab |
| ComponentTab | `components/delivery/ComponentTab.tsx` | 组件清单 Tab |
| PRDTab | `components/delivery/PRDTab.tsx` | PRD Tab |
| ExportButton | `components/delivery/ExportButton.tsx` | 导出按钮组件 |
| ExportAllButton | `components/delivery/ExportAllButton.tsx` | 批量导出按钮 |

### 4.2 Store Design

```typescript
// stores/deliveryStore.ts
interface DeliveryState {
  activeTab: 'contexts' | 'flows' | 'components' | 'prd';
  searchQuery: string;
  filters: Record<string, string>;
  exportProgress: ExportProgress | null;
  
  // Actions
  setActiveTab: (tab: DeliveryState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: string) => void;
  exportItem: (type: ExportType, id: string, format: ExportFormat) => Promise<void>;
  exportAll: (type: ExportType) => Promise<void>;
}
```

---

## 5. Export API

### 5.1 单项导出

```
POST /api/delivery/export
Body: {
  type: 'context' | 'flow' | 'component' | 'prd';
  id: string;
  format: 'json' | 'markdown' | 'plantuml' | 'bpmn' | 'typescript' | 'schema';
}
Response: {
  downloadUrl: string;
  filename: string;
}
```

### 5.2 批量导出

```
POST /api/delivery/export-all
Body: {
  type: 'contexts' | 'flows' | 'components';
  format: 'zip';
}
Response: {
  downloadUrl: string;
  filename: string;
  itemCount: number;
}
```

### 5.3 飞书导出

```
POST /api/delivery/export-feishu
Body: {
  projectId: string;
}
Response: {
  feishuDocUrl: string;
}
```

---

## 6. Technical Implementation

### 6.1 导出服务

```typescript
// services/exportService.ts
type ExportType = 'context' | 'flow' | 'component' | 'prd';
type ExportFormat = 'json' | 'markdown' | 'plantuml' | 'bpmn' | 'typescript' | 'schema' | 'zip';

interface ExportOptions {
  type: ExportType;
  id: string;
  format: ExportFormat;
}

const exportItem = async (options: ExportOptions): Promise<void> => {
  const response = await fetch('/api/delivery/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    throw new Error('Export failed');
  }
  
  const { downloadUrl, filename } = await response.json();
  
  // Trigger download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

### 6.2 PlantUML 生成

```typescript
// utils/plantuml.ts
const generatePlantUML = (context: Context): string => {
  const lines = [
    '@startuml',
    `title ${context.name}`,
    '',
  ];
  
  // Entities
  context.entities.forEach(entity => {
    lines.push(`class ${entity.name} {`);
    entity.attributes.forEach(attr => {
      lines.push(`  ${attr.type} ${attr.name}`);
    });
    lines.push('}');
  });
  
  // Relationships
  context.relationships.forEach(rel => {
    lines.push(`${rel.source} --> ${rel.target} : ${rel.type}`);
  });
  
  lines.push('@enduml');
  
  return lines.join('\n');
};
```

### 6.3 PRD 生成

```typescript
// utils/prdGenerator.ts
const generatePRD = (project: Project): string => {
  const sections = [
    '# 项目概述',
    `## 项目名称: ${project.name}`,
    `## 领域: ${project.domain}`,
    '',
    '# 限界上下文',
  ];
  
  project.contexts.forEach(context => {
    sections.push(`## ${context.name}`);
    sections.push(context.description);
    sections.push('');
  });
  
  sections.push('# 业务流程');
  project.flows.forEach(flow => {
    sections.push(`## ${flow.name}`);
    sections.push(`所属上下文: ${flow.context}`);
    sections.push('### 步骤:');
    flow.steps.forEach((step, index) => {
      sections.push(`${index + 1}. ${step}`);
    });
    sections.push('');
  });
  
  return sections.join('\n');
};
```

---

## 7. Acceptance Criteria

### E3-S1: 交付中心入口
- [ ] `expect(deliveryBtn.isVisible()).toBe(true)` 入口按钮可见
- [ ] `expect(deliveryBtn.isClickable()).toBe(true)` 按钮可点击
- [ ] `expect(navigation.getCurrentPath()).toBe('/canvas/delivery')` 跳转至交付中心

### E3-S2: 限界上下文导出 Tab
- [ ] `expect(tabBar.find('tab[active]').getText()).toBe('限界上下文')` 默认Tab正确
- [ ] `expect(contextList.isVisible()).toBe(true)` 上下文列表可见
- [ ] `expect(contextCard.find('.export-json').isClickable()).toBe(true)` JSON导出可点击
- [ ] `expect(contextCard.find('.export-md').isClickable()).toBe(true)` Markdown导出可点击
- [ ] `expect(contextCard.find('.export-plantuml').isClickable()).toBe(true)` PlantUML导出可点击

### E3-S3: 流程文档导出 Tab
- [ ] `expect(tabBar.find('tab').at(1).isClickable()).toBe(true)` 流程Tab可切换
- [ ] `expect(flowList.isVisible()).toBe(true)` 流程列表可见
- [ ] `expect(flowCard.find('.export-bpmn').isClickable()).toBe(true)` BPMN导出可点击
- [ ] `expect(flowCard.find('.export-steps').isClickable()).toBe(true)` 步骤导出可点击

### E3-S4: 组件清单导出 Tab
- [ ] `expect(tabBar.find('tab').at(2).isClickable()).toBe(true)` 组件Tab可切换
- [ ] `expect(componentList.isVisible()).toBe(true)` 组件列表可见
- [ ] `expect(componentCard.find('.export-ts').isClickable()).toBe(true)` TS接口导出可点击
- [ ] `expect(componentCard.find('.export-json-schema').isClickable()).toBe(true)` Schema导出可点击

### E3-S5: PRD Tab
- [ ] `expect(tabBar.find('tab').at(3).isClickable()).toBe(true)` PRD Tab可切换
- [ ] `expect(prdOutline.isVisible()).toBe(true)` PRD大纲可见
- [ ] `expect(prdOutline.find('.section').length).toBeGreaterThan(0)` 有章节内容
- [ ] `expect(prdOutline.find('.export-md').isClickable()).toBe(true)` Markdown导出可点击
- [ ] `expect(prdOutline.find('.export-feishu').isClickable()).toBe(true)` 飞书导出可点击

### E3-S6: 批量导出功能
- [ ] `expect(exportAllBtn.isVisible()).toBe(true)` 批量导出按钮可见
- [ ] `expect(exportAllBtn.isClickable()).toBe(true)` 按钮可点击
- [ ] `expect(exportAllBtn.trigger()).toDownloadZip()` 触发ZIP下载

---

## 8. Test Cases

### TC-E3-001: Tab 切换
```typescript
test('TC-E3-001: 切换 Tab 应显示对应内容', async ({ page }) => {
  await page.goto('/canvas/delivery');
  
  // Default tab should be "限界上下文"
  await expect(page.locator('.tab-content')).toContainText('限界上下文');
  
  // Click "流程文档" tab
  await page.click('.tab:has-text("流程文档")');
  await expect(page.locator('.tab-content')).toContainText('流程');
  
  // Click "PRD" tab
  await page.click('.tab:has-text("PRD")');
  await expect(page.locator('.tab-content')).toContainText('PRD');
});
```

### TC-E3-002: 导出单个上下文
```typescript
test('TC-E3-002: 导出上下文应下载文件', async ({ page }) => {
  await page.goto('/canvas/delivery');
  
  // Click JSON export
  const downloadPromise = page.waitForEvent('download');
  await page.click('.context-card:first-child .export-json');
  
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
```

### TC-E3-003: 批量导出
```typescript
test('TC-E3-003: 批量导出应下载 ZIP', async ({ page }) => {
  await page.goto('/canvas/delivery');
  
  const downloadPromise = page.waitForEvent('download');
  await page.click('#export-all-contexts');
  
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});
```

---

## 9. Milestone

| 日期 | 里程碑 |
|------|--------|
| Week 1 | 完成交付中心基础架构和 Tab 框架 |
| Week 2 | 完成限界上下文和流程文档 Tab |
| Week 3 | 完成组件清单和 PRD Tab |
| Week 4 | 完成批量导出和飞书集成 |
