# Architecture: vibex-bc-filter-fix-20260326

## 1. 执行摘要

**问题**: `bounded-contexts-filter.ts` 的 `forbiddenNames` 包含 `'管理'`，以包含匹配（`name.includes()`）误杀所有含"管理"的合法 DDD 领域名（患者管理、订单管理、医生管理），导致 `filterInvalidContexts()` 返回空数组。

**修复策略**: 最小改动优先 —— 调整 `DEFAULT_OPTIONS` 配置 + 更新对应测试用例。

---

## 2. 技术方案

### 2.1 方案选择

**选用方案 A（精确化 forbiddenNames）**，原因：
- 最小改动（~5 行），风险最低
- 立即解决核心问题
- 保留向后兼容

**方案 B（精确后缀/前缀匹配）留作后续优化**，当前不实施（理由：改动量 ~20 行，超出必要范围）。

### 2.2 DEFAULT_OPTIONS 修改

**文件**: `vibex-backend/src/lib/bounded-contexts-filter.ts`

```typescript
const DEFAULT_OPTIONS: Required<FilterOptions> = {
  minNameLength: 2,
  maxNameLength: 10,  // 🔴 问题1：中文8字名称超限
  forbiddenNames: ['管理', '系统', '模块', '功能', '平台'],  // 🔴 问题2：'管理'误杀DDD合法名
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};
```

修改为：

```typescript
const DEFAULT_OPTIONS: Required<FilterOptions> = {
  minNameLength: 2,
  maxNameLength: 12,  // ✅ 改为12，支持"在线预约管理系统"(8字)等合法长名
  forbiddenNames: ['系统', '模块', '功能', '平台'],  // ✅ 移除'管理'（DDD合法后缀）
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};
```

### 2.3 已知局限

移除 `'管理'` 后，`'系统'` 仍以包含匹配，会误杀"问诊系统"等合法业务名。如需彻底解决，可升级为方案 B（精确后缀匹配），但当前修复优先级为 P0（仅修复核心问题）。

---

## 3. 数据模型

单文件模块，无数据库变更。

```
BoundedContext (from bounded-contexts.ts)
├── name: string        // 过滤对象
├── type: 'core' | 'generic' | 'supporting' | 'external'
├── description: string
└── ubiquitousLanguage: string[]

FilterOptions (修改范围)
├── forbiddenNames: string[]  // 移除 '管理'
├── maxNameLength: number     // 10 → 12
└── ...
```

---

## 4. 回归影响分析

⚠️ **2 个现有测试会 FAIL（预期行为）**：

| 测试文件 | 用例 | 原因 | 修复方式 |
|----------|------|------|----------|
| `bounded-contexts-filter.test.ts` | `it('should filter names containing "管理"')` | 修复后 `患者管理` 不再被过滤 | **更新断言**：`toBe(true)` → `toBe(false)`，改为正向测试 DDD 合法人名 |
| `bounded-contexts-filter.test.ts` | `it('should filter names that are too long')` | `患者管理系统集成模块`(12字) 在 maxNameLength=12 下通过 | **替换测试用例**：用真正的超长名（如13字）验证长度过滤 |

---

## 5. 测试策略

### 5.1 单元测试覆盖

```
bounded-contexts-filter.test.ts
├── C1: 基础过滤逻辑 (现有，保留)
│   ├── 短名过滤 (length < 2)
│   ├── 纯通用词过滤 (测试/临时)
│   └── 有效名称通过
├── C2: 长度边界 (修复验证)
│   ├── 12字中文名通过 ← 关键用例
│   ├── 13字中文名过滤
│   └── 混合通用后缀 + 合法名通过
├── C3: DDD 合法人名 ← 新增
│   ├── 患者管理/订单管理/医生管理/问诊管理 通过 ← 核心验证
│   ├── 认证授权/通知推送 通过（不含过滤词）
│   └── 精确后缀仍过滤：测试系统/XX模块
└── C4: coreRatio 不变 (回归验证)
```

### 5.2 关键测试用例

```typescript
// C3: DDD 合法人名 — 核心验证
const dddValid = ['患者管理', '订单管理', '医生管理', '问诊管理', '认证授权', '通知推送'];
dddValid.forEach(name => expect(isNameFiltered(name)).toBe(false));

// C2: maxNameLength=12
expect(isNameFiltered('在线预约管理系统')).toBe(false);   // 8字
expect(isNameFiltered('患者管理系统集成模块')).toBe(false); // 12字（边界）
expect(isNameFiltered('在线预约管理系统1')).toBe(true);   // 13字，超限

// C1: 真正通用词仍被过滤
expect(isNameFiltered('测试系统')).toBe(true);
expect(isNameFiltered('XX模块')).toBe(true);
expect(isNameFiltered('某某平台')).toBe(true);
```

### 5.3 集成测试

```typescript
// API 端到端验证
test('健康输入返回非空 contexts', async () => {
  const result = await callGenerateContexts('开发一个在线预约医生系统');
  expect(result.contexts.length).toBeGreaterThan(0);
});
```

---

## 6. 文件变更清单

| 文件 | 操作 | 改动量 |
|------|------|--------|
| `vibex-backend/src/lib/bounded-contexts-filter.ts` | 修改 DEFAULT_OPTIONS | ~3 行 |
| `vibex-backend/src/lib/bounded-contexts-filter.test.ts` | 更新 2 个 FAIL 测试 + 新增 C2/C3 分组 | ~40 行 |

---

## 7. 性能评估

- 过滤函数：O(n) 遍历 forbiddenNames，`n <= 4`，无性能影响
- `maxNameLength: 10 → 12`：仅改变边界判断，无性能影响
- 测试执行：Jest 单元测试，预计 < 5s 全部完成

---

*Architect: 产出时间 2026-03-26 20:49 UTC+8*
