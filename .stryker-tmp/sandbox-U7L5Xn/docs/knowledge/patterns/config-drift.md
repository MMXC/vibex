# Pattern: 配置漂移 (Configuration Drift)

## 触发条件
- 不同环境（dev/staging/prod）配置不一致
- 本地开发正常，CI 失败
- Secret/Env 变量缺失或格式错误

## 典型症状
```
Error: Missing required environment variable: DATABASE_URL
```
```
ConfigError: Jest config mismatch
// jest.config.ts 与 CI jest.config.js 不一致
```

## 根因分析
1. **环境变量未集中管理**：散落在 .env、CI secret、docker-compose 中
2. **配置验证缺失**：启动时不检查必需变量
3. **Jest 配置分裂**：package.json jest 字段 vs jest.config.ts 不同步

## 修复方案

### 1. 统一配置源
```typescript
// config/index.ts
const config = {
  database: {
    url: process.env.DATABASE_URL,
  },
};

// 启动时验证
function validateConfig() {
  const required = ['DATABASE_URL', 'API_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

### 2. Jest 配置统一
```javascript
// jest.config.js (唯一配置源)
module.exports = {
  ...require('./jest.config.ts'),
};
```
或确保 package.json 中 jest 字段为空。

### 3. CI 环境同步
```yaml
# .github/workflows/test.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

## 验收标准
- [ ] 所有必需环境变量有默认值或启动时报错
- [ ] CI 与本地配置完全一致
- [ ] `pnpm test` 与 `npm test` 结果一致

## 相关检查清单
- Environment Parity
- Config Validation
