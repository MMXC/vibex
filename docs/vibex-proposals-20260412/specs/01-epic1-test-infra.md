# Spec: Epic 1 — 测试基础设施修复

**Epic**: E1  
**PRD 引用**: `prd.md` § Epic 1  
**优先级**: P0  
**目标 Sprint**: Sprint 1（04/12-04/14）  
**工时**: 4.5h（Story S1.1: 1.5h, S1.2: 0.5h）  
**前置依赖**: E0 完成（TypeScript 编译通过）  
**状态**: 待开发

---

## 概述

本 Epic 修复 **Token 日志泄露** 问题。Token/AccessToken 在 API 路由中通过 `console.log` 直接输出到日志，存在安全风险。需要：
1. 全局扫描 `/api/chat` 和 `/api/pages` 路径中的裸露 Token
2. 统一替换为 `safeError()` 封装
3. 验证 100% 覆盖

---

## 详细设计

### S1.1 — Token 日志泄露修复

#### F1.1: Token 日志扫描与修复

**问题描述**: `/api/chat` 和 `/api/pages` 目录下存在 `console.log/accessToken/Token` 等未包装的日志输出，直接暴露敏感信息。

**扫描范围**:
```
apps/backend/src/app/api/
├── chat/           # 扫描范围
└── pages/          # 扫描范围
```

**修复策略**:
1. 全仓库扫描裸露 Token 模式
2. 统一替换为 `safeError()` 封装函数

**safeError 函数设计**（已存在，验证使用）:
```typescript
// packages/utils/src/safe-error.ts
export const safeError = (context: string, error?: Error): string => {
  // 只输出安全信息，不包含 Token/Secret/Key
  return `[${context}] ${error?.message ?? 'Unknown error'}`;
};

export const safeLog = (context: string, data: unknown): void => {
  // 过滤敏感字段
  if (typeof data === 'object' && data !== null) {
    const safe = { ...data };
    const sensitiveKeys = ['token', 'accessToken', 'refreshToken', 'secret', 'key', 'password'];
    sensitiveKeys.forEach(k => delete safe[k]);
    console.log(`[${context}]`, safe);
  } else {
    console.log(`[${context}]`, data);
  }
};
```

**修复前后对比**:
```typescript
// 修复前：
console.log('Token:', token.accessToken);
console.log('User request:', req.headers['authorization']);

// 修复后：
console.log('[chat] User request processed'); // 仅上下文
safeLog('chat', { userId: req.userId, action: 'request' });
```

#### 扫描规则

```bash
# Token 敏感模式（需修复）
grep -rn "console\.\(log\|error\|warn\|debug\)" \
  apps/backend/src/app/api/chat \
  apps/backend/src/app/api/pages \
  --include="*.ts" | grep -iE "(token|authorization|bearer|secret|key)" || true

# 验证无裸露 Token
grep -rn "console\." apps/backend/src/app/api/chat --include="*.ts" | \
  grep -iE "(accessToken|refreshToken|token|secret|key)" || echo "No leaks found"
```

### S1.2 — safeError 覆盖验证

#### F1.2: 100% 覆盖验证

**验证方法**: 使用 Istanbul/ NYC 或手动审查，确认所有日志点均经过 safeError/safeLog。

**验证步骤**:
1. 运行单元测试覆盖率
2. 手动审查未被自动覆盖的边界情况
3. 补充缺失的 safeLog 调用

---

## API/接口

本 Epic 不涉及新增 API 接口。修改仅在现有 API 路由的日志输出层面。

---

## 实现步骤

### Phase 1: Token 日志扫描（1h）

1. **扫描现有日志**
   ```bash
   cd /root/.openclaw/vibex
   grep -rn "console\." apps/backend/src/app/api/chat --include="*.ts"
   grep -rn "console\." apps/backend/src/app/api/pages --include="*.ts"
   ```

2. **分类问题**
   - Token 直接输出 → 替换为 safeLog
   - 错误堆栈包含 Token → 替换为 safeError
   - 安全的上下文日志 → 保留（简化上下文）

3. **批量修复**
   - 按文件逐个修复
   - 修复后运行 `pnpm eslint --fix` 格式化

4. **验证扫描**
   ```bash
   # 无 Token 相关裸露日志
   grep -rn "console\." apps/backend/src/app/api/chat \
     apps/backend/src/app/api/pages --include="*.ts" | \
     grep -iE "(accessToken|refreshToken|bearer|secret)" || echo "CLEAN"
   ```

### Phase 2: 覆盖验证（0.5h）

1. **覆盖率检查**
   ```bash
   cd /root/.openclaw/vibex/apps/backend
   npx nyc npm test -- --coverage
   # 检查 api/chat 和 api/pages 的 safeLog 覆盖率
   ```

2. **手动边界审查**
   - 异常路径（日志写入失败）是否有兜底
   - 异步日志是否正确 await

3. **最终验证**
   ```bash
   # 确认无裸露 Token
   expect(grepResult).toBeEmpty()
   ```

---

## 验收测试

### AC1.1 — Token 日志扫描

```typescript
//验收测试: Token日志无裸露
describe('Token Log Security (AC1.1)', () => {
  const scanDir = (dir: string): string[] => {
    const result = execSync(
      `grep -rn "console\\." ${dir} --include="*.ts"`,
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    return result.trim().split('\n').filter(Boolean);
  };

  const sensitivePatterns = [
    'accessToken', 'refreshToken', 'token',
    'secret', 'key', 'password', 'bearer',
  ];

  it('no console.* in /api/chat with sensitive patterns', () => {
    const lines = scanDir('apps/backend/src/app/api/chat');
    const leaks = lines.filter(line =>
      sensitivePatterns.some(p => line.toLowerCase().includes(p.toLowerCase()))
    );
    expect(leaks).toEqual([]);
  });

  it('no console.* in /api/pages with sensitive patterns', () => {
    const lines = scanDir('apps/backend/src/app/api/pages');
    const leaks = lines.filter(line =>
      sensitivePatterns.some(p => line.toLowerCase().includes(p.toLowerCase()))
    );
    expect(leaks).toEqual([]);
  });

  it('safeError function exists and is importable', () => {
    const { safeError, safeLog } = require('@vibex/utils/safe-error');
    expect(typeof safeError).toBe('function');
    expect(typeof safeLog).toBe('function');
  });

  it('safeLog filters sensitive keys from objects', () => {
    const { safeLog } = require('@vibex/utils/safe-error');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    safeLog('test', {
      userId: '123',
      accessToken: 'SECRET_TOKEN',
      action: 'login',
    });
    const logged = consoleSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged).not.toHaveProperty('accessToken');
    expect(logged).toHaveProperty('userId', '123');
    expect(logged).toHaveProperty('action', 'login');
    consoleSpy.mockRestore();
  });
});
```

### AC1.2 — safeError 覆盖验证

```typescript
//验收测试: safeError覆盖100%
describe('safeError Coverage (AC1.2)', () => {
  it('all chat API routes import safeError or safeLog', () => {
    const chatFiles = execSync(
      'find apps/backend/src/app/api/chat -name "*.ts"',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    ).trim().split('\n').filter(Boolean);

    chatFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const hasConsole = /console\.(log|error|warn|debug)\(/.test(content);
      const hasSafe = /safe(Error|Log)/.test(content);
      if (hasConsole) {
        expect(hasSafe).toBe(true);
      }
    });
  });

  it('all pages API routes import safeError or safeLog', () => {
    const pagesFiles = execSync(
      'find apps/backend/src/app/api/pages -name "*.ts"',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    ).trim().split('\n').filter(Boolean);

    pagesFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const hasConsole = /console\.(log|error|warn|debug)\(/.test(content);
      const hasSafe = /safe(Error|Log)/.test(content);
      if (hasConsole) {
        expect(hasSafe).toBe(true);
      }
    });
  });

  it('coverage of safeError usage is 100% on scanned paths', () => {
    // 通过验证所有 console 调用都使用 safe* 包装
    // 来间接验证 100% 覆盖
    const result = execSync(
      'grep -rn "console\\." apps/backend/src/app/api/chat apps/backend/src/app/api/pages --include="*.ts" | wc -l',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    ).trim();
    // 所有 console 调用都已替换为 safeLog/safeError
    // 因此纯 console 调用数为 0
    expect(parseInt(result)).toBe(0);
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| safeError 覆盖验证误判 | 低 | 中 | 手动审查关键 API 路由补充自动扫描 |
| 修复过程中引入新日志 | 中 | 中 | 修复后运行完整 grep 扫描 |
| 测试覆盖率工具未安装 | 低 | 低 | 预先检查 `npx nyc` 可用性 |
