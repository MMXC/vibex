# Implementation Plan: vibex-bc-filter-fix-20260326

## 1. 实施步骤

### Step 1: 修改 DEFAULT_OPTIONS（约 5min）

**文件**: `vibex-backend/src/lib/bounded-contexts-filter.ts`

```diff
const DEFAULT_OPTIONS: Required<FilterOptions> = {
  minNameLength: 2,
- maxNameLength: 10,
- forbiddenNames: ['管理', '系统', '模块', '功能', '平台'],
+ maxNameLength: 12,
+ forbiddenNames: ['系统', '模块', '功能', '平台'],
  minCoreRatio: 0.4,
  maxCoreRatio: 0.7,
};
```

### Step 2: 更新 bounded-contexts-filter.test.ts（约 15min）

**文件**: `vibex-backend/src/lib/bounded-contexts-filter.test.ts`

#### 2.1 更新 `isNameFiltered` 测试分组

**删除（bug-encoded test）**:
```typescript
// 删除：it('should filter names containing "管理"')
// 因为 '管理' 不再是 forbiddenNames
```

**新增 C3 分组**:
```typescript
describe('C3: DDD 合法名称不被过滤', () => {
  const dddValidNames = [
    '患者管理',    // 含"管理"，DDD 合法
    '订单管理',    // 含"管理"，DDD 合法
    '医生管理',    // 含"管理"，DDD 合法
    '问诊管理',    // 含"管理"，DDD 合法
    '认证授权',    // 不含过滤词
    '通知推送',    // 不含过滤词
  ];

  test.each(dddValidNames)('%s 不应被默认过滤器过滤', (name) => {
    expect(isNameFiltered(name)).toBe(false);
  });

  test('含"管理"的 DDD 名与通用后缀组合仍通过', () => {
    // "患者管理系统" 11字，但含"系统"，会被过滤
    expect(isNameFiltered('患者管理系统')).toBe(true); // 含"系统"后缀
    // 正确的组合：移除"系统"后的合法名
    expect(isNameFiltered('患者管理')).toBe(false);    // 含"管理"但合法
  });
});
```

#### 2.2 更新 C2 长度测试

**替换超长名测试用例**:
```typescript
// 原用例（12字，在 maxNameLength=12 下会通过，FAIL）
// it('should filter names that are too long', () => {
//   expect(isNameFiltered('患者管理系统集成模块')).toBe(true);
// });

// 替换为（13字，超限）：
describe('C2: maxNameLength=12 边界测试', () => {
  test('12字名称应通过', () => {
    expect(isNameFiltered('患者管理系统集成模块')).toBe(false); // 12字 = 边界
  });
  test('13字名称应过滤', () => {
    expect(isNameFiltered('患者管理系统集成模块啊')).toBe(true);  // 13字 > 12
  });
  test('8字名称应通过', () => {
    expect(isNameFiltered('在线预约管理系统')).toBe(false); // 8字 < 12
  });
});
```

### Step 3: 运行测试套件验证（约 5min）

```bash
cd /root/.openclaw/vibex/vibex-backend
npx jest src/lib/bounded-contexts-filter.test.ts --no-coverage
```

**预期结果**: 所有测试 PASS（0 failures）

### Step 4: 提交 Git（约 5min）

```bash
cd /root/.openclaw/vibex
git add vibex-backend/src/lib/bounded-contexts-filter.ts vibex-backend/src/lib/bounded-contexts-filter.test.ts
git commit -m "fix(bounded-contexts): 移除'管理'误杀，调整maxNameLength至12

- 移除 '管理' from forbiddenNames（DDD合法后缀，不再误杀）
- 调整 maxNameLength: 10 → 12（支持8字中文名称）
- 新增 C3 分组：DDD 合法人名测试
- 更新 C2 分组：maxNameLength 边界测试
- 更新现有测试用例（删除/替换 bug-encoded 断言）
Fixes: vibex-bc-filter-fix-20260326"
```

---

## 2. 实施检查清单

- [ ] DEFAULT_OPTIONS 已修改（移除'管理'，maxNameLength=12）
- [ ] `isNameFiltered('患者管理')` 测试断言已更新为 `toBe(false)`
- [ ] 长度边界测试已替换为真正的超长名（13字）
- [ ] 新增 C3 DDD 合法人名测试分组
- [ ] 所有测试 PASS（0 failures）
- [ ] Git commit 已提交

---

## 3. 风险与回滚

| 风险 | 缓解 | 回滚方案 |
|------|------|----------|
| "问诊系统"等合法名被误杀（'系统'仍为包含匹配） | 记录为已知局限，后续升级为方案B | `git revert` 单次提交 |
| 现有测试忘记更新 | Step 2 中已逐个标注 | 同上 |

---

## 4. 工时估算

| 步骤 | 开发 | 测试 | 验证 | 合计 |
|------|------|------|------|------|
| 修改 DEFAULT_OPTIONS | 5min | 0 | 0 | 5min |
| 更新测试用例 | 10min | 5min | 0 | 15min |
| 运行测试套件 | 0 | 5min | 0 | 5min |
| Git 提交 | 5min | 0 | 0 | 5min |
| **总计** | **20min** | **10min** | **0** | **30min** |

---

*Architect: 实施计划产出时间 2026-03-26 20:50 UTC+8*
