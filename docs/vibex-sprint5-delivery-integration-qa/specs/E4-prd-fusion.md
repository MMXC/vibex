# Spec: E4 — PRD 融合规格

**对应 Epic**: E4 PRD 融合
**目标文件**: `vibex-fronted/src/components/delivery/PRDTab.tsx`, `vibex-fronted/src/lib/delivery/PRDGenerator.ts`（新建）

---

## 1. PRDGenerator 规格

### 接口定义

```typescript
// 文件: src/lib/delivery/PRDGenerator.ts

interface PRDOutput {
  title: string;
  pages: Array<{ id: string; name: string; components: string[] }>;
  components: Array<{ id: string; name: string; type: string; description: string }>;
  apiEndpoints: Array<{ path: string; method: string; summary: string }>;
  boundedContexts: Array<{ id: string; name: string; description: string }>;
}

function generatePRD(
  prototypeData: PrototypeExportData,
  ddsData: DDSCanvasState
): PRDOutput {
  return {
    title: '项目 PRD',
    pages: prototypeData.pages.map(p => ({
      id: p.id,
      name: p.name,
      components: prototypeData.nodes
        .filter(n => n.pageId === p.id)
        .map(n => n.type),
    })),
    components: prototypeData.nodes.map(n => ({
      id: n.id,
      name: n.type,
      type: 'ui-component',
      description: `类型: ${n.type}`,
    })),
    apiEndpoints: ddsData.chapters.api?.cards.map(c => ({
      path: c.path,
      method: c.method,
      summary: c.summary || '',
    })) || [],
    boundedContexts: ddsData.chapters.context?.cards.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
    })) || [],
  };
}
```

---

## 2. PRD Markdown 导出

```typescript
function generatePRDMarkdown(prd: PRDOutput): string {
  return `# ${prd.title}

## 1. 页面列表

${prd.pages.map(p => `- ${p.name}（${p.components.join(', ')}）`).join('\n')}

## 2. 组件清单

${prd.components.map(c => `- ${c.name}: ${c.description}`).join('\n')}

## 3. API 端点

${prd.apiEndpoints.length > 0 
  ? prd.apiEndpoints.map(e => `- ${e.method.toUpperCase()} ${e.path}: ${e.summary}`).join('\n')
  : '（暂无 API 端点）'}

## 4. 限界上下文

${prd.boundedContexts.map(ctx => `- ${ctx.name}: ${ctx.description}`).join('\n')}
`;
}
```

---

## 3. PRD Tab 规格

### 理想态
- 标题："项目 PRD"
- 副标题："基于原型画布 + 详设画布实时生成"
- 内容分为 4 个 Section：页面列表 / 组件清单 / API 端点 / 限界上下文
- 每个 Section 可折叠/展开
- 顶部有 "导出 Markdown" 按钮

### 空状态
- 原型画布和详设画布均无数据时：
- 文案："还没有足够的数据生成 PRD"
- 副文案："请先在原型画布和详设画布中创建内容"
- 按钮："去原型画布"

### 加载态
- Section 区域骨架屏

### 错误态
- PRD 生成失败：显示错误 + 重试按钮
- 不丢失用户已查看的内容

---

## 4. PRD 预览编辑器（暂缓 D3）

### 理想态（暂缓）
- 预览/编辑切换
- Markdown 编辑器区域
- 实时预览区域

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- Section 间距：16px
- 标题层级：h1 / h2 / h3
