# 开发检查清单 - Epic 1: 组件框架创建

**项目**: vibex-homepage-modular-refactor  
**任务**: impl-epic1-framework  
**日期**: 2026-03-15  
**Agent**: dev

---

## 验收标准检查

| ID | 功能点 | 验收标准 | 状态 |
|----|--------|----------|------|
| F1.1 | 目录结构 | `expect(dir).toExist()` | ✅ |
| F1.2 | 导出索引 | `expect(export).toWork()` | ✅ |
| F1.3 | 类型定义 | `expect(types).toBeDefined()` | ✅ |

---

## 详细检查

### F1.1: 目录结构 ✅

```
src/components/homepage/
├── Navbar/
│   ├── Navbar.tsx
│   └── Navbar.module.css
├── Sidebar/
│   ├── Sidebar.tsx
│   └── Sidebar.module.css
├── PreviewArea/
│   ├── PreviewArea.tsx
│   └── PreviewArea.module.css
├── InputArea/
│   ├── InputArea.tsx
│   └── InputArea.module.css
├── AIPanel/
│   ├── AIPanel.tsx
│   └── AIPanel.module.css
├── hooks/
│   ├── useHomePageState.ts
│   ├── usePanelActions.ts
│   └── index.ts
├── index.ts
└── types.ts
```

### F1.2: 导出索引 ✅

- index.ts 统一导出所有组件
- 导出 Navbar, Sidebar, PreviewArea, InputArea, AIPanel
- 导出 useHomePageState, usePanelActions hooks
- 导出所有类型定义

### F1.3: 类型定义 ✅

- components/homepage/types.ts: 组件 Props 类型
- src/types/homepage.ts: 完整类型定义（包括 Step, BoundedContext, DomainModel, BusinessFlow 等）

---

## 技术验证

- ✅ TypeScript 编译通过 (`npx tsc --noEmit`)
- ✅ 所有组件有 Props 类型定义
- ✅ CSS Modules 样式文件就绪

---

## 产出物

- `/root/.openclaw/vibex/vibex-fronted/src/components/homepage/index.ts`
- `/root/.openclaw/vibex/vibex-fronted/src/components/homepage/types.ts`
- `/root/.openclaw/vibex/vibex-fronted/src/types/homepage.ts`
- 5 个组件目录及文件
- 2 个自定义 Hooks

---

## 备注

- Epic 1 完成，可进入后续 Epics (2-6)
- 组件已创建但尚未集成到 page.tsx
- 后续 Epics 需要将组件逐步集成到主页面
