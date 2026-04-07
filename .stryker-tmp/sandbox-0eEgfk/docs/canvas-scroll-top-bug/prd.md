# PRD: canvas-scroll-top-bug — 画布工具栏被 scrollTop 推出视口

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

从「需求输入」页面切换到「画布」模式时，顶部工具栏区域（需求/消息/历史/导出/搜索按钮等）完全不可见。根因：`canvasContainer.scrollTop = 946`，画布容器内部被向下滚动了 946px，滚动位置在页面切换时未被重置。

### 目标

修复页面切换时 `scrollTop` 未归零的问题，确保用户进入画布后所有工具栏立即可见。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 工具栏可见率 | 100%（0 scrollTop 进入画布） | E2E scrollTop 值验证 |
| 进度条可见率 | 100% | E2E 截图验证 |
| Tab 栏可见率 | 100% | E2E 截图验证 |

---

## 2. Epic 拆分

### Epic 1: scrollTop 归零修复

**工时**: 0.5h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | scrollTop 归零修复 | 0.25h | 页面切换时 `canvasContainer.scrollTop = 0` |
| E1-S2 | 三栏面板区域验证 | 0.1h | 三栏面板 top ≥ 0，进入画布即见 |
| E1-S3 | 回归测试 | 0.15h | 切换不破坏其他功能 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | scrollTop 归零 | canvas 初始化/状态切换时重置 scrollTop 为 0 | `expect(scrollTop).toBe(0)` | 【需页面集成】 |
| F1.2 | 工具栏可见 | 阶段进度条、Tab 栏、工具栏全部可见（top ≥ 0） | `expect(toolbarTop).toBeGreaterThanOrEqual(0)` | 【需页面集成】 |
| F1.3 | 回归验证 | 反复切换不产生累积 scrollTop（每次都归零） | `expect(scrollTopAfterNthSwitch).toBe(0)` | 【需页面集成】 |

#### DoD

- [ ] 页面切换后 `canvasContainer.scrollTop === 0`
- [ ] 阶段进度条、Tab 栏、工具栏、三栏面板全部可见
- [ ] Playwright E2E 测试覆盖切换场景
- [ ] reviewer 代码审查通过

---

## 3. 验收标准（汇总）

| Story | expect() 断言 |
|-------|--------------|
| E1-S1 | `expect(canvasContainer.scrollTop).toBe(0)` |
| E1-S2 | `expect(toolbarTop).toBeGreaterThanOrEqual(0)` |
| E1-S2 | `expect(tabBarTop).toBeGreaterThanOrEqual(0)` |
| E1-S2 | `expect(progressBarTop).toBeGreaterThanOrEqual(0)` |
| E1-S3 | `expect(scrollTopAfterNthSwitch).toBe(0)` |

---

## 4. DoD (Definition of Done)

### 全局 DoD

1. **修复验证**: 页面切换后 scrollTop === 0
2. **截图验证**: 工具栏/Tab/进度条全部可见
3. **回归测试**: E2E 覆盖反复切换场景
4. **代码审查**: reviewer 确认修复不破坏其他功能

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | scrollTop === 0；所有工具栏 top ≥ 0；E2E 测试通过 |

---

## 5. 技术方案

**推荐方案（方案 A）**：
```tsx
// 在 canvas 初始化/状态切换时
const container = document.querySelector('[class*=canvasContainer]');
if (container) container.scrollTop = 0;
```

**方案 B（备用）**：
```css
.canvasContainer {
  overflow: hidden;
}
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **可靠性** | 反复切换 10 次，scrollTop 每次都为 0 |
| **性能** | scrollTop 归零操作 < 1ms |
| **兼容性** | 不影响 fixed 定位元素（展开按钮/UndoBar） |

---

## 7. 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| scrollTop 重置时机不对 | 低 | 中 | 在 canvas mount 时执行（useEffect） |
| 修复影响其他滚动场景 | 低 | 低 | CSS overflow:hidden 备用方案 |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 16:55 GMT+8*
