# PRD: vibex-bc-filter-fix-20260326

## Bounded Contexts Filter 过度过滤问题修复

---

## 1. 执行摘要

### 背景
`bounded-contexts-filter.ts` 的 `forbiddenNames` 包含 `'管理'`，会将所有中文 DDD 合法领域名称（如"患者管理"、"订单管理"、"医生管理"）全部误杀，导致 `filterInvalidContexts()` 返回空数组。实测误杀率达 50-70%，用户看到"无限界上下文"错误。

### 目标
修复过度过滤问题，实现：
1. 移除 '管理' 的误杀（DDD 合法后缀）
2. 调整 maxNameLength 支持更长合法名称
3. 保留对真正无意义词汇的过滤

### 成功指标

| 指标 | 目标值 |
|------|--------|
| DDD 合法人名误杀率 | 0%（患者管理/订单管理等通过） |
| 真正无效名称过滤率 | 100%（测试/XX模块/某某平台） |
| maxNameLength 支持 | 8 字中文名称（如"在线预约管理系统"） |
| API 返回非空率 | 100%（健康输入） |
| 实施工时 | ≤ 30 分钟 |

---

## 2. 功能需求

### F1: 修复 DEFAULT_OPTIONS 过度过滤

#### F1.1 移除 '管理' from forbiddenNames
- **文件**: `vibex-backend/src/lib/bounded-contexts-filter.ts`
- **修改**: 将 `forbiddenNames: ['管理', '系统', '模块', '功能', '平台']` 改为 `forbiddenNames: ['系统', '模块', '功能', '平台']`
- **验收标准**:
  ```typescript
  // DDD 合法人名不应被过滤
  const dddValid = ['患者管理', '订单管理', '医生管理', '问诊管理', '认证授权'];
  for (const name of dddValid) {
    expect(isNameFiltered(name)).toBe(false);
  }
  ```

#### F1.2 调整 maxNameLength
- **修改**: `maxNameLength: 10 → 12`，支持更长合法名称
- **验收标准**:
  ```typescript
  // 8 字中文名称应通过
  expect(isNameFiltered('在线预约管理系统')).toBe(false); // 8 字 < 12
  // 12 字应通过
  expect(isNameFiltered('在线预约管理系统项目')).toBe(false); // 12 字 = 12
  // 13 字应过滤
  expect(isNameFiltered('在线预约管理系统项目啊')).toBe(true); // 13 字 > 12
  ```

#### F1.3 保留真正无效词过滤
- **保留**: `'系统'`, `'模块'`, `'功能'`, `'平台'`
- **验收标准**:
  ```typescript
  // 真正无意义的名称应被过滤
  expect(isNameFiltered('测试系统')).toBe(true);
  expect(isNameFiltered('XX模块')).toBe(true);
  expect(isNameFiltered('某某平台')).toBe(true);
  expect(isNameFiltered('核心功能')).toBe(true);
  // 但 "支付系统" 作为业务名仍通过（'系统' 不在后缀位置精确匹配时用方案A会有问题，见F1.4）
  ```

#### F1.4 方案 A 局限性与缓解
- **问题**: 移除 '管理' 后，`'系统'` 仍以包含匹配，会误杀"问诊系统"等合法业务名
- **缓解**: 考虑改为精确后缀匹配（见方案 B），或评估"系统"是否应移除
- **验收标准**:
  ```typescript
  // 方案A: '系统'仍为包含匹配，以下为预期行为
  // expect(isNameFiltered('问诊系统')).toBe(true);  // 方案A下会误杀，标注为已知问题
  // 方案B下应通过: expect(isNameFiltered('问诊系统')).toBe(false);
  ```

---

### F2: 补充 DDD 合法人名测试用例

#### F2.1 单元测试：C3 分组
- **文件**: `bounded-contexts-consistency.test.ts` 或新建 `bounded-contexts-filter.test.ts`
- **验收标准**:
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
  });
  ```

#### F2.2 单元测试：长度边界
- **验收标准**:
  ```typescript
  describe('C4: maxNameLength=12 边界测试', () => {
    test('7 字名称应通过', () => {
      expect(isNameFiltered('患者管理系统')).toBe(false);
    });
    test('8 字名称应通过', () => {
      expect(isNameFiltered('在线预约系统')).toBe(false);
    });
    test('12 字名称应通过', () => {
      expect(isNameFiltered('在线问诊管理系统')).toBe(false);
    });
    test('13 字名称应过滤', () => {
      expect(isNameFiltered('在线问诊管理系统1')).toBe(true);
    });
  });
  ```

#### F2.3 集成测试：API 返回非空
- **验收标准**:
  ```typescript
  test('健康输入 API 返回非空 contexts', async () => {
    const result = await callAPI('POST', '/api/canvas/generate-contexts', {
      requirementText: '开发一个在线预约医生系统',
    });
    const contexts = extractContexts(result);
    expect(contexts.length).toBeGreaterThan(0);
  });
  ```

---

### F3: 回归测试（确保不破坏其他逻辑）

#### F3.1 现有测试通过
- **验证**: `bounded-contexts-filter.ts` 现有测试用例全部通过
- **验收标准**:
  ```typescript
  // 运行现有测试套件
  const results = runTests('bounded-contexts-filter.test.ts', 'bounded-contexts-consistency.test.ts');
  expect(results.failureCount).toBe(0);
  ```

#### F3.2 coreRatio 过滤不变
- **验证**: minCoreRatio / maxCoreRatio 逻辑未受影响
- **验收标准**:
  ```typescript
  // 全 core 应被过滤（ratio = 1.0 > maxCoreRatio = 0.7）
  const allCore = [{ name: 'A', type: 'core' }, { name: 'B', type: 'core' }];
  expect(filterInvalidContexts(allCore).length).toBe(0);
  ```

---

## 3. Epic 拆分

### Epic 1: DEFAULT_OPTIONS 修复（P0）
**Stories**:
- S1.1 移除 `'管理'` from forbiddenNames
- S1.2 调整 maxNameLength: 10 → 12
- S1.3 验证真正无效词仍被过滤（系统/模块/功能/平台）

**验收**: DDD 合法人名误杀率 = 0%，无效词过滤率 = 100%

---

### Epic 2: 补充测试用例（P0）
**Stories**:
- S2.1 补充 C3 分组：DDD 合法人名测试
- S2.2 补充 C4 分组：maxNameLength 边界测试
- S2.3 补充 API 集成测试

**验收**: 新增测试用例 100% 通过

---

### Epic 3: 回归验证（P0）
**Stories**:
- S3.1 现有测试套件 100% 通过
- S3.2 coreRatio 过滤逻辑验证

**验收**: 零回归失败

---

## 4. 非功能需求

| NFR | 要求 |
|-----|------|
| 性能 | 过滤函数执行 < 1ms（无额外性能损失） |
| 兼容性 | 现有测试不破坏 |
| 安全性 | 过滤规则不能被 prompt 注入绕过 |

---

## 5. 验收标准总览

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | 患者管理/订单管理等不被过滤 | 单元测试 |
| P0 | '测试系统'/'XX模块' 被过滤 | 单元测试 |
| P0 | 8 字中文名称通过（maxNameLength=12） | 单元测试 |
| P0 | API 返回 contexts.length > 0 | 集成测试 |
| P0 | 现有测试 0 回归失败 | 测试套件 |
| P1 | coreRatio 逻辑未受影响 | 单元测试 |

---

## 6. DoD

**Epic 完成的充要条件**:
1. ✅ `bounded-contexts-filter.ts` 中 DEFAULT_OPTIONS 已修复
2. ✅ 新增 DDD 合法人名测试用例通过
3. ✅ 新增长度边界测试用例通过
4. ✅ 现有测试套件 0 回归失败
5. ✅ Git commit 已提交

---

## 7. 依赖项

| 依赖 | 说明 |
|------|------|
| `bounded-contexts-filter.ts` | 待修复文件 |
| `bounded-contexts-consistency.test.ts` | 现有测试文件 |
| Jest | 测试框架 |

---

## 8. Out of Scope

- 重构过滤为 suffix/prefix 精确匹配（方案 B，留作后续优化）
- 修改 AI prompt（属于 `vibex-bc-prompt-optimize-20260326` 项目）
- 白名单/评分机制（过度设计）
