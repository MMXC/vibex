# Spec: Epic 3 — CI/CD 守卫增强

**Epic**: E3  
**PRD 引用**: `prd.md` § Epic 3  
**优先级**: P0  
**目标 Sprint**: Sprint 1（04/12-04/14）  
**工时**: 1.5h（Story S3.1: 1h, S3.2: 0.5h）  
**前置依赖**: E1 完成（测试基础设施修复）  
**状态**: 待开发

---

## 概述

增强 CI 门禁，防止历史问题再次发生。核心目标：
1. **grepInvert 自动化验证**: 确保配置变更记录在 CHANGELOG
2. **WEBSOCKET_CONFIG 集中管理**: 所有 WebSocket 超时值从单一配置源读取

---

## 详细设计

### S3.1 — grepInvert 自动化验证

#### F3.1: grepInvert CI 守卫

**问题描述**: grepInvert 配置（GitHub Actions 的 `grep-invert-match`）用于排除误报，当配置被修改时需要有追踪机制。

**设计思路**:
```yaml
# .github/workflows/ci.yml
jobs:
  grep-guard:
    runs-on: ubuntu-latest
    steps:
      - name: Check grepInvert config changes
        run: |
          if git diff --name-only ${{ github.event.pull_request.base.sha }} HEAD | grep -q "\.github/workflows"; then
            echo "::notice::Workflow config changed"
            # 验证 CHANGELOG 中有对应记录
            if ! grep -q "workflow" CHANGELOG.md; then
              echo "::error::Workflow changes must be documented in CHANGELOG.md"
              exit 1
            fi
          fi
```

**自动化验证脚本**:
```typescript
// scripts/ci-guard/grep-invert-guard.ts
import { execSync } from 'child_process';

const WORKFLOW_CHANGES_QUERY = 'git diff --name-only HEAD~1 -- .github/workflows/';
const CHANGELOG_PATH = 'CHANGELOG.md';

export function checkGrepInvertChanges(): boolean {
  try {
    const changedFiles = execSync(WORKFLOW_CHANGES_QUERY, { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (changedFiles.length === 0) {
      return true; // 无工作流变更，跳过
    }

    // 工作流变更时，验证 CHANGELOG 记录
    const changelog = require('fs').readFileSync(CHANGELOG_PATH, 'utf-8');
    const hasWorkflowNote = /workflow|github|actions|ci/i.test(changelog);
    
    return hasWorkflowNote;
  } catch {
    return true; // 非 PR 上下文，跳过检查
  }
}
```

#### CI 集成

```yaml
# .github/workflows/ci.yml
- name: GrepInvert Guard
  run: npx ts-node scripts/ci-guard/grep-invert-guard.ts
  # 仅在 PR 中运行
  if: github.event_name == 'pull_request'
```

### S3.2 — WEBSOCKET_CONFIG 集中管理

#### F3.2: WebSocket 配置集中化

**问题描述**: WebSocket 连接超时值分散在多个文件中，无法统一管理，存在不一致风险。

**当前问题**:
```typescript
// 分散的超时配置
// file1.ts
const TIMEOUT = 5000;

// file2.ts
const WS_TIMEOUT = 3000;

// file3.ts
const CONNECT_TIMEOUT = 8000;
```

**解决方案**:
```typescript
// apps/frontend/src/config/websocket.ts
export const WEBSOCKET_CONFIG = {
  connectTimeout: 5000,       // 连接超时 (ms)
  heartbeatInterval: 30000,   // 心跳间隔 (ms)
  reconnectDelay: 1000,      // 重连延迟 (ms)
  maxReconnectAttempts: 5,   // 最大重连次数
  messageTimeout: 30000,      // 消息超时 (ms)
} as const;

export type WebSocketConfigKey = keyof typeof WEBSOCKET_CONFIG;

// 使用
import { WEBSOCKET_CONFIG } from '@/config/websocket';
ws.connect(WEBSOCKET_CONFIG.connectTimeout);
```

**迁移步骤**:
1. 创建 `apps/frontend/src/config/websocket.ts`
2. 扫描所有 WebSocket 相关文件的超时常量
3. 替换为配置引用
4. 验证所有引用均来自 `WEBSOCKET_CONFIG`

---

## API/接口

本 Epic 不涉及 HTTP API 接口变更，变更仅限于 CI 配置和前端配置模块。

---

## 实现步骤

### Phase 1: grepInvert CI 守卫（1h）

1. **创建目录结构**
   ```bash
   mkdir -p scripts/ci-guard
   ```

2. **实现验证脚本**
   - 创建 `scripts/ci-guard/grep-invert-guard.ts`
   - 实现 CHANGELOG 验证逻辑

3. **集成到 CI**
   - 修改 `.github/workflows/ci.yml`
   - 添加 grepInvert Guard job

4. **测试脚本逻辑**
   ```bash
   # 模拟变更（有 CHANGELOG）
   git diff HEAD~1 -- .github/workflows/ | head -20
   grep "workflow" CHANGELOG.md
   ```

### Phase 2: WEBSOCKET_CONFIG 集中（0.5h）

1. **扫描现有 WebSocket 配置**
   ```bash
   grep -rn "timeout\|TIMEOUT" --include="*.ts" --include="*.tsx" \
     apps/frontend/src | grep -i "websocket\|ws\|connect"
   ```

2. **创建配置模块**
   - 创建 `apps/frontend/src/config/websocket.ts`
   - 定义所有 WebSocket 相关常量

3. **迁移引用**
   - 逐个文件替换超时常量为配置引用
   - 删除原有分散常量

4. **验证**
   - 确认无硬编码超时值
   - 确认所有引用来自 WEBSOCKET_CONFIG

---

## 验收测试

### AC3.1 — grepInvert CI 守卫

```typescript
//验收测试: grepInvert配置变更自动验证
describe('grepInvert CI Guard (AC3.1)', () => {
  const guardScript = '/root/.openclaw/vibex/scripts/ci-guard/grep-invert-guard.ts';

  it('guard script exists', () => {
    expect(fs.existsSync(guardScript)).toBe(true);
  });

  it('guard script exits 0 when no workflow changes', () => {
    // 模拟无工作流变更
    const result = execSync(`npx ts-node ${guardScript}`, {
      cwd: '/root/.openclaw/vibex',
      encoding: 'utf-8',
      env: { ...process.env, CI: 'true' },
    });
    expect(result).toBeDefined();
  });

  it('CHANGELOG contains workflow documentation', () => {
    const changelogPath = '/root/.openclaw/vibex/CHANGELOG.md';
    expect(fs.existsSync(changelogPath)).toBe(true);
    const content = fs.readFileSync(changelogPath, 'utf-8');
    // CHANGELOG 应包含 CI/workflow 相关记录
    expect(content.length).toBeGreaterThan(0);
  });

  it('CI workflow references the guard script', () => {
    const ciPath = '/root/.openclaw/vibex/.github/workflows/ci.yml';
    const content = fs.readFileSync(ciPath, 'utf-8');
    expect(content).toMatch(/grep-invert|ci-guard|changelog/i);
  });

  it('guard script fails if workflow changed without CHANGELOG entry', () => {
    // 创建临时分支模拟变更
    const tmpDir = '/tmp/vibex-test-guard';
    execSync(`cp -r /root/.openclaw/vibex ${tmpDir}`);
    execSync('echo "test" >> .github/workflows/test.yml', { cwd: tmpDir });
    expect(() => {
      execSync(`npx ts-node ${guardScript}`, { cwd: tmpDir });
    }).toThrow();
  });
});
```

### AC3.2 — WEBSOCKET_CONFIG 集中

```typescript
//验收测试: WEBSOCKET_CONFIG作为唯一配置源
describe('WEBSOCKET_CONFIG Centralization (AC3.2)', () => {
  const configPath = '/root/.openclaw/vibex/apps/frontend/src/config/websocket.ts';

  it('WEBSOCKET_CONFIG module exists', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('WEBSOCKET_CONFIG exports all required keys', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toMatch(/connectTimeout/);
    expect(content).toMatch(/heartbeatInterval/);
    expect(content).toMatch(/reconnectDelay/);
    expect(content).toMatch(/maxReconnectAttempts/);
    expect(content).toMatch(/messageTimeout/);
  });

  it('no hardcoded WebSocket timeout values in source', () => {
    const result = execSync(
      'grep -rn "timeout\\|TIMEOUT" apps/frontend/src --include="*.ts" --include="*.tsx" | grep -iE "(ws|websocket|connect)"',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    const lines = result.trim().split('\n').filter(Boolean);
    // 应无硬编码超时值（所有引用均通过 WEBSOCKET_CONFIG）
    const nonConfigRefs = lines.filter(line => {
      // 排除导入 WEBSOCKET_CONFIG 的行
      return !line.includes('WEBSOCKET_CONFIG') && !line.includes('config/websocket');
    });
    expect(nonConfigRefs).toEqual([]);
  });

  it('WEBSOCKET_CONFIG is imported by WebSocket modules', () => {
    const wsFiles = execSync(
      'grep -rln "WebSocket\\|ws" apps/frontend/src --include="*.ts" --include="*.tsx"',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    ).trim().split('\n').filter(Boolean);

    wsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // 所有 WebSocket 文件应引用 WEBSOCKET_CONFIG
      expect(content).toMatch(/WEBSOCKET_CONFIG|config\/websocket/);
    });
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| grepInvert guard 在非 PR 环境误报 | 低 | 低 | 检查 `github.event_name == 'pull_request'` |
| WEBSOCKET_CONFIG 迁移遗漏文件 | 中 | 中 | 全面 grep 扫描 + 运行时验证 |
| CHANGELOG 格式不标准导致验证失败 | 低 | 中 | 使用正则宽松匹配 |
