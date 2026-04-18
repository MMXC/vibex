# BLOCKER-E4-PRDGenerator: PRDGenerator 函数完全缺失

**严重性**: BLOCKER（阻塞）
**Epic**: E4
**Spec 引用**: specs/E4-prd-fusion.md, analyst-qa-report.md

## 问题描述
- `src/lib/delivery/PRDGenerator.ts` 文件不存在
- `generatePRD()` 函数不存在
- `generatePRDMarkdown()` 函数不存在
- `PRDTab.tsx` 使用硬编码 `PRD_SECTIONS` 数组，内容固定为 "电商系统"

## 代码证据

```bash
$ find /root/.openclaw/vibex/vibex-fronted/src -name "PRDGenerator.ts"
# 无结果

$ grep -rn "generatePRD" /root/.openclaw/vibex/vibex-fronted/src/
# 无结果

$ grep "电商系统" /root/.openclaw/vibex/vibex-fronted/src/components/delivery/PRDTab.tsx
# - 项目名称: 电商系统    ← 硬编码
```

```typescript
// PRDTab.tsx 第 16-55 行
const PRD_SECTIONS = [
  {
    id: 'overview',
    title: '项目概述',
    content: `## 项目概述
- 项目名称: 电商系统    ← 硬编码
- 领域: 电商平台        ← 硬编码
...`,
  },
  // ... 4 个硬编码 section
];

// 没有任何对 generatePRD 或真实数据的引用
```

## 修复建议

按 Spec E4 新建 `src/lib/delivery/PRDGenerator.ts`：

```typescript
// src/lib/delivery/PRDGenerator.ts
import type { PrototypeExportData } from '@/stores/prototypeStore';
import type { DDSCanvasState } from '@/stores/dds/DDSCanvasStore';

export interface PRDOutput {
  title: string;
  pages: Array<{ id: string; name: string; components: string[] }>;
  components: Array<{ id: string; name: string; type: string; description: string }>;
  apiEndpoints: Array<{ path: string; method: string; summary: string }>;
  boundedContexts: Array<{ id: string; name: string; description: string }>;
}

export function generatePRD(prototypeData: PrototypeExportData, ddsData: DDSCanvasState): PRDOutput {
  return {
    title: '项目 PRD',
    pages: prototypeData.pages.map(p => ({
      id: p.id,
      name: p.name,
      components: prototypeData.nodes.filter(n => n.pageId === p.id).map(n => n.type),
    })),
    components: prototypeData.nodes.map(n => ({
      id: n.id, name: n.type, type: 'ui-component', description: `类型: ${n.type}`,
    })),
    apiEndpoints: ddsData.chapters.api?.cards.map(c => ({
      path: c.path, method: c.method, summary: c.summary || '',
    })) || [],
    boundedContexts: ddsData.chapters.context?.cards.map(c => ({
      id: c.id, name: c.name, description: c.description || '',
    })) || [],
  };
}

export function generatePRDMarkdown(prd: PRDOutput): string {
  return `# ${prd.title}
## 1. 页面列表
${prd.pages.map(p => `- ${p.name}（${p.components.join(', ')}）`).join('\n')}
...`;
}
```

然后修改 `PRDTab.tsx` 调用 `generatePRDMarkdown(generatePRD(prototypeData, ddsData))`。

## 影响范围
- `src/lib/delivery/PRDGenerator.ts`（新建）
- `src/components/delivery/PRDTab.tsx`（重构）
- 整个 PRD Tab 功能（当前完全不可用）
