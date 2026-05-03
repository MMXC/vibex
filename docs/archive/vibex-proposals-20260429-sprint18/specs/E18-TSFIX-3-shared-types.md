# Spec: E18-TSFIX-3 — 类型基础设施加固

## 概述

建立 shared types 模块、type utilities、类型守卫，提升全局类型质量，为 E3-U2/U3 提供共享类型基础。

## 目标

在 `src/types/shared/` 下建立统一的共享类型定义，消除跨模块的类型重复定义。

## 实现方案

### 目录结构

```
src/types/
├── shared/
│   ├── index.ts          # 统一导出
│   ├── session.ts        # Session 相关类型
│   ├── config.ts         # Config 相关类型
│   ├── response.ts       # Response 相关类型
│   ├── guards.ts         # 类型守卫
│   └── utilities.ts      # 类型工具
└── index.ts
```

### 共享类型定义

```ts
// src/types/shared/session.ts
export interface BaseSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'terminated';
}

export interface E3U2Session extends BaseSession {
  module: 'e3-u2';
  metadata?: Record<string, unknown>;
}

export interface E3U3Session extends BaseSession {
  module: 'e3-u3';
  priority?: number;
}

// 联合类型
export type Session = E3U2Session | E3U3Session;
```

### 类型守卫

```ts
// src/types/shared/guards.ts
export function isSession(obj: unknown): obj is Session {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'module' in obj;
}

export function isE3U2Session(obj: unknown): obj is E3U2Session {
  return isSession(obj) && (obj as Session).module === 'e3-u2';
}

export function isE3U3Session(obj: unknown): obj is E3U3Session {
  return isSession(obj) && (obj as Session).module === 'e3-u3';
}
```

## 验收标准（逐条 expect）

```ts
describe('E18-TSFIX-3: Type Infrastructure', () => {
  it('shared types module should export all base types', () => {
    const exports = require('@/types/shared');
    expect(exports.Session).toBeDefined();
    expect(exports.BaseSession).toBeDefined();
    expect(exports.Config).toBeDefined();
    expect(exports.Response).toBeDefined();
  });

  it('type guards should work correctly', () => {
    const guard = require('@/types/shared/guards');
    const validSession = { id: 's1', module: 'e3-u2', createdAt: new Date(), updatedAt: new Date(), status: 'active' };
    expect(guard.isSession(validSession)).toBe(true);
    expect(guard.isE3U2Session(validSession)).toBe(true);
    expect(guard.isE3U3Session(validSession)).toBe(false);
  });

  it('ci type check should pass', () => {
    const result = execSync('npx tsc --noEmit', { cwd: '.' });
    expect(result.exitCode).toBe(0);
  });

  it('no type errors in shared types', () => {
    const errors = execSync('npx tsc --noEmit 2>&1', { cwd: 'src/types/shared' });
    expect(errors.toString()).not.toContain('error TS');
  });

  it('type utilities should be functional', () => {
    const utils = require('@/types/shared/utilities');
    expect(typeof utils.deepPartial).toBe('function');
    expect(typeof utils.requireFields).toBe('function');
  });
});
```

## DoD Checklist

- [ ] `src/types/shared/` 目录结构符合规范
- [ ] 所有 shared types 有 JSDoc 注释
- [ ] 类型守卫测试覆盖率 ≥ 90%
- [ ] `npx tsc --noEmit` 全项目通过
- [ ] shared types 被 E3-U2 和 E3-U3 引用（无重复定义）
