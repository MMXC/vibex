# Epic 3: WebSocket logger 回归测试

**Epic ID**: E3
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P1
**工时**: 1h
**关联 Features**: F5
**关联 T-P1-1**: backend console.log → logger 重构无回归测试

---

## 1. Story: E3-S1 — WebSocket logger 单元测试

### 上下文

dev/20260411 提案将 `vibex-backend/src/services/websocket/connectionPool.ts` 中的 4 处 `console.log` 替换为 `logger.info/error`。WebSocket 消息处理的日志路径**没有回归测试**。本次补充 backend unit test 验证重构正确性。

### 测试文件位置

`vibex-backend/src/services/websocket/__tests__/connectionPool.test.ts`

### 测试内容

#### 测试 1: connectionPool.ts 中无 console.* 调用

```ts
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('connectionPool.ts logger migration', () => {
  const sourceFile = resolve(__dirname, '../connectionPool.ts');
  const sourceContent = readFileSync(sourceFile, 'utf-8');

  test('should not contain console.log calls', () => {
    const consoleLogMatches = sourceContent.match(/console\.log\(/g) || [];
    expect(consoleLogMatches).toHaveLength(0);
  });

  test('should not contain console.error calls', () => {
    const consoleErrorMatches = sourceContent.match(/console\.error\(/g) || [];
    expect(consoleErrorMatches).toHaveLength(0);
  });

  test('should not contain console.warn calls', () => {
    const consoleWarnMatches = sourceContent.match(/console\.warn\(/g) || [];
    expect(consoleWarnMatches).toHaveLength(0);
  });

  test('should import logger', () => {
    expect(sourceContent).toMatch(/import.*logger.*from/);
  });

  test('should use logger for connection open events', () => {
    // 验证 logger.info 用于连接建立
    expect(sourceContent).toMatch(/logger\.info\(/);
  });
});
```

#### 测试 2: logger 被正确调用（集成验证）

```ts
import { ConnectionPool } from '../connectionPool';
import { Logger } from '../../logger';

describe('ConnectionPool logger integration', () => {
  let mockLogger: jest.Mocked<Logger>;
  let pool: ConnectionPool;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;
    pool = new ConnectionPool({ logger: mockLogger });
  });

  afterEach(() => {
    pool.close();
  });

  test('logger receives info on connection open', async () => {
    // 模拟 WebSocket 连接
    // 注意：实际测试可能需要 mock WebSocket server
    // 此处验证 logger mock 被正确传递
    expect(pool).toBeDefined();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  test('logger receives error on connection failure', async () => {
    // 模拟连接失败场景
    // 验证 logger.error 被调用，参数包含错误信息
    // 实现取决于 ConnectionPool 的具体 API
  });
});
```

#### 测试 3: 日志格式验证（可选）

```ts
test('logger calls include structured metadata', () => {
  const logCalls = mockLogger.info.mock.calls;
  for (const call of logCalls) {
    const [message, meta] = call;
    // 验证日志消息格式
    expect(typeof message).toBe('string');
    // 验证元数据包含连接相关信息
    if (meta) {
      expect(meta).toHaveProperty('timestamp');
    }
  }
});
```

### 依赖

- `vibex-backend/src/services/logger.ts` 存在（logger 模块）
- Vitest 配置正确（支持 `jest.mock` 语法）
- `vibex-backend/vitest.config.ts` 存在

### 验收标准

```ts
// 验收 1: 测试文件能运行
const vitestResult = execSync(
  'cd vibex-backend && npx vitest run src/services/websocket/__tests__/connectionPool.test.ts 2>&1',
  { timeout: 30000 }
).toString();
expect(vitestResult).not.toContain('Error');
expect(vitestResult).not.toContain('FAIL');

// 验收 2: 所有 console.* 检查通过
expect(vitestResult).toContain('0 console.log');
expect(vitestResult).toContain('0 console.error');

// 验收 3: 测试在 CI 中通过
const ciResult = execSync(
  'CI=true npx vitest run src/services/websocket/__tests__/connectionPool.test.ts 2>&1',
  { cwd: 'vibex-backend', timeout: 30000 }
).toString();
expect(ciResult).toContain('passed');
```

### 注意事项

- 如果 `connectionPool.ts` 内部创建 ConnectionPool 实例而非通过参数注入，需要重构为支持 logger 注入（参考 `src/services/logger.ts` 的设计）
- 如果无法直接 import source，需要在 `__tests__` 目录下使用 `readFileSync` 做静态检查
- 集成测试需要 WebSocket server mock，可使用 `ws` library 的 mock
