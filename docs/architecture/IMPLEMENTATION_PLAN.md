# Implementation Plan: VibeX Canvas Phase1

> **项目**: vibex-canvas-evolution-roadmap  
> **阶段**: Phase1 — 样式统一 + 导航修复  
> **版本**: 1.0.0  
> **日期**: 2026-03-29  
> **Architect**: Architect Agent  
> **工作目录**: /root/.openclaw/vibex/vibex-fronted

---

## 1. 概述

本文档为 Phase1 提供详细的开发执行计划，基于 `vibex-canvas-evolution.md` 架构文档。

### 1.1 目标
- **样式统一**: 建立 CSS 变量系统 + 无障碍 checkbox 规范
- **导航可靠**: 补充 example-canvas.json 的 previewUrl 数据

### 1.2 依赖关系
```
utils.ts (新建)
    ↓
canvas.module.css (修改)
    ↓
CanvasPage.tsx (修改)
    ↓
ComponentSelectionStep.tsx (修改)
    ↓
canvasStore.ts (修改)
    ↓
example-canvas.json (修改)
```

---

## 2. 文件变更详情

### 2.1 新建: `src/lib/canvas/utils.ts`

```typescript
/**
 * 领域类型推导函数
 * 根据组件名称中的关键词判断 Bounded Context 类型
 */

export type DomainType = 'core' | 'supporting' | 'generic' | 'external';

/** 关键词映射表 */
const DOMAIN_KEYWORDS: Record<DomainType, string[]> = {
  core: ['auth', 'user', 'account', 'payment', 'billing', 'subscription'],
  supporting: ['storage', 'email', 'notification', 'analytics', 'report'],
  generic: ['logger', 'config', 'cache', 'queue', 'metric'],
  external: ['stripe', 'github', 'figma', 'slack', 'webhook'],
};

/**
 * 根据组件名推导领域类型
 */
export function deriveDomainType(componentName: string): DomainType {
  const name = componentName.toLowerCase();
  for (const [type, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(k => name.includes(k))) {
      return type as DomainType;
    }
  }
  return 'generic'; // 默认通用域
}

/**
 * 标签函数：生成带样式类名的领域标签
 */
export function domainLabel(type: DomainType): string {
  const labels: Record<DomainType, string> = {
    core: '核心域',
    supporting: '支撑域',
    generic: '通用域',
    external: '外部域',
  };
  return labels[type];
}
```

### 2.2 新建: `src/lib/canvas/__tests__/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { deriveDomainType, domainLabel, type DomainType } from '../utils';

describe('deriveDomainType', () => {
  it('识别核心域关键词', () => {
    expect(deriveDomainType('UserAuth')).toBe('core');
    expect(deriveDomainType('PaymentFlow')).toBe('core');
    expect(deriveDomainType('billing-service')).toBe('core');
  });

  it('识别支撑域关键词', () => {
    expect(deriveDomainType('EmailService')).toBe('supporting');
    expect(deriveDomainType('StorageManager')).toBe('supporting');
    expect(deriveDomainType('analytics-dashboard')).toBe('supporting');
  });

  it('识别通用域关键词', () => {
    expect(deriveDomainType('Logger')).toBe('generic');
    expect(deriveDomainType('ConfigService')).toBe('generic');
    expect(deriveDomainType('CacheLayer')).toBe('generic');
  });

  it('识别外部域关键词', () => {
    expect(deriveDomainType('StripeAdapter')).toBe('external');
    expect(deriveDomainType('GitHubImporter')).toBe('external');
    expect(deriveDomainType('FigmaConnector')).toBe('external');
  });

  it('未知关键词默认返回通用域', () => {
    expect(deriveDomainType('UnknownComponent')).toBe('generic');
    expect(deriveDomainType('Widget')).toBe('generic');
  });
});

describe('domainLabel', () => {
  it('返回正确的中文标签', () => {
    expect(domainLabel('core')).toBe('核心域');
    expect(domainLabel('supporting')).toBe('支撑域');
    expect(domainLabel('generic')).toBe('通用域');
    expect(domainLabel('external')).toBe('外部域');
  });
});
```

### 2.3 修改: `src/components/canvas/canvas.module.css`

在文件末尾添加：

```css
/* ============================================
   Section 12: Domain Type Variables
   限界上下文领域类型颜色系统
   ============================================ */

/* 浅色模式 */
[data-type="core"] {
  --domain-color: #F97316;
  --domain-bg-light: rgba(249, 115, 22, 0.08);
  --domain-border: rgba(249, 115, 22, 0.4);
  --domain-label-text: '核心域';
}

[data-type="supporting"] {
  --domain-color: #3B82F6;
  --domain-bg-light: rgba(59, 130, 246, 0.08);
  --domain-border: rgba(59, 130, 246, 0.4);
  --domain-label-text: '支撑域';
}

[data-type="generic"] {
  --domain-color: #6B7280;
  --domain-bg-light: rgba(107, 114, 128, 0.08);
  --domain-border: rgba(107, 114, 128, 0.4);
  --domain-label-text: '通用域';
}

[data-type="external"] {
  --domain-color: #8B5CF6;
  --domain-bg-light: rgba(139, 92, 246, 0.08);
  --domain-border: rgba(139, 92, 246, 0.4);
  --domain-label-text: '外部域';
}

/* expand-both 布局模式 */
.expand-both {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
```

### 2.4 修改: `src/components/canvas/CanvasPage.tsx`

关键变更：
1. 添加 `expand-both` data 属性支持
2. 添加 expand/collapse 按钮
3. 从 canvasStore 读取展开状态

### 2.5 修改: `src/lib/canvas/canvasStore.ts`

```typescript
// 新增 action
expandToBoth: () => set({ layoutMode: 'expand-both' }),
collapseToDefault: () => set({ layoutMode: 'default' }),
```

### 2.6 修改: `src/data/example-canvas.json`

补充 `previewUrl` 字段到每个组件节点。

---

## 3. 测试策略

### 3.1 单元测试
- `utils.test.ts`: 推导函数 100% 覆盖
- `canvasStore.test.ts`: action 测试

### 3.2 集成测试
- CanvasPage expand/collapse 交互
- CheckboxIcon 无障碍属性

### 3.3 E2E 测试 (Playwright)
- `/canvas` 页面加载
- expand-both 布局切换
- 无障碍验证 (axe-core)

---

## 4. 估计工时

| 任务 | 估计 |
|------|------|
| utils.ts + test | 2h |
| CSS 变量系统 | 3h |
| CanvasPage 交互 | 4h |
| ComponentSelectionStep | 2h |
| canvasStore | 1h |
| example-canvas.json | 1h |
| Playwright E2E | 4h |
| 代码审查 + 修复 | 3h |
| **总计** | **~20h** |

---

## 5. 验收标准

- [ ] `deriveDomainType()` 测试覆盖率 > 90%
- [ ] 所有 checkbox 有 `aria-checked` 属性
- [ ] `expand-both` 布局在 1200px+ 屏幕下正常显示
- [ ] `example-canvas.json` 所有节点有 `previewUrl`
- [ ] Playwright E2E 全部通过
- [ ] WCAG AA 对比度验证通过

---

*本文档由 Architect Agent 生成，基于 vibex-canvas-evolution.md*
