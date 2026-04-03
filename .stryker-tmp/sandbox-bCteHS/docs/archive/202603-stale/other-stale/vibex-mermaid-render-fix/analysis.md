# 分析报告: Mermaid 图未渲染问题修复

**项目**: vibex-mermaid-render-fix  
**任务**: analyze-requirements  
**日期**: 2026-03-20  
**分析人**: Analyst

---

## 1. 问题定位

### 1.1 问题描述

首页点击"分析"后，Mermaid 图表未渲染，用户看不到 DDD 分析结果的可视化展示。

### 1.2 相关文件

| 文件 | 路径 | 职责 |
|------|------|------|
| MermaidPreview.tsx | `src/components/ui/MermaidPreview.tsx` | 主渲染组件（新版） |
| MermaidRenderer.tsx | `src/components/mermaid/MermaidRenderer.tsx` | 备用渲染组件（旧版） |
| MermaidInit.ts | `src/components/mermaid/mermaidInit.ts` | 初始化管理 |
| useHomePage.ts | `src/components/homepage/hooks/useHomePage.ts` | 首页状态管理 |
| PreviewArea.tsx | `src/components/homepage/PreviewArea/PreviewArea.tsx` | 预览区域容器 |

### 1.3 关键代码流程

```
用户点击分析
    ↓
useHomePage 生成 mermaidCode
    ↓
PreviewArea 接收 mermaidCode
    ↓
MermaidPreview 渲染图表
    ↓
getMermaid() 动态加载 mermaid
    ↓
mermaid.render() 渲染 SVG
```

---

## 2. 问题分析

### 2.1 架构问题：双组件竞争

**现状**：项目存在两套 Mermaid 渲染组件

| 组件 | 初始化方式 | 缓存机制 | 状态 |
|------|-----------|----------|------|
| MermaidPreview | 动态 `import('mermaid')` | 无 | **使用中** |
| MermaidRenderer | `preInitialize()` | LRU Cache | 备用 |

**问题**：
- 两套独立的 `mermaidInstance` 单例
- 可能存在初始化竞争条件
- 配置参数不一致（theme, securityLevel 等）

### 2.2 初始化时序问题

**MermaidPreview.tsx 第 41-66 行**：
```typescript
const getMermaid = async () => {
  if (mermaidInstance) return mermaidInstance;  // 快速返回
  
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({ ... });
  mermaidInstance = mermaid;
  return mermaidInstance;
};
```

**问题**：
1. 首次渲染时，如果 `import()` 未完成就调用 `mermaid.render()`
2. 没有错误重试机制
3. `renderChart()` 在 300ms debounce 后执行，但初始化可能更慢

### 2.3 初始化配置差异

| 配置项 | MermaidPreview | MermaidInit |
|--------|---------------|-------------|
| theme | 'dark' | 'dark' |
| securityLevel | 'strict' | 'loose' |
| themeVariables | 自定义 | 默认 |

**风险**：`securityLevel: 'strict'` 可能导致某些 Mermaid 语法无法渲染

### 2.4 缺少错误处理

**MermaidPreview.tsx 第 95-113 行**：
```typescript
try {
  const mermaid = await getMermaid();
  // ...
  const { svg } = await mermaid.render(chartId, processedCode);
  setSvg(renderedSvg);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : '图表渲染失败';
  setError(errorMessage);
}
```

**问题**：
- 错误仅显示通用消息，用户无法了解具体原因
- 没有重试机制
- 没有降级方案（显示原始代码）

---

## 3. 核心 JTBD

| ID | JTBD | 描述 | 优先级 |
|----|------|------|--------|
| JTBD-1 | **即时渲染** | 点击分析后 2 秒内看到图表 | P0 |
| JTBD-2 | **稳定可靠** | 无论 Mermaid 代码如何都能正确渲染或给出明确错误 | P0 |
| JTBD-3 | **视觉美观** | 图表样式符合 VibeX 深色主题 | P1 |

---

## 4. 技术风险点

### 4.1 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解措施 |
|------|--------|------|------|----------|
| 动态导入时序问题 | 高 | 高 | 🔴 | 预加载 + 状态检查 |
| Mermaid 11.13.0 API 变更 | 中 | 高 | 🟡 | 版本锁定 + 兼容性检查 |
| SSR/Hydration 不一致 | 中 | 中 | 🟡 | useEffect 延迟渲染 |
| 初始化竞争 | 低 | 高 | 🟡 | 统一初始化管理器 |

### 4.2 Mermaid 11.13.0 已知问题

根据 GitHub issues，Mermaid 11.x 版本存在以下潜在问题：
- `securityLevel: 'strict'` 下 foreignObject 渲染受限
- 某些 flowchart 语法不兼容
- SSR 水合问题

---

## 5. 推荐方案

### 方案 A：统一初始化 + 预加载（推荐）

```typescript
// 1. 创建统一的 MermaidManager
// src/lib/mermaid/MermaidManager.ts

import mermaid from 'mermaid';

const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',  // 改为 loose 支持更多语法
  themeVariables: {
    primaryColor: '#00ffff',
    background: '#0a0a0f',
    // ...
  },
};

class MermaidManager {
  private static instance: MermaidManager;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance() {
    if (!MermaidManager.instance) {
      MermaidManager.instance = new MermaidManager();
    }
    return MermaidManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      mermaid.initialize(MERMAID_CONFIG);
      this.initialized = true;
    })();
    
    return this.initPromise;
  }

  async render(code: string): Promise<string> {
    await this.initialize();
    const id = `mermaid-${Date.now()}`;
    const { svg } = await mermaid.render(id, code);
    return svg;
  }
}

export const mermaidManager = MermaidManager.getInstance();
```

```typescript
// 2. 修改 MermaidPreview 使用统一管理器
// src/components/ui/MermaidPreview.tsx

import { mermaidManager } from '@/lib/mermaid/MermaidManager';

const renderChart = useCallback(async () => {
  try {
    const svg = await mermaidManager.render(processedCode);
    setSvg(svg);
    setError('');
  } catch (err) {
    // 显示详细错误 + 降级方案
    console.error('Mermaid render error:', err);
    setError(err.message);
    setFallbackCode(code); // 显示原始代码
  }
}, [code]);
```

```typescript
// 3. 在 layout.tsx 预初始化
// src/app/layout.tsx

import { mermaidManager } from '@/lib/mermaid/MermaidManager';

useEffect(() => {
  mermaidManager.initialize(); // 静默预加载
}, []);
```

### 方案 B：渐进增强（快速修复）

如果方案 A 需要较长时间，可以先实施以下快速修复：

1. **增加初始化等待**
```typescript
const renderChart = async () => {
  // 确保初始化完成
  await getMermaid();
  await new Promise(r => setTimeout(r, 100)); // 等待 100ms
  // 然后渲染
};
```

2. **添加降级显示**
```typescript
{error && (
  <details>
    <summary>查看原始代码</summary>
    <pre>{code}</pre>
  </details>
)}
```

3. **放宽 securityLevel**
```typescript
securityLevel: 'loose'  // 从 'strict' 改为 'loose'
```

---

## 6. 验收标准

| ID | 标准 | 测试方法 |
|----|------|----------|
| AC-1 | 点击分析后 3 秒内显示图表 | 手动测试 + Lighthouse |
| AC-2 | 渲染失败时显示原始代码 | 输入无效 Mermaid 代码 |
| AC-3 | 控制台无 Error 级别错误 | Chrome DevTools |
| AC-4 | 单元测试覆盖渲染逻辑 | `npm test MermaidPreview` |
| AC-5 | E2E 测试通过 | `playwright test mermaid` |

---

## 7. 工时估算

| 任务 | 预估工时 | 方案 |
|------|----------|------|
| 创建 MermaidManager | 1h | 方案 A |
| 重构 MermaidPreview | 2h | 方案 A |
| 添加降级方案 | 0.5h | 方案 B |
| 单元测试 | 1h | - |
| E2E 测试 | 1h | - |
| **总计** | **5.5h** | - |

---

## 8. 实施计划

1. **Phase 1** (2h): 统一初始化管理器 + 快速修复
2. **Phase 2** (2h): 重构 MermaidPreview + 降级方案
3. **Phase 3** (1.5h): 测试覆盖 + 验收

---

**分析完成**
