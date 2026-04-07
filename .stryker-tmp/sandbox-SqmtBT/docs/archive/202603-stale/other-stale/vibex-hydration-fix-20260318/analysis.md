# 分析报告: useHomePage.ts SSR Hydration 不匹配问题

**项目**: vibex-hydration-fix-20260318  
**任务**: analyst-analyze  
**日期**: 2026-03-18

---

## 1. 问题定位

### 1.1 问题代码

**文件**: `vibex-fronted/src/components/homepage/hooks/useHomePage.ts`  
**位置**: 第99-100行

```typescript
// 修复: Hydration Mismatch - 使用函数式初始化避免SSR/CSR引用不一致
const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(() => new Set());
const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(() => new Set());
```

### 1.2 类型定义

```typescript
// 第34-37行
selectedContextIds: Set<string>;
selectedModelIds: Set<string>;
setSelectedContextIds: (ids: Set<string>) => void;
setSelectedModelIds: (ids: Set<string>) => void;
```

---

## 2. 根本原因分析

### 2.1 问题本质

虽然代码使用了函数式初始化 `() => new Set()`，但这**无法解决** SSR Hydration Mismatch 问题：

1. **服务端渲染 (SSR)**: `new Set()` 在服务端执行，创建一个 Set 实例
2. **客户端水合 (Hydration)**: `new Set()` 在客户端再次执行，创建**另一个** Set 实例
3. **引用比较**: React 比较时发现两边的 Set 是不同引用，导致 Hydration Mismatch

### 2.2 为什么函数式初始化无效

| 初始化方式 | SSR 执行 | CSR 执行 | 结果 |
|-----------|---------|---------|------|
| `useState(new Set())` | ✅ | ❌ (跳过) | 客户端与服务端不同 |
| `useState(() => new Set())` | ✅ | ✅ | 每次创建新引用，仍不匹配 |

**核心问题**: `Set` 是非序列化对象，无法通过 HTML 传输，必须在两端分别实例化。

---

## 3. 影响范围

### 3.1 直接影响

| 状态 | 用途 | 影响 |
|------|------|------|
| `selectedContextIds` | 记录用户选中的限界上下文 | Hydration 警告，交互可能异常 |
| `selectedModelIds` | 记录用户选中的领域模型 | Hydration 警告，交互可能异常 |

### 3.2 间接影响

- 组件: `useHomePage.ts` 被首页多个组件引用
- 用户流程: 上下文选择 → 模型选择 → 流程生成

### 3.3 风险评估

| 风险项 | 级别 | 说明 |
|--------|------|------|
| 功能异常 | 低 | 状态初始为空 Set，用户操作正常 |
| 控制台警告 | 中 | 影响调试和 SEO |
| 性能 | 低 | 首次加载可能有轻微闪烁 |

---

## 4. 修复方案

### 方案 A: useEffect 延迟初始化 (推荐)

```typescript
const [selectedContextIds, setSelectedContextIds] = useState<Set<string> | null>(null);
const [selectedModelIds, setSelectedModelIds] = useState<Set<string> | null>(null);

// 客户端初始化
useEffect(() => {
  setSelectedContextIds(new Set());
  setSelectedModelIds(new Set());
}, []);

// 渲染时处理 null 状态
const contextIds = selectedContextIds ?? new Set();
const modelIds = selectedModelIds ?? new Set();
```

**优点**:
- 彻底解决 SSR/CSR 不一致
- 不需要修改类型定义

**缺点**:
- 需要处理 null 状态
- 可能有轻微闪烁

---

### 方案 B: 序列化为数组

```typescript
// 使用数组替代 Set
const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

// 辅助函数
const idsToSet = (ids: string[]) => new Set(ids);
const setToIds = (set: Set<string>) => Array.from(set);
```

**优点**:
- 数组可序列化，SSR/CSR 一致
- 不需要 useEffect

**缺点**:
- 需要修改类型定义和所有调用处
- 改动范围较大

---

### 方案 C: 客户端-only 组件 (不推荐)

使用 `next/dynamic` 动态导入，添加 `ssr: false`。

**缺点**:
- 影响 SEO
- 改动范围大

---

## 5. 推荐方案

**推荐方案 A (useEffect 延迟初始化)**，理由：

1. 改动最小，仅修改初始化方式
2. 不影响现有测试和类型定义
3. 彻底解决 Hydration Mismatch

---

## 6. 验收标准

- [ ] SSR 页面加载无 Hydration Mismatch 警告
- [ ] 现有 E2E 测试通过
- [ ] 用户选择上下文/模型功能正常

---

## 7. 约束确认

- ✅ 不删除现有测试
- ✅ 不修改其他无关代码
- ✅ 仅修改 useHomePage.ts 第99-100行及相关初始化逻辑

---

**分析完成**
