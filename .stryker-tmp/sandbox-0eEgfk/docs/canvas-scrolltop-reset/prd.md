# PRD: canvas-scrolltop-reset — 树面板滚动位置未重置

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Canvas 画布的三个树面板（BoundedContextTree、BusinessFlowTree、ComponentTree）在用户滚动后，切换 Phase 或切换 Tab 时，滚动位置（scrollTop）没有重置。用户折叠面板后再次展开，仍停留在之前的滚动位置，体验割裂。

### 目标

在面板从折叠状态展开时自动重置 scrollTop 为 0，确保每次展开都从顶部开始浏览。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 展开后 scrollTop | = 0 | E2E scrollTop 值验证 |
| 面板可见性 | 100% 顶部可见 | 截图/E2E boundingBox 验证 |

---

## 2. Epic 拆分

### Epic 1: 树面板 scrollTop 重置

**工时**: 1h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | TreePanel scrollTop 重置 | 0.5h | collapsed→展开时 scrollTop = 0 |
| E1-S2 | 三个面板全部验证 | 0.25h | Context/Flow/Component 全部生效 |
| E1-S3 | 回归测试 | 0.25h | 反复折叠展开无累积问题 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | TreePanel useEffect | 监听 `collapsed` 状态，展开时重置 scrollTop | `expect(panelBody.scrollTop).toBe(0)` | 【需页面集成】 |
| F1.2 | Context 面板验证 | BoundedContextTree 折叠→展开 scrollTop = 0 | `expect(contextPanelScrollTop).toBe(0)` | 【需页面集成】 |
| F1.3 | Flow 面板验证 | BusinessFlowTree 折叠→展开 scrollTop = 0 | `expect(flowPanelScrollTop).toBe(0)` | 【需页面集成】 |
| F1.4 | Component 面板验证 | ComponentTree 折叠→展开 scrollTop = 0 | `expect(componentPanelScrollTop).toBe(0)` | 【需页面集成】 |
| F1.5 | 回归验证 | 连续 10 次折叠展开，scrollTop 每次都为 0 | `expect(allScrollTops).toEqual(new Array(10).fill(0))` | 【需页面集成】 |

#### DoD

- [ ] TreePanel.tsx 添加 `useEffect` 监听 `collapsed` 状态
- [ ] 三个面板折叠→展开后 scrollTop === 0
- [ ] 连续 10 次折叠展开无累积问题
- [ ] Playwright E2E 覆盖三个面板场景

---

## 3. 验收标准（汇总）

| Story | expect() 断言 |
|-------|--------------|
| E1-S1 | `expect(panelBody.scrollTop).toBe(0)` |
| E1-S2 | `expect(contextPanelScrollTop).toBe(0)` |
| E1-S3 | `expect(flowPanelScrollTop).toBe(0)` |
| E1-S4 | `expect(componentPanelScrollTop).toBe(0)` |
| E1-S5 | `expect(allScrollTops.every(t => t === 0)).toBe(true)` |

---

## 4. DoD

### 全局 DoD

1. **scrollTop 重置**: collapsed→展开后 scrollTop === 0
2. **三面板覆盖**: Context / Flow / Component 全部生效
3. **回归测试**: 连续 10 次折叠展开无累积
4. **代码审查**: reviewer 确认 useEffect 逻辑正确

### 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | TreePanel.tsx 有 useEffect；三个面板 E2E 测试全通过 |

---

## 5. 技术方案

**推荐方案（方案 A）**：
```tsx
// TreePanel.tsx
const panelBodyRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!collapsed && panelBodyRef.current) {
    panelBodyRef.current.scrollTop = 0;
  }
}, [collapsed]);
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **可靠性** | 连续 10 次折叠展开，scrollTop 每次为 0 |
| **性能** | scrollTop 重置 < 1ms |
| **兼容性** | 仅在桌面端触发（移动端 touch scroll 不干预） |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 17:05 GMT+8*
