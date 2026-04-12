# Spec: matchFlowNode 单元测试规格

**关联 PRD**: F1.5（单元测试覆盖）
**关联 Story**: S1.4
**关联验收标准**: AC4.1、AC4.2

---

## 概述

`matchFlowNode()` 当前缺少单元测试覆盖，改动风险高且无回归保护。本规格定义完整的单元测试规范，覆盖 L1/L2/L3 匹配路径、边界情况、回归场景，确保测试覆盖率 ≥ 80%。

测试框架选用项目现有方案（Vitest / Jest，以代码库实际配置为准）。

---

## 详细设计

### 测试文件位置

```
src/components/canvas/__tests__/
├── matchFlowNode.test.ts    ← matchFlowNode 单元测试
├── isCommonComponent.test.ts ← 通用组件判断测试
└── getComponentGroup.test.ts ← 组件分组集成测试
```

### 测试覆盖范围

| 测试类别 | 覆盖场景 | 优先级 |
|----------|----------|--------|
| L1 精确匹配 | nodeId 完全相等 | P0 |
| L2 Prefix 匹配 | flowId 为 nodeId 前缀 | P0 |
| L3 名称匹配 | flowId 与 node.name 模糊匹配 | P0 |
| 边界情况 | 空输入、null、undefined | P0 |
| 优先级验证 | 精确 > prefix > 名称 | P0 |
| 通用组件保护 | flowId='common' 不走 L2/L3 | P0 |
| 性能/回归 | 大列表匹配、重复调用 | P1 |

### Mock 数据

```typescript
const flowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-login-001', name: '登录流程' },
  { nodeId: 'flow-order-002', name: '订单管理' },
  { nodeId: 'flow-profile-003', name: '个人中心' },
  { nodeId: 'LOGIN_FLOW_ID', name: 'LOGIN_FLOW' },
];

const commonFlowNodes: BusinessFlowNode[] = [
  { nodeId: 'a', name: 'A' },
  { nodeId: 'ab', name: 'AB' },
  { nodeId: 'abc', name: 'ABC' },
];
```

---

## API/接口

### 测试用例模板

```typescript
import { describe, it, expect } from 'vitest';
import { matchFlowNode } from '../matchFlowNode';
import type { BusinessFlowNode } from '../types';
```

---

## 实现步骤

1. **创建测试文件**
   - `__tests__/matchFlowNode.test.ts`
   - `__tests__/isCommonComponent.test.ts`
   - `__tests__/getComponentGroup.test.ts`

2. **实现 L1 精确匹配测试用例**

3. **实现 L2 Prefix 匹配测试用例**

4. **实现 L3 名称匹配测试用例**

5. **实现边界情况测试用例**

6. **实现优先级验证测试用例**

7. **执行覆盖率报告**
   - `npx vitest --coverage` 或 `npx jest --coverage`
   - 确认行覆盖率 ≥ 80%

---

## 验收测试

> 引用 PRD 验收标准：AC4.1、AC4.2

### AC4.1: 覆盖 ≥ 80% 分支路径

```typescript
// ✅ 测试覆盖率断言（需在 CI 中验证）
// 运行: vitest --coverage
// 期望: matchFlowNode 覆盖率 ≥ 80%

// === L1 精确匹配 ===

describe('L1: 精确匹配', () => {
  it('flowId === nodeId 时匹配成功', () => {
    const result = matchFlowNode('flow-login-001', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.node.nodeId).toBe('flow-login-001');
    expect(result!.matchLevel).toBe('exact');
  });

  it('flowId 不存在于列表时返回 null', () => {
    const result = matchFlowNode('flow-nonexist', flowNodes);
    expect(result).toBeNull();
  });

  it('flowId 大小写敏感（严格相等）', () => {
    const result = matchFlowNode('FLOW-LOGIN-001', flowNodes);
    expect(result).toBeNull(); // 不匹配小写的 nodeId
  });
});

// === L2 Prefix 匹配 ===

describe('L2: Prefix 前缀匹配', () => {
  it('flowId 为 nodeId 前缀时匹配成功', () => {
    const result = matchFlowNode('flow-login', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.node.nodeId).toBe('flow-login-001');
    expect(result!.matchLevel).toBe('prefix');
  });

  it('flowId 完全等于 nodeId 时走 L1，不走 L2', () => {
    const result = matchFlowNode('flow-login-001', flowNodes);
    expect(result!.matchLevel).toBe('exact');
  });

  it('多个 nodeId 前缀相同，取第一个（按 nodeId 升序）', () => {
    const result = matchFlowNode('flow', commonFlowNodes);
    expect(result!.node.nodeId).toBe('a'); // 'a' < 'ab' < 'abc'
    expect(result!.matchLevel).toBe('prefix');
  });

  it('flowId 比 nodeId 长时不走 prefix', () => {
    const result = matchFlowNode('flow-login-001-extra', flowNodes);
    expect(result).toBeNull(); // 'flow-login-001-extra' 不是任何 nodeId 的前缀
  });
});

// === L3 名称模糊匹配 ===

describe('L3: 名称模糊匹配', () => {
  it('flowId 包含在 node.name 中时匹配成功', () => {
    const result = matchFlowNode('登录流程', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.node.name).toBe('登录流程');
    expect(result!.matchLevel).toBe('name');
  });

  it('flowId 与 node.name 交叉包含时匹配成功', () => {
    const result = matchFlowNode('login-flow', flowNodes);
    expect(result).not.toBeNull();
    expect(['flow-login-001', 'LOGIN_FLOW_ID']).toContain(result!.node.nodeId);
    expect(result!.matchLevel).toBe('name');
  });

  it('名称匹配大小写不敏感', () => {
    const result = matchFlowNode('LOGIN FLOW', flowNodes);
    expect(result).not.toBeNull();
    expect(result!.matchLevel).toBe('name');
  });
});

// === 优先级验证 ===

describe('优先级: exact > prefix > name', () => {
  it('同时满足 L1 和 L2 时，优先 L1', () => {
    // 'flow-login-001' 完全相等（L1）
    // 也是 'flow-login-001-extra' 的前缀（L2 不可能，因为 001 比 extra 短）
    // 实际测试：flowId='flow-login'，精确无匹配，走 L2
    const result = matchFlowNode('flow-login', flowNodes);
    expect(result!.matchLevel).toBe('prefix');

    // 精确匹配
    const result2 = matchFlowNode('flow-login-001', flowNodes);
    expect(result2!.matchLevel).toBe('exact');
  });

  it('L1 失败后走 L2，L2 失败后走 L3', () => {
    // 'xyz' 不精确匹配，不 prefix 匹配，不 name 匹配
    const result = matchFlowNode('xyz', flowNodes);
    expect(result).toBeNull();
  });
});
```

### AC4.2: 边界情况不抛异常

```typescript
// === 边界情况 ===

describe('边界情况', () => {
  it('flowId 为空字符串时返回 null，不抛异常', () => {
    expect(() => {
      matchFlowNode('', flowNodes);
    }).not.toThrow();
    expect(matchFlowNode('', flowNodes)).toBeNull();
  });

  it('flowNodes 为空数组时返回 null，不抛异常', () => {
    expect(() => {
      matchFlowNode('flow-login-001', []);
    }).not.toThrow();
    expect(matchFlowNode('flow-login-001', [])).toBeNull();
  });

  it('flowId 为 undefined 时返回 null，不抛异常', () => {
    expect(() => {
      // @ts-expect-error 测试非期望输入
      matchFlowNode(undefined, flowNodes);
    }).not.toThrow();
  });

  it('flowNodes 含 undefined/null 节点时跳过', () => {
    const mixedFlowNodes: BusinessFlowNode[] = [
      undefined as any,
      { nodeId: 'flow-login-001', name: '登录流程' },
      null as any,
    ];
    const result = matchFlowNode('flow-login-001', mixedFlowNodes);
    expect(result).not.toBeNull();
    expect(result!.node.nodeId).toBe('flow-login-001');
  });
});
```

### AC4.1: 覆盖率扩展测试

```typescript
// === 通用组件保护 ===

describe('通用组件保护', () => {
  it("flowId='common' 返回 null（ComponentTree 侧处理 isCommon）", () => {
    const result = matchFlowNode('common', flowNodes);
    expect(result).toBeNull(); // matchFlowNode 不处理 common，保护上游调用
  });
});

// === 性能/回归测试 ===

describe('性能/回归', () => {
  it('大量 flowNodes 时匹配正确', () => {
    const largeFlowNodes: BusinessFlowNode[] = Array.from(
      { length: 1000 },
      (_, i) => ({
        nodeId: `flow-${i.toString().padStart(4, '0')}`,
        name: `页面${i}`,
      })
    );

    const result = matchFlowNode('flow-0001', largeFlowNodes);
    expect(result).not.toBeNull();
    expect(result!.node.nodeId).toBe('flow-0001');
    expect(result!.matchLevel).toBe('exact');
  });

  it('重复调用 matchFlowNode 不累积副作用', () => {
    matchFlowNode('flow-login-001', flowNodes);
    matchFlowNode('flow-order-002', flowNodes);
    matchFlowNode('flow-login-001', flowNodes);

    // 不抛异常，结果一致
    const result = matchFlowNode('flow-login-001', flowNodes);
    expect(result!.node.nodeId).toBe('flow-login-001');
  });
});
```

### isCommonComponent 测试

```typescript
import { isCommonComponent } from '../ComponentTree';
import type { CanvasComponent } from '../types';

describe('isCommonComponent', () => {
  it('type=modal 返回 true', () => {
    const comp: CanvasComponent = { id: '1', name: '弹窗', type: 'modal', flowId: 'x' };
    expect(isCommonComponent(comp)).toBe(true);
  });

  it('type=Button（大写）返回 true', () => {
    const comp: CanvasComponent = { id: '1', name: '按钮', type: 'Button', flowId: 'x' };
    expect(isCommonComponent(comp)).toBe(true);
  });

  it('type=form 返回 false', () => {
    const comp: CanvasComponent = { id: '1', name: '表单', type: 'form', flowId: 'x' };
    expect(isCommonComponent(comp)).toBe(false);
  });

  it('flowId=common 但 type 非白名单也返回 true', () => {
    const comp: CanvasComponent = { id: '1', name: '组件', type: 'custom', flowId: 'common' };
    expect(isCommonComponent(comp)).toBe(true);
  });
});
```

---

## 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 测试覆盖率 ≥ 80% 目标未达成 | 中 | 补充边界测试用例；分析未覆盖分支针对性补充 |
| 测试数据与生产数据不一致导致漏测 | 中 | 覆盖空值、null、undefined 等边界；定期同步 mock 数据 |
| 测试使用 mock 数据，未覆盖真实 AI flowId 格式 | 低 | 增加实际数据采样；可通过 dogfood 测试验证 |
| 测试执行慢影响 CI 体验 | 低 | 控制 flowNodes mock 数量；Vitest/Jest 缓存 |
