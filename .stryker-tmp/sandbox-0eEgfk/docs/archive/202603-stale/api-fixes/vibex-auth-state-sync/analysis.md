# 需求分析报告: 认证状态同步 (vibex-auth-state-sync)

**分析日期**: 2026-03-15  
**分析人**: Analyst Agent  
**状态**: 待评审

---

## 一、执行摘要

VibeX 当前认证系统存在**跨标签页/设备状态不同步**和**Token 刷新机制缺失**两大核心问题。建议采用**渐进式增强方案**：先实现跨标签页同步（低风险，2天），再完善 Token 自动刷新（中风险，3天），最后考虑多设备推送（可选，需后端配合）。

**关键指标**:
- 当前问题数: 4 个核心问题
- 推荐方案工作量: 5 人日
- 风险等级: 中等

---

## 二、需求澄清 (5W2H)

| 维度 | 问题 | 澄清后 |
|------|------|--------|
| **What** | 要做什么？ | 实现认证状态的跨标签页/设备同步 + Token 自动刷新 |
| **Why** | 为什么做？ | 用户在多标签页场景下登录/登出不一致导致困惑；Token 过期后无感知刷新导致操作中断 |
| **Who** | 谁使用？ | 所有登录用户，尤其是多标签页工作流用户 |
| **When** | 什么时候？ | Q2 迭代优先级待定 |
| **Where** | 在哪里？ | 前端应用，涉及 Zustand Store + localStorage + 可能的 WebSocket |
| **How** | 怎么做？ | 见方案对比章节 |
| **How Much** | 成本多少？ | 5-10 人日（取决于方案选择） |

---

## 三、现状分析

### 3.1 当前认证架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        VibeX 前端架构                            │
├─────────────────────────────────────────────────────────────────┤
│  useAuth Hook (AuthProvider)     authStore (Zustand)           │
│  ├── localStorage: auth_token     ├── persist to localStorage   │
│  ├── 登录/登出操作                 ├── login/logout/checkAuth   │
│  └── 初始化时获取用户信息           └── syncFromStorage          │
│                                                                  │
│  ⚠️ 问题：两套状态管理并行，存在同步风险                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 代码问题定位

| 问题 | 文件位置 | 影响等级 | 说明 |
|------|----------|----------|------|
| 存储双重标准 | `authStore.ts` + `useAuth.tsx` | 🔴 高 | `auth_token` vs `vibex-auth-storage` 两套存储 |
| 无跨标签页同步 | `authStore.ts` | 🔴 高 | 未监听 storage 事件，标签页间状态孤立 |
| Token 无自动刷新 | `client.ts` | 🟡 中 | 401 时仅清除 token，未尝试刷新 |
| OAuth 与主认证割裂 | `oauth.ts` | 🟡 中 | OAuth 有刷新机制，主认证无 |

### 3.3 现有代码片段分析

**authStore.ts - 无跨标签页同步**:
```typescript
// 当前实现：状态变化不会广播到其他标签页
login: (token, user) => {
  set({ token, user, isAuthenticated: true, isLoading: false });
  // ⚠️ 缺失：没有广播登录事件
},
```

**client.ts - 无 Token 刷新**:
```typescript
// 响应拦截器 - 401 时直接清除
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // ⚠️ 缺失：没有尝试刷新 token
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(transformError(error));
  }
);
```

---

## 四、需求质量评分 (INVEST)

| 维度 | 得分 (1-5) | 问题 |
|------|-----------|------|
| **I**ndependent 独立性 | 3 | 依赖后端 Token 刷新 API（需确认是否存在） |
| **N**egotiable 可协商 | 4 | 有多种技术方案可选 |
| **V**aluable 有价值 | 5 | 直接提升用户体验，减少困惑 |
| **E**stimatable 可估算 | 4 | 技术方案成熟，可估算 |
| **S**mall 粒度适中 | 3 | 建议拆分为 3 个子任务（跨标签页/刷新/多设备） |
| **T**estable 可测试 | 5 | 可通过 E2E 测试验证多标签页场景 |
| **总分** | **24/30** | **通过 (≥21)** |

---

## 五、方案对比

### 方案 A: 轻量级同步（推荐）

**技术栈**: BroadcastChannel API + Storage 事件 + 拦截器增强

| 功能 | 实现方式 | 工作量 |
|------|----------|--------|
| 跨标签页同步 | BroadcastChannel + storage 事件监听 | 1天 |
| Token 自动刷新 | 拦截器增加刷新逻辑 + 后端配合 | 2天 |
| 状态统一 | 合并 authStore 和 useAuth | 1天 |
| 测试覆盖 | E2E 多标签页测试 | 1天 |

**优点**:
- 实现简单，浏览器原生支持
- 无需后端大改（仅需确认刷新 API）
- 兼容性好（BroadcastChannel 支持率 95%+）

**缺点**:
- 同浏览器内有效，跨设备无效
- 需要处理浏览器兼容性降级

### 方案 B: WebSocket 实时同步

**技术栈**: WebSocket + 服务端 Session 管理

| 功能 | 实现方式 | 工作量 |
|------|----------|--------|
| 跨标签页同步 | WebSocket 广播 | 2天 |
| 跨设备同步 | 同上 | 包含在内 |
| Token 刷新 | 服务端主动推送 | 1天 |
| 后端改造 | Session 管理 + WebSocket 服务 | 3天 |
| 测试覆盖 | E2E + 集成测试 | 2天 |

**优点**:
- 支持跨设备同步
- 实时性更好
- 可扩展更多功能（如强制登出）

**缺点**:
- 工作量大（约 8 天）
- 需要后端大量改造
- 增加系统复杂度

### 方案对比总结

| 维度 | 方案 A (轻量级) | 方案 B (WebSocket) |
|------|----------------|-------------------|
| 跨标签页 | ✅ 支持 | ✅ 支持 |
| 跨设备 | ❌ 不支持 | ✅ 支持 |
| 工作量 | 5 人日 | 8 人日 |
| 后端改动 | 小（确认 API） | 大（新服务） |
| 风险等级 | 低 | 中 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 六、推荐方案详细设计

### 6.1 跨标签页同步实现

```typescript
// 新增: authSync.ts
const AUTH_CHANNEL = 'vibex-auth-sync';

interface AuthSyncMessage {
  type: 'login' | 'logout' | 'token-refresh' | 'user-update';
  payload?: { token?: string; user?: User };
}

// 创建广播通道
const channel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel(AUTH_CHANNEL)
  : null;

// 发送认证状态变化
export function broadcastAuthChange(message: AuthSyncMessage) {
  channel?.postMessage(message);
  
  // 同时触发 storage 事件（兼容旧浏览器）
  if (message.type === 'login' && message.payload?.token) {
    localStorage.setItem('auth_sync_event', Date.now().toString());
  }
}

// 监听认证状态变化
export function subscribeToAuthSync(callback: (msg: AuthSyncMessage) => void) {
  channel?.addEventListener('message', (event) => {
    callback(event.data);
  });
  
  // 降级方案：监听 storage 事件
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_sync_event') {
      // 重新检查认证状态
      useAuthStore.getState().syncFromStorage();
    }
  });
}
```

### 6.2 Token 自动刷新实现

```typescript
// 增强拦截器: client.ts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }
  
  isRefreshing = true;
  try {
    const response = await axios.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refresh_token'),
    });
    const newToken = response.data.token;
    localStorage.setItem('auth_token', newToken);
    
    // 通知其他等待的请求
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
    
    return newToken;
  } catch {
    // 刷新失败，登出
    useAuthStore.getState().logout();
    broadcastAuthChange({ type: 'logout' });
    return null;
  } finally {
    isRefreshing = false;
  }
}

// 响应拦截器增强
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 6.3 状态统一方案

**建议**: 保留 `authStore` 作为单一数据源，`useAuth` 作为 hook 封装。

```typescript
// useAuth.tsx - 重构为 authStore 的消费者
export function useAuth() {
  const { user, token, isAuthenticated, isLoading } = useAuthStore();
  
  // ... 操作方法代理到 authStore
}
```

---

## 七、验收标准

### 7.1 功能验收

- [ ] **跨标签页登录同步**: 在 Tab A 登录，Tab B 自动变为登录状态
- [ ] **跨标签页登出同步**: 在 Tab A 登出，Tab B 自动跳转登录页
- [ ] **Token 过期自动刷新**: Token 过期时无感知刷新，用户操作不中断
- [ ] **刷新失败处理**: Token 刷新失败时，正确跳转登录页并提示

### 7.2 性能验收

| 指标 | 目标值 |
|------|--------|
| 跨标签页同步延迟 | < 100ms |
| Token 刷新请求耗时 | < 500ms |
| 页面加载时 auth 初始化 | < 50ms |

### 7.3 兼容性验收

| 浏览器 | 版本要求 | 测试项 |
|--------|----------|--------|
| Chrome | 90+ | 全功能 |
| Firefox | 88+ | 全功能 |
| Safari | 15+ | 全功能（BroadcastChannel 支持） |
| Edge | 90+ | 全功能 |

---

## 八、风险评估

| 风险 | 影响 | 概率 | 等级 | 缓解措施 |
|------|------|------|------|----------|
| 后端无 refresh token API | 高 | 中 | 🔴 High | **阻塞项**：需先确认后端支持 |
| BroadcastChannel 兼容性 | 低 | 低 | 🟢 Low | 降级到 storage 事件 |
| Token 刷新竞态条件 | 中 | 中 | 🟡 Medium | 使用刷新锁 + 队列机制 |
| 刷新 Token 存储 XSS 风险 | 高 | 低 | 🟡 Medium | 考虑 httpOnly Cookie（需后端配合） |

### 阻塞项确认清单

- [ ] 后端 `/auth/refresh` API 是否存在？
- [ ] 返回的 token 是否包含刷新 token？
- [ ] 是否有 session 管理接口？

---

## 九、下一步建议

### 立即行动

1. **确认后端 API** (优先级: P0)
   - 检查 `/auth/refresh` 端点
   - 确认 token 格式和刷新机制

2. **方案确认** (优先级: P0)
   - 与后端确认是否有 WebSocket 基础设施
   - 决定采用方案 A 或方案 B

### 技术准备

1. **创建技术设计文档** → Architect Agent
2. **编写 E2E 测试用例** → QA Agent
3. **估算工作量** → Dev Agent

---

## 附录: 相关文件

| 文件 | 用途 | 改动程度 |
|------|------|----------|
| `src/stores/authStore.ts` | 认证状态管理 | 中 |
| `src/hooks/useAuth.tsx` | 认证 Hook | 重构 |
| `src/services/api/client.ts` | HTTP 客户端 | 中 |
| `src/services/oauth/oauth.ts` | OAuth 服务 | 低 |
| `src/stores/authSync.ts` | 新增：同步模块 | 新文件 |