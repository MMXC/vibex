# PRD: API 错误处理统一

**项目名称**: vibex-api-error-handling  
**版本**: 1.0  
**创建日期**: 2026-03-04  
**负责人**: PM Agent

---

## 1. 项目目标

统一 API 错误处理，减少 30%+ 重复代码，建立统一错误码映射和用户提示规范。

---

## 2. 问题分析

| 问题 | 当前状态 |
|------|----------|
| 重复代码 | 92 个 try-catch 块，20+ alert() 调用 |
| 体验不一致 | alert / setError / console.error 混用 |
| 错误码不统一 | 同一错误不同页面显示不同文案 |

---

## 3. 功能需求

### 3.1 错误码规范

| ID | 错误码 | 中文消息 | 优先级 |
|----|--------|----------|--------|
| F3.1.1 | AUTH_001 | 登录已过期，请重新登录 | P0 |
| F3.1.2 | AUTH_002 | 邮箱或密码错误 | P0 |
| F3.1.3 | PROJECT_001 | 项目不存在 | P0 |
| F3.1.4 | PROJECT_002 | 没有操作权限 | P0 |
| F3.1.5 | API_001 | 网络连接失败 | P0 |
| F3.1.6 | API_002 | 请求超时 | P0 |
| F3.1.7 | API_003 | 服务器繁忙，请稍后重试 | P0 |
| F3.1.8 | VALIDATION_001 | 输入信息有误 | P1 |

### 3.2 统一错误拦截

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.2.1 | HTTP 状态码处理 | 400/401/403/404/409/500 统一处理 | P0 |
| F3.2.2 | 错误码映射 | 错误码 → 中文消息 | P0 |
| F3.2.3 | 错误日志记录 | 统一格式日志，便于调试 | P1 |
| F3.2.4 | 错误追踪 ID | 每个错误生成唯一 ID | P2 |

### 3.3 通知展示系统

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.3.1 | Toast 通知 | 替代 alert()，统一展示 | P0 |
| F3.3.2 | 成功提示 | 操作成功后显示绿色 Toast | P0 |
| F3.3.3 | 错误提示 | 失败后显示红色 Toast | P0 |
| F3.3.4 | 警告提示 | 警告场景显示黄色 Toast | P1 |
| F3.3.5 | 自动关闭 | 3 秒后自动关闭 | P1 |

### 3.4 useApiResult Hook

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.4.1 | 执行方法 | execute() 方法触发 API 调用 | P0 |
| F3.4.2 | 状态返回 | loading/error/data 状态 | P0 |
| F3.4.3 | 回调支持 | onSuccess/onError 回调 | P0 |
| F3.4.4 | Toast 控制 | showSuccessToast/showErrorToast | P1 |

### 3.5 向后兼容

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.5.1 | API 签名不变 | apiService 方法签名保持不变 | P0 |
| F3.5.2 | 渐进迁移 | 新功能用新方案，旧代码保持兼容 | P1 |

---

## 4. 技术方案

### 4.1 错误码常量

```typescript
// constants/errorCodes.ts
export const ErrorCodes = {
  AUTH: {
    EXPIRED: 'AUTH_001',
    INVALID_CREDENTIALS: 'AUTH_002',
  },
  PROJECT: {
    NOT_FOUND: 'PROJECT_001',
    PERMISSION_DENIED: 'PROJECT_002',
  },
  API: {
    NETWORK_ERROR: 'API_001',
    TIMEOUT: 'API_002',
    SERVER_ERROR: 'API_003',
  },
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION_001',
  },
} as const
```

### 4.2 useApiResult Hook

```typescript
// hooks/useApiResult.ts
interface UseApiResultOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

function useApiResult<T>(
  apiFn: () => Promise<T>,
  options: UseApiResultOptions<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async () => {
    setLoading(true);
    try {
      const result = await apiFn();
      setData(result);
      options.onSuccess?.(result);
      if (options.showSuccessToast) {
        toast.success('操作成功');
      }
    } catch (err) {
      const apiError = transformError(err);
      setError(apiError);
      options.onError?.(apiError);
      if (options.showErrorToast) {
        toast.error(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, data };
}
```

### 4.3 Toast 使用

```typescript
import { toast } from '@/lib/toast';

// 成功
toast.success('保存成功');

// 错误
toast.error('网络连接失败');

// 警告
toast.warning('网络不稳定');

// 信息
toast.info('正在处理...');
```

---

## 5. 验收标准

### P0 功能

| 验收项 | 测试方法 |
|--------|----------|
| 401 错误显示"登录已过期" | mock 401 响应，检查提示 |
| 400 错误显示"输入信息有误" | mock 400 响应，检查提示 |
| 500 错误显示"服务器繁忙" | mock 500 响应，检查提示 |
| 操作成功显示 Toast | 执行成功操作，检查 Toast |
| 操作失败显示 Toast | 执行失败操作，检查 Toast |
| useApiResult 返回正确状态 | 测试 loading/error/data 变化 |

### P1 功能

| 验收项 | 测试方法 |
|--------|----------|
| Toast 3 秒自动关闭 | 显示 Toast，检查自动消失 |
| 警告提示正常显示 | 触发警告场景，检查黄色提示 |
| 向后兼容现有 API | 现有功能测试通过 |

---

## 6. Epic 拆解

### Epic 1: 基础设施 (P0)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 错误码常量 | ErrorCodes 定义完整 | 1h |
| useApiResult Hook | 状态和回调正常工作 | 2h |
| Toast 通知系统 | 成功/失败/警告提示正常 | 2h |

### Epic 2: 服务层增强 (P0)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| HTTP 状态码处理 | 400/401/403/404/409/500 正确处理 | 1h |
| 错误码映射 | 错误码映射到中文消息 | 1h |

### Epic 3: 页面迁移 (P1)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| Dashboard 迁移 | 使用新 Hook | 1h |
| Project Settings 迁移 | 使用新 Hook | 1h |
| 其他页面迁移 | 使用新 Hook | 2h |

### Epic 4: 清理 (P2)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 移除 alert() | alert() 调用减少 90% | 1h |
| 统一日志格式 | console.error 格式统一 | 1h |

---

## 7. 预期收益

| 指标 | 当前 | 目标 |
|------|------|------|
| 错误处理代码 | ~500 行 | ~150 行 |
| 重复代码比例 | 30%+ | <5% |

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: PM Agent*