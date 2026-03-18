# PRD: useHomePage.ts SSR Hydration Fix

**项目**: vibex-hydration-fix-20260318  
**日期**: 2026-03-18  
**状态**: ready

---

## 1. 背景与目标

### 1.1 问题描述

`useHomePage.ts` 中 `selectedContextIds` 和 `selectedModelIds` 状态使用 `useState(() => new Set())` 函数式初始化，导致 SSR/CSR Hydration Mismatch。

### 1.2 目标

修复 Hydration 不匹配问题，消除控制台警告，确保首页加载稳定。

---

## 2. 功能需求

### F1: useEffect 延迟初始化

**描述**: 将 Set 状态初始化延迟到客户端 useEffect 中执行，避免服务端与客户端不一致。

**实现**:
```typescript
// 1. 状态类型修改
const [selectedContextIds, setSelectedContextIds] = useState<Set<string> | null>(null);
const [selectedModelIds, setSelectedModelIds] = useState<Set<string> | null>(null);

// 2. 客户端初始化
useEffect(() => {
  setSelectedContextIds(new Set());
  setSelectedModelIds(new Set());
}, []);

// 3. 渲染时处理 null 状态
const contextIds = selectedContextIds ?? new Set();
const modelIds = selectedModelIds ?? new Set();
```

**验收标准**:
- `expect(console.warn).not.toBeCalledWith(expect.stringContaining('Hydration'))`
- 页面加载后 100ms 内状态不为 null
- 初始渲染时使用空 Set 作为默认值

---

### F2: 类型兼容性

**描述**: 保持与现有类型定义和调用方兼容。

**实现**:
- 状态类型改为 `Set<string> | null`
- 渲染时使用空值合并操作符 `??` 提供默认值
- 不修改 hook 的公共接口类型

**验收标准**:
- `expect(useHomePage().selectedContextIds).toBeInstanceOf(Set)`
- `expect(useHomePage().selectedModelIds).toBeInstanceOf(Set)`
- 所有引用 `useHomePage` 的组件无需修改

---

### F3: 与现有功能集成

**描述**: 修复不影响现有交互流程。

**集成点**:
| 功能 | 状态 | 影响 |
|------|------|------|
| 上下文选择 | 正常 | 无 |
| 模型选择 | 正常 | 无 |
| 流程生成 | 正常 | 无 |

**验收标准**:
- E2E 测试通过率 100%
- 用户选择上下文后 `selectedContextIds` 正确更新
- 用户选择模型后 `selectedModelIds` 正确更新

---

## 3. 验收标准

### 3.1 功能验收

| ID | 条件 | 测试方式 |
|----|------|----------|
| AC1 | 无 Hydration 警告 | Playwright 控制台监控 |
| AC2 | 状态初始化正确 | `expect(set).toBeInstanceOf(Set)` |
| AC3 | 状态操作正常 | E2E 测试用户交互 |
| AC4 | 类型兼容 | TypeScript 编译通过 |

### 3.2 非功能验收

| ID | 条件 | 指标 |
|----|------|------|
| NF1 | 首屏渲染 | 无明显闪烁 |
| NF2 | 性能影响 | < 5ms 额外渲染时间 |

---

## 4. 约束

- 不修改其他无关代码
- 不删除现有测试
- 不影响 SEO (保持 SSR)

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 轻微闪烁 | 低 | 使用 CSS 遮罩过渡 |
| null 处理遗漏 | 中 | 全面测试覆盖 |

---

## 6. Epic 拆分

| Epic | 功能点 | 工期 |
|------|--------|------|
| Epic 1: 核心修复 | F1, F2 | 0.5d |
| Epic 2: 集成测试 | F3 | 0.5d |

---

**作者**: PM Agent  
**审核**: 待定
