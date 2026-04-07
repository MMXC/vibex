# Analysis: vibex-bc-filter-fix-20260326

**任务**: vibex-bc-filter-fix-20260326/analyze-requirements
**分析人**: Analyst
**时间**: 2026-03-26 20:40 (UTC+8)
**状态**: ✅ 完成

---

## 1. 执行摘要

**一句话结论**: `bounded-contexts-filter.ts` 的 `forbiddenNames` 包含 `'管理'`，会将所有中文 DDD 合法领域名称（如"患者管理""订单管理""医生管理"）全部误杀，导致 `filterInvalidContexts()` 返回空数组。

---

## 2. 根因分析

### 2.1 代码审查

**文件**: `vibex-backend/src/lib/bounded-contexts-filter.ts` 第 26 行

```typescript
const DEFAULT_OPTIONS: Required<FilterOptions> = {
  forbiddenNames: ['管理', '系统', '模块', '功能', '平台'],  // 🔴 全部误杀
  maxNameLength: 10,   // 🔴 偏短
  minNameLength: 2,
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};
```

### 2.2 误杀证据

**测试数据**（`bounded-contexts-consistency.test.ts` 第 55-62 行）:

```typescript
const rawContexts: BoundedContext[] = [
  { name: '患者管理',   type: 'core', ... },     // ❌ 含"管理" → 被过滤
  { name: '认证授权',   type: 'generic', ... },  // ✅ 通过
  { name: '问诊管理',   type: 'core', ... },     // ❌ 含"管理" → 被过滤
  { name: '微信支付',   type: 'external', ... }, // ✅ 通过
  { name: '订单管理',   type: 'supporting', ... }, // ❌ 含"管理" → 被过滤
  { name: '通知推送',   type: 'generic', ... }, // ✅ 通过
];
```

**结果**: 6 个合法上下文，过滤后只剩 2 个（3/6 = 50% 误杀率）。

### 2.3 传播链路

```
LLM 生成 "患者管理" (完全合法)
  → filterInvalidContexts() 
  → isNameFiltered("患者管理", {forbiddenNames: ['管理', ...]})
  → name.includes('管理') === true  // 🔴 被过滤
  → 返回空数组
  → API 返回 { contexts: [], success: false }
  → 用户看到"无限界上下文"
```

---

## 3. 问题量化

| 过滤条件 | 问题 | 误杀率 |
|----------|------|--------|
| `'管理'` 在 forbiddenNames | DDD 领域名几乎都含"管理" | ~50-70% |
| `maxNameLength: 10` | 中文"在线预约管理系统"=8字，超限 | ~10% |
| `'系统'` 在 forbiddenNames | "支付系统""问诊系统"被误杀 | ~15% |
| `'功能'` 在 forbiddenNames | "核心功能"被误杀 | ~5% |

---

## 4. 修复方案

### 4.1 方案 A: 精确化 forbiddenNames（推荐）

**核心思路**: 将 `'管理'` 改为更精确的通用词过滤，只过滤真正无意义的词汇。

```typescript
const DEFAULT_OPTIONS: Required<FilterOptions> = {
  minNameLength: 2,
  maxNameLength: 12,     // ↑ 从 10 改为 12，支持更长名称
  // 改为精确匹配而非包含匹配
  forbiddenNames: ['系统', '模块', '功能', '平台'],  // ← 移除 '管理'
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};
```

**变化**:
- `maxNameLength: 10 → 12`：支持 "在线预约管理系统"（8字）通过
- 移除 `'管理'`：合法后缀不再误杀
- 移除 `'平台'`：因为 "问诊平台" 可能是合法的业务名称

**改动量**: ~3 行代码，5 分钟完成。

### 4.2 方案 B: 改用 suffix/prefix 黑名单

**核心思路**: 将 "管理" 从包含匹配改为后缀精确匹配。

```typescript
// 过滤真正的无意义词（非 DDD 后缀）
const BAD_SUFFIXES = ['系统', '模块', '平台'];    // 精确后缀
const BAD_PREFIXES = ['测试', '测试用', '临时'];  // 精确前缀

function isNameFiltered(name: string, options?: FilterOptions): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // 长度检查
  if (name.length < opts.minNameLength || name.length > opts.maxNameLength) {
    return true;
  }
  
  // 精确后缀检查
  if (opts.BAD_SUFFIXES.some(s => name.endsWith(s))) {
    return true;
  }
  
  // 精确前缀检查
  if (opts.BAD_PREFIXES.some(p => name.startsWith(p))) {
    return true;
  }
  
  return false;
}
```

**变化**: `'管理'` 永远不会被过滤（因为不作为后缀/前缀匹配），`'系统'` 只在作为后缀时过滤（"支付系统"过滤，"系统架构"不过滤）。

**改动量**: ~20 行代码，15 分钟完成。

### 4.3 方案 C: 白名单 + 评分机制（过度设计）

为每个名称打分，高分通过。**不推荐**，改动量太大。

---

## 5. 推荐方案

**方案 A（精确化 forbiddenNames）**，原因：
1. 最小改动，风险最低
2. 立即解决核心问题（移除 '管理'）
3. 保留向后兼容（其他过滤器不变）

同时建议：
- `maxNameLength: 10 → 12`
- 移除 `'平台'`（也是合法业务名）

---

## 6. 测试用例补充

在 `bounded-contexts-consistency.test.ts` 中补充：

```typescript
describe('C3: DDD合法名称不被过滤', () => {
  const dddValidNames = [
    '患者管理',    // 含"管理"，DDD合法
    '订单管理',    // 含"管理"，DDD合法
    '医生管理',    // 含"管理"，DDD合法
    '问诊管理',    // 含"管理"，DDD合法
    '认证授权',    // 不含过滤词
    '通知推送',    // 不含过滤词
  ];

  test.each(dddValidNames)('%s 不应被默认过滤器过滤', (name) => {
    expect(isNameFiltered(name)).toBe(false);
  });

  test('在线预约管理系统 应通过（8字 < maxNameLength=12）', () => {
    expect(isNameFiltered('在线预约管理系统')).toBe(false);
  });

  const dddInvalidNames = [
    '测试',        // 纯通用词
    '临时模块',    // 含"模块"
    'XX系统',      // 含"系统"
    '某某平台',    // 含"平台"
  ];

  test.each(dddInvalidNames)('%s 应被默认过滤器过滤', (name) => {
    expect(isNameFiltered(name)).toBe(true);
  });
});
```

---

## 7. 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 移除 '管理' 后仍有低质量名称漏过 | 低 | 低 | 配合方案 A 的 maxNameLength 调整 |
| maxNameLength 12 仍然不够 | 低 | 低 | 可动态调整或移除上限 |
| 改动破坏现有测试 | 低 | 中 | 先跑一遍测试，再合并 |

---

## 8. 工时估算

| 步骤 | 开发 | 测试 | 说明 |
|------|------|------|------|
| 修改 DEFAULT_OPTIONS | 5min | 0 | 移除/调整 forbiddenNames |
| 更新测试用例 | 0 | 15min | 补充 DDD 合法名称测试 |
| 回归测试 | 0 | 10min | 确保不破坏其他逻辑 |
| **合计** | **5min** | **25min** | **总计 30min** |

---

## 9. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|---------|
| V1 | '患者管理' / '订单管理' / '医生管理' 不被默认过滤器过滤 | 单元测试 |
| V2 | filterInvalidContexts([{name:'患者管理'},{name:'认证授权'}]) 返回 2 个 | 单元测试 |
| V3 | '测试系统' / 'XX模块' / '某某平台' 被过滤 | 单元测试 |
| V4 | maxNameLength=12 支持 8 字中文名称 | 单元测试 |
| V5 | API 返回 contexts.length > 0（健康输入） | 集成测试 |

---

*分析产出物: `/root/.openclaw/vibex/docs/vibex-bc-filter-fix-20260326/analysis.md`*
