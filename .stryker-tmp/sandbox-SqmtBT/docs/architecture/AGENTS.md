# 开发约束 (AGENTS.md): VibeX Canvas Phase1

> **项目**: vibex-canvas-evolution-roadmap  
> **阶段**: Phase1 — 样式统一 + 导航修复  
> **版本**: 1.0.0  
> **日期**: 2026-03-29  
> **Architect**: Architect Agent  
> **工作目录**: /root/.openclaw/vibex/vibex-fronted

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **框架** | React 19 + TypeScript + Next.js App Router |
| **样式** | CSS Modules + CSS Custom Properties（**禁止引入新 CSS 方案**） |
| **状态** | Zustand canvasStore（已存在，禁止引入新状态管理） |
| **测试** | Vitest + Testing Library + Playwright |
| **无障碍** | 所有交互元素必须有 `aria-*` 属性，emoji 仅用于装饰 |

---

## 2. 文件操作约束

### ✅ 允许修改
| 文件 | 约束 |
|------|------|
| `src/lib/canvas/utils.ts` | 新建，存放推导函数 |
| `src/lib/canvas/__tests__/utils.test.ts` | 新建 |
| `src/components/canvas/canvas.module.css` | 追加 CSS 变量 + expand-both |
| `src/components/canvas/CanvasPage.tsx` | + expand-both data 属性 + 按钮 |
| `src/components/flow-components/ComponentSelectionStep.tsx` | emoji → CheckboxIcon |
| `src/components/flow-components/ComponentSelectionStep.module.css` | + deleteBtn 样式 |
| `src/data/example-canvas.json` | + previewUrl 字段 |
| `src/lib/canvas/canvasStore.ts` | + expandToBoth / collapseToDefault |

### ❌ 禁止操作
- **不要** 修改现有的 CheckboxIcon 样式逻辑
- **不要** 引入 Tailwind CSS 或其他 CSS 方案
- **不要** 修改 `canvasStore` 中已有的 state/action（只追加）
- **不要** 在 `canvas.module.css` 中删除现有变量

---

## 3. 代码规范

### 3.1 CSS 变量命名
```css
/* 正确：使用 data-type 选择器 */
[data-type="core"] {
  --domain-color: #F97316;
}

/* 错误：内联样式 */
<span style="color: #F97316">
```

### 3.2 无障碍规范
```tsx
// 正确
<span role="checkbox" aria-checked={isChecked}>
  {isChecked ? <CheckedIcon /> : <UncheckedIcon />}
</span>

// 错误：纯 emoji，无语义
<span>✅</span>
```

### 3.3 TypeScript 类型
```typescript
// 正确：使用 type 导出
export type DomainType = 'core' | 'supporting' | 'generic' | 'external';

// 错误：any
function deriveDomainType(name: any): any
```

---

## 4. 测试要求

### 4.1 覆盖率门禁
| 文件 | 覆盖率要求 |
|------|-----------|
| `utils.ts` | ≥ 90% |
| `canvasStore.ts` | ≥ 80% |

### 4.2 E2E 检查清单
- [ ] `/canvas` 页面加载无 JS 错误
- [ ] expand-both 切换正常工作
- [ ] checkbox 在 VoiceOver 下可朗读
- [ ] 深色模式颜色对比度 ≥ 4.5:1

---

## 5. 提交流程

```
1. dev 完成代码
2. 运行: pnpm test -- --coverage
3. 运行: pnpm playwright test
4. 提交: git commit -m "feat(canvas-phase1): <功能描述>"
5. 推送: git push
6. tester 审查 → reviewer 二审 → 合并
```

---

## 6. 回滚计划

| 场景 | 应对 |
|------|------|
| expand-both 破坏现有布局 | Playwright E2E 捕获 + revert commit |
| CheckboxIcon 改动影响其他流程 | 确认 ComponentSelectionStep 唯一使用点 |
| 颜色对比度不达标 | 调整 CSS 变量中的色值 |

---

*本文档由 Architect Agent 生成，用于约束 dev 和 tester 的开发行为。*
