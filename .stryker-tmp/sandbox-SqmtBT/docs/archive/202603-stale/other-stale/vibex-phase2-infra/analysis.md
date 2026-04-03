# Phase 2 基础设施优化分析报告

**项目**: vibex-phase2-infra
**分析师**: Analyst Agent
**日期**: 2026-03-15

---

## 执行摘要

针对 VibeX 项目的基础设施优化需求，分析**图片 CDN 配置**和**API 重试熔断机制**两个核心模块。当前项目使用静态导出 (`output: 'export'`)，图片无优化配置，API 客户端缺少重试和熔断机制。建议采用 **Cloudflare Images CDN** 和 **axios-retry + circuit-breaker-js** 方案，总工期 **3 天**。

---

## 1. 图片 CDN 配置方案分析

### 1.1 当前状态

| 维度 | 当前配置 | 问题 |
|------|----------|------|
| 图片优化 | `unoptimized: true` | 无优化，大图直接加载 |
| CDN | 无 | 所有资源从源站加载 |
| 图片格式 | 原始格式 | 未使用 WebP/AVIF |
| 懒加载 | 未实现 | 所有图片立即加载 |
| 缓存策略 | 默认 | 无长期缓存 |

**next.config.ts 当前配置**:
```typescript
images: {
  unoptimized: true,  // ❌ 禁用了所有图片优化
},
```

### 1.2 技术选型对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Cloudflare Images** | 与现有部署集成、免费额度、自动优化 | 需上传图片到 CF | ⭐⭐⭐⭐⭐ |
| Cloudinary | 功能丰富、自动格式转换 | 免费额度有限、第三方依赖 | ⭐⭐⭐⭐ |
| Imgix | 动态处理、简单集成 | 价格较高 | ⭐⭐⭐ |
| 自建 CDN | 完全可控 | 维护成本高 | ⭐⭐ |

### 1.3 推荐方案: Cloudflare Images

**架构**:
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Images                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户请求图片                                                 │
│       │                                                      │
│       ▼                                                      │
│  Cloudflare Edge → 缓存检查                                  │
│       │                                                      │
│       ├─ 命中缓存 → 直接返回 (CDN 缓存)                       │
│       │                                                      │
│       └─ 未命中 → 回源站/CF Images 处理                       │
│                    │                                         │
│                    ▼                                         │
│              自动优化 (WebP/AVIF/Resize)                      │
│                    │                                         │
│                    ▼                                         │
│              缓存到边缘节点                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**实施步骤**:

#### Step 1: 配置 Cloudflare Images

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    // 使用 Cloudflare Images 作为 loader
    loader: 'custom',
    loaderFile: './lib/cf-image-loader.ts',
    // 图片尺寸预设
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

#### Step 2: 创建 Cloudflare Image Loader

```typescript
// lib/cf-image-loader.ts
import { ImageLoader } from 'next/image';

const cfImageLoader: ImageLoader = ({ src, width, quality }) => {
  const cfAccountHash = process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH;
  const cfImageId = src.replace(/^\/images\//, '');
  
  return `https://imagedelivery.net/${cfAccountHash}/${cfImageId}/w=${width},q=${quality || 75}`;
};

export default cfImageLoader;
```

#### Step 3: 更新图片使用方式

```tsx
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/images/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  loading="lazy"
  priority={false}
/>
```

### 1.4 性能收益预估

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 图片加载时间 | 2-5s | 0.3-1s | 70% ↓ |
| 带宽消耗 | 100% | 30-50% | 50-70% ↓ |
| LCP | 3.5s | 1.5s | 57% ↓ |

### 1.5 工作量评估

| 任务 | 工时 | 说明 |
|------|------|------|
| CF Images 配置 | 2h | 控制台配置 |
| next.config 修改 | 1h | 代码修改 |
| loader 文件创建 | 2h | 开发测试 |
| 图片迁移 | 4h | 上传现有图片 |
| 测试验证 | 2h | 性能测试 |

**总计**: 1.5 天

---

## 2. API 重试熔断机制设计

### 2.1 当前状态

| 维度 | 当前实现 | 问题 |
|------|----------|------|
| 重试机制 | ❌ 无 | 网络抖动直接失败 |
| 熔断机制 | ❌ 无 | 服务故障时持续请求 |
| 超时控制 | 10s 固定 | 无动态调整 |
| 错误分类 | 简单 | 未区分可重试错误 |

**src/services/api/client.ts 当前实现**:
```typescript
const instance = axios.create({
  baseURL,
  timeout: 10000,  // 固定超时
  headers: { 'Content-Type': 'application/json' },
});

// ❌ 无重试逻辑
// ❌ 无熔断保护
```

### 2.2 重试机制设计

#### 技术选型

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **axios-retry** | 简单易用、与 axios 集成 | 仅支持 axios | ⭐⭐⭐⭐⭐ |
| retry-axios | 功能类似 | 维护不如 axios-retry | ⭐⭐⭐⭐ |
| 自定义重试 | 完全可控 | 开发成本高 | ⭐⭐⭐ |

#### 实施方案

```typescript
// lib/api-retry.ts
import axiosRetry from 'axios-retry';
import { HttpClient } from '@/services/api/client';

export function configureRetry(client: HttpClient) {
  axiosRetry(client.instance, {
    // 重试次数
    retries: 3,
    
    // 重试条件：网络错误或 5xx 错误
    retryCondition: (error) => {
      return (
        axiosRetry.isNetworkError(error) ||
        axiosRetry.isRetryableError(error) ||
        (error.response?.status ?? 0) >= 500
      );
    },
    
    // 指数退避
    retryDelay: axiosRetry.exponentialDelay,
    
    // 重试回调
    onRetry: (retryCount, error, requestConfig) => {
      console.warn(`API retry ${retryCount}: ${requestConfig.url}`, error.message);
    },
  });
}
```

### 2.3 熔断机制设计

#### 技术选型

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **circuit-breaker-js** | 轻量、功能完整 | 需要集成 | ⭐⭐⭐⭐⭐ |
| opossum | 功能丰富 | 较重 | ⭐⭐⭐⭐ |
| 自定义实现 | 完全可控 | 开发成本高 | ⭐⭐⭐ |

#### 实施方案

```typescript
// lib/circuit-breaker.ts
import CircuitBreaker from 'circuit-breaker-js';

export class ApiCircuitBreaker {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  getBreaker(apiName: string): CircuitBreaker {
    if (!this.breakers.has(apiName)) {
      const breaker = new CircuitBreaker({
        // 失败阈值
        volumeThreshold: 5,
        
        // 熔断时间窗口
        windowDuration: 60000, // 1 分钟
        
        // 半开状态尝试次数
        numBuckets: 10,
        
        // 失败率阈值
        failureRateThreshold: 0.5, // 50%
        
        // 熔断持续时间
        openDuration: 30000, // 30 秒
        
        // 状态变化回调
        onCircuitOpen: () => {
          console.error(`Circuit OPEN: ${apiName}`);
          // 可选：发送告警
        },
        
        onCircuitClose: () => {
          console.log(`Circuit CLOSED: ${apiName}`);
        },
      });
      
      this.breakers.set(apiName, breaker);
    }
    
    return this.breakers.get(apiName)!;
  }
  
  async execute<T>(apiName: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(apiName);
    
    return new Promise((resolve, reject) => {
      breaker.execute(async (success, failure) => {
        try {
          const result = await fn();
          success();
          resolve(result);
        } catch (error) {
          failure();
          reject(error);
        }
      });
    });
  }
}

// 单例
export const apiCircuitBreaker = new ApiCircuitBreaker();
```

### 2.4 完整集成方案

```typescript
// services/api/client-with-resilience.ts
import { createHttpClient, HttpClient } from './client';
import { configureRetry } from '@/lib/api-retry';
import { apiCircuitBreaker } from '@/lib/circuit-breaker';

export function createResilientClient(): HttpClient {
  const client = createHttpClient();
  
  // 配置重试
  configureRetry(client);
  
  return client;
}

// 使用示例
export async function fetchWithErrorHandling<T>(
  apiName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await apiCircuitBreaker.execute(apiName, fn);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Circuit')) {
      // 熔断状态，返回降级数据或友好提示
      throw new Error('服务暂时不可用，请稍后重试');
    }
    throw error;
  }
}
```

### 2.5 工作量评估

| 任务 | 工时 | 说明 |
|------|------|------|
| axios-retry 集成 | 2h | 安装配置 |
| circuit-breaker 实现 | 4h | 开发测试 |
| 客户端集成 | 2h | 改造现有代码 |
| 测试用例 | 3h | 单元测试 |
| 文档编写 | 1h | 使用文档 |

**总计**: 1.5 天

---

## 3. 技术选型总结

### 3.1 图片 CDN

| 维度 | 选择 | 理由 |
|------|------|------|
| 服务商 | Cloudflare Images | 与现有 CF 部署集成 |
| 图片格式 | WebP/AVIF | 自动转换，兼容性好 |
| 懒加载 | next/image | 内置支持 |

### 3.2 API 健壮性

| 维度 | 选择 | 理由 |
|------|------|------|
| 重试 | axios-retry | 与 axios 深度集成 |
| 熔断 | circuit-breaker-js | 轻量、功能完整 |
| 降级 | 自定义 | 业务特定 |

---

## 4. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| CF Images 配额限制 | 🟡 中 | 监控使用量，设置告警 |
| 重试风暴 | 🟡 中 | 限制重试次数 + 指数退避 |
| 熔断误触发 | 🟢 低 | 合理设置阈值 |
| 迁移期间服务中断 | 🟢 低 | 灰度发布 |

---

## 5. 实施计划

### Phase 1: 图片 CDN (1.5 天)

| 步骤 | 工时 | 内容 |
|------|------|------|
| 1.1 | 2h | Cloudflare Images 配置 |
| 1.2 | 1h | next.config.ts 修改 |
| 1.3 | 2h | loader 文件开发 |
| 1.4 | 4h | 图片迁移 |
| 1.5 | 2h | 测试验证 |

### Phase 2: API 重试熔断 (1.5 天)

| 步骤 | 工时 | 内容 |
|------|------|------|
| 2.1 | 2h | axios-retry 集成 |
| 2.2 | 4h | circuit-breaker 实现 |
| 2.3 | 2h | 客户端改造 |
| 2.4 | 3h | 测试用例 |
| 2.5 | 1h | 文档编写 |

**总工期**: 3 天

---

## 6. 验收标准

### 6.1 图片 CDN

- [ ] Cloudflare Images 配置完成
- [ ] next.config.ts 使用 custom loader
- [ ] 图片加载时间 < 1s
- [ ] LCP < 2s

### 6.2 API 重试熔断

- [ ] axios-retry 配置生效
- [ ] 网络错误自动重试 3 次
- [ ] 熔断器在失败率 > 50% 时打开
- [ ] 熔断后返回友好提示

### 6.3 测试覆盖

```bash
# CDN 测试
curl -I https://imagedelivery.net/.../hero.png
# 期望: Cache-Control: public, max-age=...

# 重试测试
# 模拟 500 错误，验证重试日志

# 熔断测试
# 连续触发失败，验证熔断生效
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-phase2-infra/analysis.md`

**分析师**: Analyst Agent
**日期**: 2026-03-15