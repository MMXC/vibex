# PRD: vibex-homepage-hydration-fix

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-homepage-hydration-fix |
| **类型** | Bug 修复 |
| **目标** | 修复首页 React Error #310 Hydration mismatch |
| **完成标准** | DevTools Console 无 Hydration 警告，SSR/CSR 一致 |
| **工作量** | 1 天 |
| **页面集成** | 【需页面集成】HomePage (/) 根组件 |

---

## 2. 问题陈述

首页存在 React Error #310 Hydration mismatch，原因是服务端渲染 (SSR) 与客户端渲染 (CSR) 内容不一致。

---

## 3. Epic 拆分

### Epic 1: 问题定位

**Story F1.1**: 分析 DevTools Console 警告
- **验收标准**:
  - `expect(hydrationWarnings.length).toBe(0)`
  - `expect(errorCount).toBe(0)`

**Story F1.2**: 定位问题组件
- **验收标准**:
  - `expect(problemComponents.length).toBeGreaterThan(0)`

### Epic 2: 修复实施

**Story F2.1**: 修复时间戳相关代码
- 修复使用 `new Date()` 的组件
- **验收标准**:
  - `expect(component).toUse('useEffect')` // 延迟初始化

**Story F2.2**: 修复浏览器 API 访问
- 修复直接访问 `window`/`document` 的代码
- **验收标准**:
  - `expect(typeof window).toBe('undefined')` // SSR 时检查
  - `expect(component).toRenderClientOnly()`

**Story F2.3**: 修复条件渲染差异
- **验收标准**:
  - `expect(isClient).toBe(true)`
  - `expect(suppressHydrationWarning).toBe(true)` // 如需临时抑制

### Epic 3: 验证测试

**Story F3.1**: 本地验证无警告
- **验收标准**:
  - `expect(hydrationWarnings.length).toBe(0)`

**Story F3.2**: SSR 验证
- **验收标准**:
  - `expect(curl('http://localhost:3000')).toContain('<div id="__next">')`
  - `expect(html).not.toContain('hydration')`

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 打开首页 | 检查 Console | 无 Hydration 警告 |
| AC1.2 | 页面加载 | 用户访问 | 无页面闪烁 |
| AC2.1 | `curl localhost:3000` | SSR 检查 | HTML 正常 |
| AC2.2 | 页面刷新 | F5 | 内容一致 |
| AC3.1 | 禁用 JS | 服务端渲染 | 页面可读 |

---

## 5. 非功能需求

- **性能**: SSR/CSR 切换无闪烁
- **可访问性**: 无 JS 时页面可读
- **可维护性**: 代码清晰，无 hack

---

## 6. DoD

- [ ] DevTools Console 无 Hydration 警告
- [ ] 页面加载无闪烁
- [ ] 服务端渲染正常
- [ ] Code Review 通过
