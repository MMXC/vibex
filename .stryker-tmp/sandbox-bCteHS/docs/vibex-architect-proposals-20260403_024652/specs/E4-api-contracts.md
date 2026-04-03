# Spec: E4 - API 契约测试

**Epic ID**: E4  
**Epic 名称**: API 契约测试  
**优先级**: P2  
**预估工时**: 4h（E4-S1: 1h + E4-S2: 2h + E4-S3: 1h）

---

## 1. Overview

建立前后端 API 契约测试，防止 `/v1/canvas/snapshots` 格式漂移。

**核心问题**:
- 后端 `/v1/canvas/snapshots` API 响应格式无契约定义
- 前后端格式漂移风险高（前端字段名变更后端未同步）
- 缺少 Consumer（前端）/ Provider（后端）双向验证

---

## 2. Story Specs

### E4-S1: 契约测试框架选型与初始化

#### 功能点
评估并选择契约测试框架；在 `tests/contracts/` 初始化项目结构。

#### 框架选型对比

| 框架 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **Pact** | Consumer/Provider 双向验证，Broker 集成 | 学习曲线，中等配置成本 | ✅ 推荐 |
| **OpenAPI + Prism** | 与现有 API doc 契合，自动 Mock | Consumer 测试较弱 | 备选 |
| **Jest + MSW** | 无需新工具，快速上手 | 仅 Consumer 侧，无 Provider 验证 | 过渡方案 |

**推荐方案**: Pact（Consumer-driven contracts）

#### 目录结构
```
tests/contracts/
├── consumer/
│   ├── snapshots.pact.spec.ts
│   └── rollback.pact.spec.ts
├── provider/
│   └── snapshots.provider.spec.ts
├── pacts/
│   └── vibex-frontend-vibex-backend.json
├── pact.config.js
└── package.json
```

#### 验收标准
```typescript
expect(fs.existsSync('tests/contracts')).toBe(true);
expect(fs.existsSync('tests/contracts/consumer')).toBe(true);
expect(fs.existsSync('tests/contracts/provider')).toBe(true);
expect(fs.existsSync('pact.config.js') || fs.existsSync('package.json')).toBe(true);
```

---

### E4-S2: /v1/canvas/snapshots 契约定义

#### 功能点
对 `/v1/canvas/snapshots`（POST/GET）和 `/v1/canvas/rollback` 定义契约规范。

#### 契约规范定义

**POST /v1/canvas/snapshots（Consumer → Provider）**:
```typescript
// consumer/snapshots.pact.spec.ts
const interaction = {
  state: 'user has a canvas',
  uponReceiving: 'a request to save canvas snapshot',
  withRequest: {
    method: 'POST',
    path: '/v1/canvas/snapshots',
    headers: { 'Content-Type': 'application/json' },
    body: {
      canvasId: string,
      json: string,
      timestamp: number,
      version: number
    }
  },
  willRespondWith: {
    status: 200,
    body: {
      id: string,
      canvasId: string,
      version: number,
      createdAt: string
    }
  }
};
```

**GET /v1/canvas/snapshots/:id（Consumer → Provider）**:
```typescript
const interaction = {
  uponReceiving: 'a request to get canvas snapshot',
  withRequest: {
    method: 'GET',
    path: '/v1/canvas/snapshots/:id'
  },
  willRespondWith: {
    status: 200,
    body: {
      id: string,
      canvasId: string,
      json: string,
      version: number,
      createdAt: string
    }
  }
};
```

**409 Conflict（Consumer → Provider）**:
```typescript
const conflictInteraction = {
  uponReceiving: 'a version conflict when saving snapshot',
  withRequest: {
    method: 'POST',
    path: '/v1/canvas/snapshots',
    body: { version: 3 }  // server is at 4
  },
  willRespondWith: {
    status: 409,
    body: {
      code: 'VERSION_CONFLICT',
      serverVersion: number,
      serverSnapshot: object
    }
  }
};
```

#### 验收标准
```typescript
expect(contract.endpoints).toContain('/v1/canvas/snapshots');
expect(contract.endpoints).toContain('/v1/canvas/rollback');
expect(contract.methods).toContain('POST');
expect(contract.methods).toContain('GET');
expect(contract.interactions).toHaveLength(3); // POST, GET, 409
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `tests/contracts/consumer/snapshots.pact.spec.ts` | 新建 |
| `tests/contracts/consumer/rollback.pact.spec.ts` | 新建 |
| `tests/contracts/provider/snapshots.provider.spec.ts` | 新建 |

---

### E4-S3: CI 集成契约测试

#### 功能点
在 GitHub Actions 中添加契约测试 step，确保 PR 级别 blocking。

#### CI 配置

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    paths:
      - 'src/**'
      - 'server/**'
      - 'tests/contracts/**'

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Pact tests
        run: |
          npm install
          npx pact-broker publish ./tests/contracts/pacts \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --consumer-version=${{ github.sha }}
      - name: Verify Provider
        run: npx pact-verifier \
          --provider-base-url=http://localhost:3000 \
          --pact-broker-url=${{ secrets.PACT_BROKER_URL }}
```

#### 验收标准
```typescript
// CI step 存在
expect(ciStep.name).toBe('Contract Tests');
expect(ciStep.runsOn).toBe('ubuntu-latest');

// 契约破坏时 CI 失败
const brokenContract = { ...invalidPayload };
const ciResult = runCI(brokenContract);
expect(ciResult.exitCode).not.toBe(0);

// 契约正常时 CI 通过
const validContract = { ...validPayload };
const ciResult2 = runCI(validContract);
expect(ciResult2.exitCode).toBe(0);
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `.github/workflows/contract-tests.yml` | 新建 |
| `.github/workflows/ci.yml`（集成 contract-tests）| 修改 |

---

## 3. 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| R3: 契约测试与当前 API 不兼容 | 🟢 低 | 先建 mock 层（Pact Mock Server），再逐步替换真实 API |
| Pact Broker 依赖成本 | 🟡 中 | 先使用本地文件存储（`pacts/` 目录），Broker 作为后续优化 |

---

*Spec 由 PM Agent 生成于 2026-04-03*
