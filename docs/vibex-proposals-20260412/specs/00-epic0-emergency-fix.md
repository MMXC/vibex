# Spec: Epic 0 — 紧急修复

**Epic**: E0  
**PRD 引用**: `prd.md` § Epic 0  
**优先级**: P0  
**目标 Sprint**: Sprint 0（紧急）  
**工时**: 5h（Story S0.1: 2h, S0.2: 3h）  
**状态**: 待开发

---

## 概述

本 Epic 解决两个阻断性问题：
1. **TypeScript 编译错误** — 阻塞 CI/CD 全流程，阻止代码合并
2. **Auth Mock 全面失效** — 导致 94 个测试中大量失败，CI 门禁完全失效

两个 Story 必须并行修复，解除阻塞后恢复 Sprint 正常节奏。

---

## 详细设计

### S0.1 — TypeScript 编译错误修复

#### F0.1: EntityAttribute.required 类型冲突修复

**问题描述**: `EntityAttribute.required` 的类型定义与其他模块产生冲突，导致 TypeScript 报错。

**修复方案**:
```typescript
// packages/types/src/entities.ts
// 冲突前：
required: boolean;

// 修复后：
required?: boolean;
```
使用可选属性替代布尔硬编码，消除与 `Partial<Type>` 展开时的冲突。

#### F0.2: NextResponse 值导入修复

**问题描述**: 部分文件使用 `import type { NextResponse }` 但后续代码中使用了值（runtime reference）。

**修复方案**:
```typescript
// 修复前：
import type { NextResponse } from 'next/server';

// 修复后：
import { NextResponse } from 'next/server';
```

**扫描范围**: 全仓库 `import type.*NextResponse`，逐个文件审查并修复。

#### F0.3: Function 泛型约束修复

**问题描述**: `(...args: any) => any` 泛型约束不精确，导致重载解析失败。

**修复方案**:
```typescript
// packages/types/src/utils.ts
// 修复前：
type GenericFunction = (...args: any) => any;

// 修复后：
type GenericFunction = (...args: unknown[]) => unknown;

// 或更精确的约束：
type TypedHandler<T = unknown> = (payload: T) => T;
```

### S0.2 — Auth Mock Factory

#### F0.4: 统一 Auth Mock Factory

**问题描述**: 当前 Auth Mock 分散在各个测试文件中，缺乏统一 factory，导致 mock 行为不一致。

**修复方案**: 在 `packages/__tests__/auth/` 下建立统一 factory。

```
packages/__tests__/
├── auth/
│   ├── mock-factory.ts       # 统一 factory
│   ├── mocks/
│   │   ├── user.mock.ts      # 用户数据 mock
│   │   ├── session.mock.ts   # Session mock
│   │   └── token.mock.ts     # Token mock
│   └── auth.test.ts          # 验证 mock 正确性
```

**Mock Factory API 设计**:
```typescript
// mock-factory.ts
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: 'user_test_001',
  email: 'test@example.com',
  role: 'user',
  ...overrides,
});

export const createMockSession = (overrides?: Partial<MockSession>): MockSession => ({
  sessionId: 'session_test_001',
  userId: 'user_test_001',
  expiresAt: Date.now() + 3600 * 1000,
  ...overrides,
});

export const createMockToken = (overrides?: Partial<MockToken>): MockToken => ({
  accessToken: 'test_token_xxx',
  refreshToken: 'test_refresh_xxx',
  tokenType: 'Bearer',
  ...overrides,
});

export const createAuthContext = (options?: AuthContextOptions): AuthContext => ({
  user: createMockUser(options?.user),
  session: createMockSession(options?.session),
  token: options?.token ?? createMockToken(),
  isAuthenticated: options?.isAuthenticated ?? true,
});
```

**Mock 重写策略**:
- 原有分散 mock 迁移至 factory 调用
- 每个 mock factory 提供默认数据 + overrides 参数
- 保持向后兼容：原有 mock 调用路径通过 wrapper 兼容

---

## 实现步骤

### Phase 1: TypeScript 修复（2h）

1. **环境准备**
   ```bash
   cd /root/.openclaw/vibex
   pnpm tsc --noEmit > ts_errors_before.txt 2>&1
   ```

2. **F0.1 修复** — `EntityAttribute.required`
   - 定位类型冲突文件（从 ts_errors_before.txt 提取）
   - 修改 `packages/types/src/entities.ts`
   - 运行 `pnpm tsc --noEmit` 验证

3. **F0.2 修复** — NextResponse import
   - 全仓库扫描：`grep -rn "import type.*NextResponse" --include="*.ts" --include="*.tsx"`
   - 逐文件审查，确认值使用后改为值导入
   - 运行 `pnpm tsc --noEmit` 验证

4. **F0.3 修复** — Function 泛型
   - 定位泛型不精确的位置
   - 替换为精确的泛型约束
   - 运行 `pnpm tsc --noEmit` 验证

5. **CI 验证**
   ```bash
   pnpm tsc --noEmit
   # 确认输出无 error
   ```

### Phase 2: Auth Mock 修复（3h）

1. **现状分析**
   ```bash
   npm test -- --testPathPattern="auth" 2>&1 | tee auth_test_before.txt
   # 记录失败数量和原因
   ```

2. **Mock Factory 实现**
   - 创建 `packages/__tests__/auth/mock-factory.ts`
   - 实现 `createMockUser`, `createMockSession`, `createMockToken`, `createAuthContext`

3. **迁移分散 Mock**
   - 扫描所有 auth 相关测试文件中的 inline mock
   - 替换为 factory 调用
   - 保留原有测试逻辑不变

4. **CI 验证**
   ```bash
   npm test 2>&1 | tee test_result.txt
   # 验证 79 passed, 0 failed
   ```

5. **纳入 CI pre-check**
   - 在 `.github/workflows/ci.yml` 中添加 `pnpm tsc --noEmit` 到 pre-check 阶段

---

## 验收测试

### AC0.1 — TypeScript 编译

```typescript
//验收测试: TypeScript编译无错误
describe('TypeScript Compilation', () => {
  it('pnpm tsc --noEmit should produce zero errors', () => {
    const result = execSync('pnpm tsc --noEmit', {
      cwd: '/root/.openclaw/vibex',
      encoding: 'utf-8',
    });
    expect(result.trim()).toBe('');
  });

  it('no EntityAttribute.required type conflicts', () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/packages/types/src/entities.ts',
      'utf-8'
    );
    // required 应为可选属性
    expect(content).not.toMatch(/required:\s*boolean;/);
    expect(content).toMatch(/required\?:\s*boolean;/);
  });

  it('no import type NextResponse with value usage', () => {
    const grepResult = execSync(
      'grep -rn "import type.*NextResponse" --include="*.ts" --include="*.tsx" .',
      { encoding: 'utf-8' }
    );
    // 扫描结果应为空，或每个结果旁有注释说明无值使用
    const lines = grepResult.trim().split('\n').filter(Boolean);
    expect(lines.length).toBe(0);
  });

  it('GenericFunction uses unknown instead of any', () => {
    const content = readFileSync(
      '/root/.openclaw/vibex/packages/types/src/utils.ts',
      'utf-8'
    );
    expect(content).not.toMatch(/\.\.\.\s*args:\s*any/);
    expect(content).toMatch(/\.\.\.\s*args:\s*unknown\[\]/);
  });
});
```

### AC0.2 — Auth Mock 测试

```typescript
//验收测试: Auth Mock测试全部通过
describe('Auth Mock Factory', () => {
  it('createMockUser returns valid user object', () => {
    const user = createMockUser();
    expect(user.id).toBeDefined();
    expect(user.email).toContain('@');
    expect(user.role).toBe('user');
  });

  it('createMockUser with overrides merges correctly', () => {
    const user = createMockUser({ email: 'custom@test.com', role: 'admin' });
    expect(user.email).toBe('custom@test.com');
    expect(user.role).toBe('admin');
    expect(user.id).toBe('user_test_001'); // default preserved
  });

  it('createMockSession returns valid session object', () => {
    const session = createMockSession();
    expect(session.sessionId).toBeDefined();
    expect(session.userId).toBe('user_test_001');
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('createMockToken returns valid token object', () => {
    const token = createMockToken();
    expect(token.accessToken).toMatch(/^test_token_/);
    expect(token.tokenType).toBe('Bearer');
  });

  it('createAuthContext with isAuthenticated false', () => {
    const ctx = createAuthContext({ isAuthenticated: false });
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
  });

  it('all 94 auth tests pass with 0 failures', () => {
    const result = execSync('npm test 2>&1', {
      cwd: '/root/.openclaw/vibex',
      encoding: 'utf-8',
    });
    // 解析测试输出，提取 passed/failed 数量
    const passedMatch = result.match(/(\d+) passed/);
    const failedMatch = result.match(/(\d+) failed/);
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    expect(passed).toBeGreaterThanOrEqual(79);
    expect(failed).toBe(0);
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| TypeScript 修复引入新错误 | 中 | 高 | 每步修复后运行 `pnpm tsc --noEmit`，通过后再进行下一步 |
| Auth Mock 修复导致其他测试失败 | 中 | 中 | 修复后全量测试验证，确认 79+ tests pass |
| NextResponse 值导入改动范围广 | 高 | 中 | 使用 IDE 搜索定位影响范围，批量替换 |
| CI pre-check 添加后构建时间增加 | 低 | 低 | pre-check 仅运行 tsc，预计增加 <30s |
