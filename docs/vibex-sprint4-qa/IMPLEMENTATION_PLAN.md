# Implementation Plan — vibex-sprint4-qa（技术审查版）

**项目**: vibex-sprint4-qa
**版本**: v2.0
**日期**: 2026-04-18
**角色**: Architect（Technical Design + Eng Review）
**上游**: prd.md, architecture.md, vibex-sprint4-spec-canvas-extend/IMPLEMENTATION_PLAN.md

---

## 目标说明

本实现计划从 **QA 技术审查视角** 编写，核心问题是：
> `vibex-sprint4-spec-canvas-extend` 的技术方案是否可行？有哪些实现细节在 architecture.md 中被低估或遗漏？

**验收标准从"类型是否存在"改为"技术方案是否可行"**，包括接口兼容性、硬编码扩展成本、导出链路正确性。

---

## Unit Index

| Epic | Units | Priority | Status | Next |
|------|-------|----------|--------|------|
| E1: 类型系统 + 接口兼容性 | T1-T6 | P0 | 0/6 | T1 |
| E2: Exporter 技术可行性 | T7-T11 | P0 | 0/5 | T7 |
| E3: 硬编码扩展成本 | T12-T14 | P1 | 0/3 | T12 |
| E4: 架构完整性 | T15-T16 | P1 | 0/2 | T15 |

---

## E1: 类型系统 + 接口兼容性（P0）

### 验收标准（从"类型是否存在"改为"技术方案是否可行"）

| ID | Name | 验证方法 | 当前状态 | Gap |
|----|------|---------|---------|-----|
| T1 | ChapterType 含 `businessRules` | `grep "'businessRules'" src/types/dds/index.ts` | ❌ 4成员 | P0 |
| T2 | CardType 含 `state-machine` | `grep "'state-machine'" src/types/dds/index.ts` | ❌ 4成员 | P0 |
| T3 | state-machine.ts 文件存在 | `ls src/types/dds/state-machine.ts` | ❌ 不存在 | P0 |
| T4 | HTTPMethod 大小写兼容性 | `grep "toLowerCase\|toUpperCase" src/lib/contract/APICanvasExporter.ts` | N/A | P0 |
| T5 | DDSToolbar.CHAPTER_LABELS 含 5 条目 | `grep "businessRules" src/components/dds/toolbar/DDSToolbar.tsx` | ❌ 4条目 | P1 |
| T6 | DDSCanvasStore.initialChapters 含 5 chapters | `grep "businessRules" src/stores/dds/DDSCanvasStore.ts` | ❌ 4条目 | P1 |

### T1: ChapterType 含 `businessRules`（技术可行性）

**验证方法**: `grep "'businessRules'" src/types/dds/index.ts`

**当前状态**:
```bash
# 实际输出
export type ChapterType = 'requirement' | 'context' | 'flow' | 'api';
# ↑ 缺 'businessRules'
```

**验收**:
- AC1: `ChapterType` union 包含 `'businessRules'`
- AC2: 修改 `DDSToolbar.tsx` 后 TypeScript 编译通过（TS 编译器验证类型一致性）
- AC3: DDSToolbar.CHAPTER_LABELS 和 DDSCanvasStore.initialChapters 可引用 `'businessRules'`

---

### T2: CardType 含 `state-machine`（技术可行性）

**验证方法**: `grep "'state-machine'" src/types/dds/index.ts`

**当前状态**:
```bash
export type CardType = 'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint';
# ↑ 缺 'state-machine'
```

**验收**:
- AC1: `CardType` union 包含 `'state-machine'`
- AC2: `DDSCard` union 包含 `StateMachineCard`

---

### T3: state-machine.ts 类型文件存在（技术可行性）

**验证方法**: `ls src/types/dds/state-machine.ts`

**当前状态**: `ls` 返回 DIR_NOT_FOUND

**验收**:
- AC1: 文件存在且非空（`wc -l` > 0）
- AC2: 包含 `export interface StateMachineCard extends BaseCard`
- AC3: 包含 `export type StateMachineStateType = ...` 含 6 种状态
- AC4: `types/dds/index.ts` 导出 `StateMachineCard` 和 `StateMachineStateType`

---

### T4: HTTPMethod 大小写兼容性（技术可行性）

**问题**: `api-endpoint.ts` 定义 `HTTPMethod = 'GET'|'POST'|...`（大写），OpenAPIGenerator 期望小写。

**验证方法**: 单元测试（不等 grep）

```typescript
// test: APICanvasExporter 内部处理大小写
test('uppercase GET → lowercase get', () => {
  const card = { type: 'api-endpoint', id: '1', path: '/api/test',
    method: 'GET' as const };
  const spec = exportToOpenAPI([card]);
  expect(spec.paths['/api/test'].get).toBeDefined();  // 不是 .GET
});
```

**验收**:
- AC1: `exportToOpenAPI([{method:'GET'}])` 不崩溃
- AC2: `spec.paths['/api/test'].get` 存在（不是 undefined）
- AC3: `spec.paths['/api/test'].GET` 不存在

---

### T5: DDSToolbar.CHAPTER_LABELS 含 5 条目（扩展成本验证）

**验证方法**: `sed -n '21,26p' src/components/dds/toolbar/DDSToolbar.tsx`

**当前状态**: 4 个标签（缺 businessRules）

**验收**:
- AC1: `CHAPTER_LABELS['businessRules']` === `'业务规则'`
- AC2: 共 5 个键值对（修改后）
- AC3: 5 个 tab 按钮在 UI 上正确渲染

---

### T6: DDSCanvasStore.initialChapters 含 5 chapters（扩展成本验证）

**验证方法**: `sed -n '36,42p' src/stores/dds/DDSCanvasStore.ts`

**当前状态**: 4 个章节（缺 businessRules）

**验收**:
- AC1: `initialChapters['businessRules']` 存在
- AC2: `initialChapters['businessRules'].type === 'businessRules'`
- AC3: `initialChapters['businessRules'].cards === []`

---

## E2: Exporter 技术可行性（P0）

### 验收标准（方案C patch Spec 可行性）

| ID | Name | 验证方法 | Gap |
|----|------|---------|-----|
| T7 | APICanvasExporter 存在且导出路正确 | 单元测试 | P0 |
| T8 | JSON Schema string → object 转换 | 单元测试 | P0 |
| T9 | APIResponse.status number → string 转换 | 单元测试 | P1 |
| T10 | SMExporter 存在且导出正确 | 单元测试 | P0 |
| T11 | SMExporter 支持 initial + states 输出 | 单元测试 | P0 |

### T7: APICanvasExporter 存在且导出路正确（技术可行性）

**验证方法**: 单元测试（不等文件存在）

```typescript
test('T7-U1: 空数组导出空 paths', () => {
  const spec = exportToOpenAPI([]);
  expect(spec.paths).toEqual({});
});

test('T7-U2: GET /api/users 映射到 paths["/api/users"].get', () => {
  const card = { type: 'api-endpoint', id: '1', path: '/api/users',
    method: 'GET' as const, summary: 'List users' };
  const spec = exportToOpenAPI([card]);
  expect(spec.paths['/api/users'].get.summary).toBe('List users');
});

test('T7-U3: POST /api/orders 创建 post 节点', () => {
  const card = { type: 'api-endpoint', id: '1', path: '/api/orders',
    method: 'POST' as const };
  const spec = exportToOpenAPI([card]);
  expect(spec.paths['/api/orders'].post).toBeDefined();
});
```

**验收**:
- AC1: 文件存在（`ls src/lib/contract/APICanvasExporter.ts`）
- AC2: 导出函数存在且类型签名正确
- AC3: 上述 3 个测试用例全部通过

---

### T8: JSON Schema string → object 转换（技术可行性）

**问题**: `api-endpoint.ts` 中 `requestBody.schema` 是 string，OpenAPI schema 字段是 object。

**验证方法**: 单元测试

```typescript
test('T8-U1: requestBody.schema string 被解析', () => {
  const card = {
    type: 'api-endpoint', id: '1', path: '/api/users', method: 'POST' as const,
    requestBody: { contentType: 'application/json', schema: '{"type":"object"}' }
  };
  const spec = exportToOpenAPI([card]);
  expect(spec.paths['/api/users'].post.requestBody.content['application/json'].schema)
    .toEqual({ type: 'object' });
});

test('T8-U2: 非法 JSON 不崩溃', () => {
  const card = {
    type: 'api-endpoint', id: '1', path: '/api/test', method: 'post' as const,
    requestBody: { contentType: 'application/json', schema: '{invalid' }
  };
  expect(() => exportToOpenAPI([card])).not.toThrow();
});
```

**验收**:
- AC1: `APICanvasExporter.ts` 包含 `JSON.parse`
- AC2: T8-U1 测试通过
- AC3: T8-U2 测试通过（异常被捕获）
- AC4: 不导入 `z`（grep 验证）

---

### T9: APIResponse.status number → string 转换（P1）

**验证方法**: 单元测试

```typescript
test('T9-U1: status 200 → "200"', () => {
  const card = {
    type: 'api-endpoint', id: '1', path: '/api/test', method: 'get' as const,
    responses: [{ status: 200, description: 'OK' }]
  };
  const spec = exportToOpenAPI([card]);
  expect(spec.paths['/api/test'].get.responses['200'].description).toBe('OK');
});
```

**验收**:
- AC1: T9-U1 测试通过
- AC2: responses key 为字符串而非数字

---

### T10: SMExporter 存在且导出正确（技术可行性）

**验证方法**: 单元测试

```typescript
test('T10-U1: 导出初始状态', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'initial' }] as StateMachineCard[];
  const sm = exportToStateMachine(nodes, []);
  expect(sm.initial).toBe('Idle');
});

test('T10-U2: 正常状态导出', () => {
  const nodes = [{ id: 's1', stateId: 'Active', stateType: 'normal' }] as StateMachineCard[];
  const sm = exportToStateMachine(nodes, []);
  expect(sm.states['Active']).toBeDefined();
});
```

**验收**:
- AC1: 文件存在（`ls src/lib/stateMachine/SMExporter.ts`）
- AC2: 导出函数存在
- AC3: T10-U1 和 T10-U2 通过

---

### T11: SMExporter 支持 initial + states 输出（P0）

**验证方法**: 单元测试

```typescript
test('T11-U1: 有 initial 节点', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'initial' }] as StateMachineCard[];
  const sm = exportToStateMachine(nodes, []);
  expect(sm.initial).toBe('Idle');
});

test('T11-U2: 无 initial 节点', () => {
  const nodes = [{ id: 's1', stateId: 'Active', stateType: 'normal' }] as StateMachineCard[];
  const sm = exportToStateMachine(nodes, []);
  expect(sm.initial).toBeUndefined();
});

test('T11-U3: 转移映射', () => {
  const nodes = [
    { id: 's1', stateId: 'Idle', stateType: 'initial' },
    { id: 's2', stateId: 'Active', stateType: 'normal' },
  ] as StateMachineCard[];
  const edges = [{ id: 'e1', source: 's1', target: 's2', label: 'START' }] as SMExporterEdge[];
  const sm = exportToStateMachine(nodes, edges);
  expect(sm.states['Idle'].on['START'].target).toBe('Active');
});
```

**验收**:
- AC1: T11-U1/U2/U3 全部通过
- AC2: `sm.states` 是 object（可 JSON.stringify）

---

## E3: 硬编码扩展成本（P1）

| ID | Name | 验证方法 | Gap |
|----|------|---------|-----|
| T12 | CHAPTER_ORDER 扩展为 5 | `grep "businessRules" DDSScrollContainer.tsx` | P1 |
| T13 | DDSToolbar 5 章节按钮渲染 | 单元测试 | P1 |
| T14 | CrossChapterEdgesOverlay 5 栏无崩溃 | 集成测试 | P1 |

### T12: DDSScrollContainer.CHAPTER_ORDER 扩展（P1）

**验证方法**: `sed -n '33,35p' src/components/dds/canvas/DDSScrollContainer.tsx`

**当前状态**: 4 个章节（缺 businessRules）

**验收**:
- AC1: CHAPTER_ORDER 包含 `'businessRules'`
- AC2: 共 5 个成员
- AC3: DDSScrollContainer 渲染 5 栏布局

---

### T13: DDSToolbar 5 章节按钮渲染（P1）

**验收方法**: 快照测试或 `screen.getAllByRole('button')`

```typescript
test('T13-U1: 渲染 5 个章节按钮', () => {
  render(<DDSToolbar />);
  expect(screen.getAllByRole('button')).toHaveLength(5);
});

test('T13-U2: 切换到 businessRules', async () => {
  render(<DDSToolbar />);
  const brBtn = screen.getByRole('button', { name: /业务规则/ });
  await userEvent.click(brBtn);
  expect(useDDSCanvasStore.getState().activeChapter).toBe('businessRules');
});
```

**验收**: T13-U1 和 T13-U2 通过

---

### T14: CrossChapterEdgesOverlay 5 栏无崩溃（P1）

**验证方法**: 集成测试

```typescript
test('T14-U1: businessRules 章节跨章节边不崩溃', () => {
  const edge = { id: 'e1', source: 'sm1', target: 'bc1',
    sourceChapter: 'businessRules' as ChapterType,
    targetChapter: 'context' as ChapterType };
  expect(() => renderEdge(edge)).not.toThrow();
});
```

---

## E4: 架构完整性（P1）

| ID | Name | 验证方法 | Gap |
|----|------|---------|-----|
| T15 | 5 章节横向滚动性能 | 性能基准测试 | P1 |
| T16 | DDSToolbar exportToJSON 含 api/businessRules | 集成测试 | P1 |

### T15: 5 章节性能基准测试（P1）

**验证方法**: 创建 50 个节点场景，测量渲染时间

**验收**:
- AC1: 5 章节下渲染时间 < 500ms（Chrome DevTools Performance）
- AC2: 无内存泄漏（console 无警告）

---

### T16: DDSToolbar exportToJSON 含 api/businessRules（P1）

**验证方法**: `grep "businessRules" DDSToolbar.tsx`

**当前状态**: 不含

**验收**:
- AC1: `handleExport()` 包含 `chapters.api` 和 `chapters.businessRules`
- AC2: 导出 JSON 包含 api 和 businessRules 数据

---

## 执行决策

- **决策**: 待评审（需要修改）
- **前置条件**: E1 P0 类型扩展完成后才能验证 E2-E3
- **执行项目**: vibex-sprint4-qa
- **执行日期**: 待定
- **审查结论**: ❌ 需要修改
