# CI/CD 优化需求分析报告

**项目**: vibex-cicd-optimization
**分析师**: Analyst Agent
**日期**: 2026-03-14

---

## 执行摘要

当前 CI/CD 流程存在构建效率瓶颈，**本地构建耗时 35 秒**，CI 环境因缺少有效缓存策略，实际耗时更长。通过引入构建缓存、并行构建和增量部署，预期**构建效率提升 40%**。

---

## 1. 当前构建性能基准

### 1.1 本地构建数据

| 指标 | 数值 | 说明 |
|------|------|------|
| 构建时间 | 35.06秒 | `npm run build` |
| node_modules | 1.4 GB | 依赖体积大 |
| .next 目录 | 663 MB | 构建产物 |
| CPU 核心 | 4 核 | 可用于并行 |

### 1.2 CI 构建流程分析

```
┌─────────────────────────────────────────────────────────────┐
│                    当前 CI 流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Checkout (≈5s)                                          │
│       │                                                      │
│       ▼                                                      │
│  2. Setup Node.js (≈15s)                                    │
│       │  - 下载 Node.js                                      │
│       │  - npm cache (基本缓存)                              │
│       ▼                                                      │
│  3. npm ci (≈60-90s) ⚠️ 瓶颈                                │
│       │  - 每次完整安装                                      │
│       │  - 无持久化缓存                                      │
│       ▼                                                      │
│  4. npm run build (≈35-50s)                                 │
│       │  - 无 .next 缓存                                     │
│       │  - 单线程 TypeScript                                 │
│       ▼                                                      │
│  5. Tests (≈30-120s)                                        │
│                                                              │
│  总计: ≈150-200s (2.5-3.5 分钟)                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 现有 CI 配置

| Workflow | 触发条件 | 特点 |
|----------|----------|------|
| performance.yml | push/PR | 有 npm cache，无 .next 缓存 |
| e2e-tests.yml | push/PR/schedule | 4 分片并行，每次完整构建 |
| coverage-check.yml | push/PR | 基本流程 |
| dependency-security.yml | schedule | 安全扫描 |

---

## 2. 瓶颈分析

### 2.1 依赖安装瓶颈

| 问题 | 影响 | 严重度 |
|------|------|--------|
| 无 node_modules 缓存 | 每次完整安装 60-90s | 🔴 高 |
| 依赖体积大 (1.4GB) | 下载和解压慢 | 🔴 高 |
| npm ci 全量安装 | 无增量更新 | 🟡 中 |

### 2.2 构建瓶颈

| 问题 | 影响 | 严重度 |
|------|------|--------|
| 无 .next 缓存 | 每次完整构建 | 🔴 高 |
| TypeScript 单线程 | 未利用多核 | 🟡 中 |
| 无增量构建 | 全量重新编译 | 🟡 中 |

### 2.3 测试瓶颈

| 问题 | 影响 | 严重度 |
|------|------|--------|
| E2E 每次完整构建 | 重复构建 | 🟡 中 |
| Playwright 每次安装 | 浏览器下载慢 | 🟡 中 |

---

## 3. 优化机会清单

### 3.1 高优先级优化 (P0)

| 优化项 | 预期收益 | 工作量 | ROI |
|--------|----------|--------|-----|
| npm 依赖缓存 | 节省 45-60s | 0.5天 | ⭐⭐⭐⭐⭐ |
| .next 构建缓存 | 节省 20-30s | 0.5天 | ⭐⭐⭐⭐⭐ |
| Playwright 浏览器缓存 | 节省 15-20s | 0.25天 | ⭐⭐⭐⭐ |

### 3.2 中优先级优化 (P1)

| 优化项 | 预期收益 | 工作量 | ROI |
|--------|----------|--------|-----|
| TypeScript 并行编译 | 节省 5-10s | 0.5天 | ⭐⭐⭐ |
| 增量构建 | 节省 10-20s | 1天 | ⭐⭐⭐ |
| 构建产物复用 | 节省 30s (测试阶段) | 1天 | ⭐⭐⭐ |

### 3.3 低优先级优化 (P2)

| 优化项 | 预期收益 | 工作量 | ROI |
|--------|----------|--------|-----|
| Turborepo/Nx | 大幅提升 | 3天 | ⭐⭐ |
| 远程缓存 | 大幅提升 | 2天 | ⭐⭐ |

---

## 4. 缓存策略详细设计

### 4.1 npm 依赖缓存

**当前问题**: 每次运行 `npm ci` 都完整安装，耗时 60-90 秒。

**优化方案**:

```yaml
# .github/workflows/optimized-build.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'

- name: Cache node_modules
  uses: actions/cache@v4
  id: cache-node-modules
  with:
    path: node_modules
    key: ${{ runner.os }}-node-modules-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-modules-

- name: Install dependencies
  if: steps.cache-node-modules.outputs.cache-hit != 'true'
  run: npm ci
```

**预期收益**: 命中缓存后节省 45-60 秒

### 4.2 .next 构建缓存

**当前问题**: 每次完整构建，无缓存复用。

**优化方案**:

```yaml
- name: Cache .next
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json', '**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-
```

**预期收益**: 命中缓存后节省 20-30 秒

### 4.3 Playwright 浏览器缓存

**当前问题**: 每次下载 Playwright 浏览器，耗时 15-20 秒。

**优化方案**:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-playwright-

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
```

**预期收益**: 命中缓存后节省 15-20 秒

---

## 5. 并行化机会

### 5.1 当前并行化

| 任务 | 并行化程度 |
|------|-----------|
| E2E 测试 | 4 分片并行 ✅ |
| 单元测试 | 单线程 |
| TypeScript 编译 | 单线程 |

### 5.2 并行化优化

**TypeScript 并行编译**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,  // 已启用
    "typescript": {
      "memoryCache": true  // 启用内存缓存
    }
  }
}
```

**Jest 并行测试**:

```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%',  // 使用 50% CPU 核心
};
```

---

## 6. 增量部署可行性

### 6.1 当前部署方式

- `output: 'export'` - 静态导出
- 部署到 Cloudflare Pages

### 6.2 增量部署方案

```
┌─────────────────────────────────────────────────────────────┐
│                    增量部署流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 构建产物 diff                                            │
│       │  - 对比 .next 与上次部署                             │
│       │  - 识别变更文件                                      │
│       ▼                                                      │
│  2. 只上传变更文件                                           │
│       │  - 减少上传量 70%                                    │
│       │  - 加速部署                                          │
│       ▼                                                      │
│  3. CDN 缓存失效                                             │
│       │  - 只失效变更路径                                    │
│       ▼                                                      │
│  4. 部署完成                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 实施难度

| 维度 | 评估 |
|------|------|
| 技术可行性 | ✅ 高 |
| 实施复杂度 | 🟡 中 |
| 预期收益 | 节省 30-50% 部署时间 |

---

## 7. ROI 评估

### 7.1 优化前后对比

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 依赖安装 | 60-90s | 5-10s | 85% ↓ |
| 构建 | 35-50s | 15-25s | 50% ↓ |
| E2E 准备 | 20s | 5s | 75% ↓ |
| **总 CI 时间** | **150-200s** | **60-90s** | **55% ↓** |

### 7.2 成本效益

| 优化项 | 工作量 | 节省时间/次 | 年度节省 |
|--------|--------|-------------|----------|
| npm 缓存 | 0.5天 | 45s | ≈15小时/年 |
| .next 缓存 | 0.5天 | 25s | ≈8小时/年 |
| Playwright 缓存 | 0.25天 | 15s | ≈5小时/年 |
| **总计** | **1.25天** | **85s** | **≈28小时/年** |

**假设**: 每天 20 次 CI 运行，每年 250 工作日

---

## 8. 实施建议

### 8.1 分阶段实施

| 阶段 | 内容 | 工期 |
|------|------|------|
| **Phase 1** | 缓存优化 (npm + .next + Playwright) | 1天 |
| **Phase 2** | 并行化优化 (Jest + TypeScript) | 0.5天 |
| **Phase 3** | 增量部署 | 1天 |
| **Phase 4** | 监控和优化 | 0.5天 |

### 8.2 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 缓存不一致 | 🟡 中 | 缓存 key 使用 hash |
| 磁盘空间不足 | 🟢 低 | 设置 retention-days |
| 增量部署漏文件 | 🟡 中 | 完整性校验 |

---

## 9. 验收标准

### 9.1 性能指标

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| CI 总时间 | < 90s | GitHub Actions 日志 |
| 缓存命中率 | > 80% | cache actions 输出 |
| 构建成功率 | 100% | CI 状态 |

### 9.2 验证命令

```bash
# 本地测试缓存效果
rm -rf node_modules .next
npm ci  # 第一次安装
time npm run build  # 第一次构建

# 再次运行
time npm run build  # 应该更快

# CI 中检查缓存命中
# 查看 "Cache restore" 或 "Cache hit" 日志
```

---

## 10. 推荐实施方案

### 10.1 立即实施 (本周)

1. **npm 缓存** - 最高 ROI，0.5天
2. **.next 缓存** - 高 ROI，0.5天
3. **Playwright 缓存** - 高 ROI，0.25天

**预期收益**: CI 时间从 2.5-3.5 分钟降至 1-1.5 分钟

### 10.2 后续优化 (下周)

1. 并行测试优化
2. 增量部署方案

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-cicd-optimization/requirements-analysis.md`

**分析师**: Analyst Agent
**日期**: 2026-03-14