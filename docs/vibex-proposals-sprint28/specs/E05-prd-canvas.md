# E05: PRD → Canvas 自动流程 — 详细规格

## 1. 范围

- S05.1 /api/canvas/from-prd Endpoint
- S05.2 PRD Editor 一键生成 Canvas

## 2. PRD 数据模型

### 2.1 PRD JSON 结构
```ts
interface PRDDocument {
  id: string
  title: string
  chapters: PRDChapter[]
}

interface PRDChapter {
  id: string
  title: string
  steps: PRDStep[]
}

interface PRDStep {
  id: string
  title: string
  requirements: PRDRequirement[]
}

interface PRDRequirement {
  id: string
  text: string
  priority: 'P0' | 'P1' | 'P2'
}
```

## 3. S05.1: /api/canvas/from-prd Endpoint

### 3.1 API 规格
```
POST /api/canvas/from-prd
Content-Type: application/json

Request Body:
{
  "prd": PRDDocument
}

Response 200:
{
  "nodes": {
    "leftPanel": CanvasNode[],    // PRD chapters → 左栏 bounded contexts
    "centerPanel": CanvasNode[],  // PRD steps → 中栏 business flow steps
    "rightPanel": CanvasNode[]     // PRD requirements → 右栏 design outputs
  },
  "edges": CanvasEdge[]
}

interface CanvasNode {
  id: string
  type: 'context' | 'flow' | 'design'
  label: string
  metadata: {
    sourceType: 'chapter' | 'step' | 'requirement'
    sourceId: string
  }
}
```

### 3.2 映射规则
| PRD 元素 | Canvas 栏位 | 节点 type |
|---------|------------|----------|
| PRDChapter | 左栏（ComponentTreePanel）| `context` |
| PRDStep | 中栏（FlowTreePanel）| `flow` |
| PRDRequirement | 右栏（DDSCanvasPage）| `design` |

### 3.3 边（Edges）映射
```
PRDChapter.steps[0].requirements[0]
  → Edge: chapter-node → step-node
  → Edge: step-node → requirement-node
```

### 3.4 验收标准（expect()）
```ts
expect(POST /api/canvas/from-prd returns 200)
expect(response.nodes.leftPanel.length === prd.chapters.length)
expect(response.nodes.centerPanel.length === total steps across chapters)
expect(response.nodes.rightPanel.length === total requirements)
expect(response.edges.length > 0)
expect(PRD chapter title maps to leftPanel node label)
expect(tsc --noEmit exits 0)
```

## 4. S05.2: PRD Editor 一键生成

### 4.1 "生成 Canvas" 按钮
位置：PRD Editor 工具栏
文案："生成 Canvas"
样式：primary button，icon: arrow-right

### 4.2 交互流程
1. 用户在 PRD Editor 编写 PRD
2. 点击"生成 Canvas"按钮
3. 发送 POST /api/canvas/from-prd
4. Canvas 三栏自动填充节点
5. 成功后 toast 提示"Canvas 已生成"

### 4.3 双向同步
- PRD 内容变更后，Canvas 节点自动更新（debounce 1s）
- Canvas 节点变更不影响 PRD 源文件

### 4.4 验收标准（expect()）
```ts
expect("生成 Canvas" button visible in PRD Editor toolbar)
expect(button click triggers POST /api/canvas/from-prd)
expect(canvas left panel auto-populated after successful generation)
expect(center panel and right panel also populated)
expect(PRD change triggers canvas update within 1s)
expect(toast "Canvas 已生成" shown after success)
expect(tsc --noEmit exits 0)
```

## 5. E2E 测试覆盖

### 5.1 测试用例
```ts
// tests/e2e/prd-canvas-mapping.spec.ts
test('PRD Editor generates Canvas nodes correctly', async ({ page }) => {
  await page.goto('/editor')
  // 创建简单 PRD（1 chapter, 2 steps, 3 requirements）
  await page.click('[data-testid="generate-canvas-btn"]')
  // 验证 Canvas 三栏填充
  await expect(page.locator('[data-testid="left-panel"] .node')).toHaveCount(1)
  await expect(page.locator('[data-testid="center-panel"] .node')).toHaveCount(2)
  await expect(page.locator('[data-testid="right-panel"] .node')).toHaveCount(3)
})

test('PRD change triggers Canvas update', async ({ page }) => {
  await page.goto('/editor')
  await page.click('[data-testid="generate-canvas-btn"]')
  // 修改 PRD title
  await page.fill('[data-testid="prd-title-input"]', 'Updated Title')
  // 等待 debounce 1s + API 响应
  await expect(page.locator('[data-testid="left-panel"] .node').first())
    .toContainText('Updated Title')
})
```

## 6. DoD

- [ ] /api/canvas/from-prd API 测试覆盖单 chapter + 3 steps 映射
- [ ] PRD Editor 中"生成 Canvas"按钮存在且可点击
- [ ] Canvas 三栏节点填充后验证内容正确（数量 + 标签）
- [ ] PRD 内容变更触发 Canvas 同步（debounce 1s）
- [ ] E2E 测试 PRD → Canvas 往返通过
- [ ] TS 编译 0 errors

## 7. 简化路径（第一阶段 MVP）

从简单场景开始：
- 单 PRDChapter + 3 PRDStep + 5 PRDRequirement
- 不处理嵌套 chapter（只支持单层）
- 不处理 edge 交叉检测
