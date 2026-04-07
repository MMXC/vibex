# PRD: vibex-bc-prompt-optimize-20260326

## DDD Bounded Contexts AI 生成质量优化

---

## 1. 执行摘要

### 背景
当前两处限界上下文生成 prompt（P1: generate-contexts / P2: analyze/stream）均缺少真实示例和中文语境指导，导致 AI 生成结果名称泛化、边界不清、core 占比过高（90%）。核心问题：无 Few-shot 示例、无中文边界标准、无类型判断规则、无 Ubiquitous Language 要求。

### 目标
优化两处 DDD bounded contexts 生成 prompt，实现：
1. 统一 Prompt 模板（含真实示例 + 中文语境）
2. 两处 API 生成结果一致
3. 上下文类型分布合理（core 40-70%）
4. 输出包含 Ubiquitous Language

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 上下文数量（复杂需求） | ≥ 5 个 |
| core 类型占比 | 40% - 70% |
| 无效名称过滤率 | 100%（"管理/系统/模块"等） |
| 两接口结果一致性 | ≥ 90% |
| 实施工时 | ≤ 3 小时 |

---

## 2. 功能需求

### F1: 统一 Prompt 模板

#### F1.1 创建 prompts/bounded-contexts.ts
- **文件**: `vibex-backend/src/lib/prompts/bounded-contexts.ts`（新建）
- **内容**: 包含完整的 DDD 专家角色定义、中文边界判断标准、真实行业示例（医疗/电商）
- **导出**: `BOUNDED_CONTEXTS_PROMPT` 模板
- **验收标准**:
  ```typescript
  expect(typeof BOUNDED_CONTEXTS_PROMPT).toBe('string');
  expect(BOUNDED_CONTEXTS_PROMPT).toContain('DDD');
  expect(BOUNDED_CONTEXTS_PROMPT).toContain('Core');
  expect(BOUNDED_CONTEXTS_PROMPT).toContain('ubiquitousLanguage');
  expect(BOUNDED_CONTEXTS_PROMPT).toContain('在线医生问诊系统'); // 含真实示例
  ```

#### F1.2 Prompt 结构要求
必须包含以下章节：
1. 角色定义：资深 DDD 专家，服务中文互联网团队
2. 判断标准：Core/Supporting/Generic/External 的中文定义 + 判断标准
3. 真实示例：在线医生问诊系统的输入输出示例
4. 坏示例：边界重叠的反面教材
5. 输出格式：JSON 字段说明（name, type, description, ubiquitousLanguage）

#### F1.3 验收标准:
```typescript
// 结构完整性验证
const sections = ['角色定义', '判断标准', '真实示例', '输出格式'];
for (const section of sections) {
  expect(BOUNDED_CONTEXTS_PROMPT).toContain(section);
}
// 示例完整性
expect(BOUNDED_CONTEXTS_PROMPT).toContain('在线医生问诊系统');
expect(BOUNDED_CONTEXTS_PROMPT).toContain('core');
expect(BOUNDED_CONTEXTS_PROMPT).toContain('supporting');
expect(BOUNDED_CONTEXTS_PROMPT).toContain('generic');
expect(BOUNDED_CONTEXTS_PROMPT).toContain('external');
```

---

### F2: 更新 generate-contexts API

#### F2.1 替换 USER_PROMPT
- **文件**: `vibex-backend/src/app/api/canvas/generate-contexts/route.ts`
- **修改**: 删除内联 USER_PROMPT，改为导入 `BOUNDED_CONTEXTS_PROMPT`
- **验收标准**:
  ```typescript
  // 代码审查验证
  const fileContent = readFile('route.ts');
  expect(fileContent).not.toContain('每个上下文有明确的业务边界');
  expect(fileContent).toContain("import { BOUNDED_CONTEXTS_PROMPT }");
  expect(fileContent).toContain('BOUNDED_CONTEXTS_PROMPT.replace');
  ```

#### F2.2 调用方式
```typescript
const prompt = BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', requirementText);
```

#### F2.3 验收标准:
```typescript
// 集成测试：复杂需求生成上下文
const result = await callAPI('POST', '/api/canvas/generate-contexts', {
  requirementText: '开发一个在线预约医生系统'
});
const contexts = JSON.parse(result).boundedContexts ?? JSON.parse(result);
expect(contexts.length).toBeGreaterThanOrEqual(5);
expect(contexts[0]).toHaveProperty('name');
expect(contexts[0]).toHaveProperty('type');
expect(contexts[0]).toHaveProperty('description');
expect(contexts[0]).toHaveProperty('ubiquitousLanguage');
```

---

### F3: 更新 analyze/stream API

#### F3.1 替换内联 planPrompt
- **文件**: `vibex-backend/src/app/api/v1/analyze/stream/route.ts`
- **修改**: 删除内联 planPrompt，改为导入 `BOUNDED_CONTEXTS_PROMPT`
- **验收标准**:
  ```typescript
  const fileContent = readFile('route.ts');
  expect(fileContent).not.toContain('你是一个DDD专家');
  expect(fileContent).toContain("import { BOUNDED_CONTEXTS_PROMPT }");
  ```

#### F3.2 SSE 事件中的 boundedContexts
- 后端解析 AI 响应，提取 boundedContexts 数组（见 `vibex-step-context-fix-20260326`）
- **验收标准**:
  ```typescript
  // SSE 解析测试
  const event = parseSSEEvent(rawSSE);
  expect(event.type).toBe('step_context');
  if (event.boundedContexts) {
    expect(Array.isArray(event.boundedContexts)).toBe(true);
    expect(event.boundedContexts.length).toBeGreaterThanOrEqual(3);
  }
  ```

---

### F4: 生成后处理过滤

#### F4.1 无效名称过滤
- **过滤规则**:
  - 名称长度 < 2 或 > 10 字符
  - 名称含禁用词：["管理", "系统", "模块", "功能", "平台"]
- **验收标准**:
  ```typescript
  // 单元测试：过滤规则
  const forbidden = ['患者管理系统', '订单管理', '模块', '功能', '测试平台'];
  const valid = ['患者管理', '医生管理', '问诊', '挂号'];
  
  for (const name of forbidden) {
    const isFiltered = isNameFiltered(name);
    expect(isFiltered).toBe(true); // 全部应被过滤
  }
  for (const name of valid) {
    const isFiltered = isNameFiltered(name);
    expect(isFiltered).toBe(false); // 全部应保留
  }
  ```

#### F4.2 类型分布验证
- **规则**: core 占比应在 40%-70% 之间
- **验收标准**:
  ```typescript
  // 统计测试
  const result = await generateContexts('在线医生问诊系统');
  const contexts = result.boundedContexts;
  const coreCount = contexts.filter(c => c.type === 'core').length;
  const ratio = coreCount / contexts.length;
  expect(ratio).toBeGreaterThanOrEqual(0.4);
  expect(ratio).toBeLessThanOrEqual(0.7);
  ```

---

### F5: 两接口一致性验证

#### F5.1 集成测试
- **输入**: 同一需求（"开发一个员工考勤系统"）
- **API1**: `POST /api/canvas/generate-contexts`
- **API2**: `POST /api/v1/analyze/stream`（提取 step_context 事件中的 boundedContexts）
- **验收标准**:
  ```typescript
  const input = '我要开发一个员工考勤系统';
  const [result1, result2] = await Promise.all([
    callAPI('/api/canvas/generate-contexts', { requirementText: input }),
    callStreamAPI('/api/v1/analyze/stream', { requirement: input }),
  ]);
  const contexts1 = extractContexts(result1);
  const contexts2 = result2.step_context?.boundedContexts;
  
  // 数量差异 ≤ 2
  expect(Math.abs(contexts1.length - contexts2.length)).toBeLessThanOrEqual(2);
  
  // core 类型数量一致
  const core1 = contexts1.filter(c => c.type === 'core').length;
  const core2 = contexts2.filter(c => c.type === 'core').length;
  expect(core1).toBe(core2);
  ```

---

## 3. Epic 拆分

### Epic 1: 统一 Prompt 模板（P0）
**Stories**:
- S1.1 创建 `src/lib/prompts/bounded-contexts.ts`，包含完整 Prompt
- S1.2 Prompt 包含角色定义、中文判断标准、真实示例
- S1.3 导出格式通过单元测试验证

**验收**: `prompts/bounded-contexts.ts` 存在，4 个结构章节完整

---

### Epic 2: 更新 generate-contexts API（P0）
**Stories**:
- S2.1 替换 USER_PROMPT 为 `BOUNDED_CONTEXTS_PROMPT`
- S2.2 集成测试验证：复杂需求生成 ≥ 5 个上下文
- S2.3 验证 ubiquitousLanguage 字段存在

**验收**: API 返回上下文含 ubiquitousLanguage，复杂需求 ≥ 5 个

---

### Epic 3: 更新 analyze/stream API（P0）
**Stories**:
- S3.1 替换内联 planPrompt
- S3.2 SSE 事件包含 boundedContexts 数组
- S3.3 验证与 generate-contexts 类型一致

**验收**: SSE 事件含 boundedContexts，与另一接口类型一致

---

### Epic 4: 后处理过滤（P0）
**Stories**:
- S4.1 实现无效名称过滤（禁用词 + 长度）
- S4.2 实现 core 占比验证（40%-70%）
- S4.3 单元测试覆盖过滤规则

**验收**: 过滤率 100%，core 占比在目标范围

---

### Epic 5: 两接口一致性验证（P0）
**Stories**:
- S5.1 编写集成测试对比两接口输出
- S5.2 验证数量差异 ≤ 2，core 数量一致

**验收**: 一致性测试 100% 通过

---

## 4. UI/UX 流程

> 本次优化为后端 API 层面改动，不涉及 UI 变更。
> 但 prompt 优化后，AI 生成质量提升会间接改善用户体验（画布节点名称更准确）

```
用户提交需求 → 后端调用 LLM → 使用优化后的 Prompt
        ↓
LLM 生成 boundedContexts（含 ubiquitousLanguage）
        ↓
后处理过滤无效名称
        ↓
验证 core 占比
        ↓
返回给前端 → 画布展示真实上下文节点
```

---

## 5. 非功能需求

| NFR | 要求 |
|-----|------|
| Token 消耗 | Prompt 优化后 token 略有增加，maxTokens 调至 3072 |
| 响应时间 | 生成时间增加 < 1 秒 |
| 兼容性 | 现有测试失败时调低 temperature（0.7→0.6） |

---

## 6. 验收标准总览

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | Prompt 模板 4 章节完整 | 单元测试 |
| P0 | 复杂需求生成 ≥ 5 个上下文 | API 集成测试 |
| P0 | core 占比 40%-70% | 统计测试 |
| P0 | 无效名称 100% 过滤 | 单元测试 |
| P0 | 两接口结果一致（差异 ≤ 2） | 集成测试 |
| P0 | ubiquitousLanguage 字段存在 | API 测试 |
| P1 | maxTokens 调整不影响质量 | 对比测试 |

---

## 7. DoD

**Epic 完成的充要条件**:
1. ✅ `src/lib/prompts/bounded-contexts.ts` 已创建并通过格式验证
2. ✅ 两处 API 均已替换为统一模板
3. ✅ 所有单元测试 + 集成测试通过
4. ✅ 后处理过滤规则 100% 覆盖
5. ✅ 两接口一致性测试通过
6. ✅ Git commit 已提交

---

## 8. 依赖项

| 依赖 | 说明 |
|------|------|
| `vibex-step-context-fix-20260326` | analyze/stream 的 boundedContexts SSE 传递 |
| LLM API (GPT-4o) | 生成质量依赖模型能力 |
| Jest | 单元测试 + 集成测试 |

---

## 9. Out of Scope

- 修改 AI 模型（不换模型）
- 前端 UI 变更
- 其他 prompt 优化（如 entity extraction、flow analysis）
- Prompt A/B 测试框架
