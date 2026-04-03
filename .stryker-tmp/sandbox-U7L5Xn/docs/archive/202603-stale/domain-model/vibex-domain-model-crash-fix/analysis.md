# 分析报告: Domain Model TypeError 崩溃修复

**项目**: vibex-domain-model-crash-fix  
**分析时间**: 2026-03-15 14:46  
**优先级**: P0 (阻塞用户核心流程)

---

## 1. 执行摘要

**问题**: 用户在限界上下文生成后，点击"生成领域模型"时出现 TypeError 崩溃。

**根因**: `model/page.tsx` 中 `boundedContexts` 可能为 `undefined` 或空数组，导致 `.filter()` 调用失败。

**影响范围**: 阻塞 DDD 建模核心流程，用户无法完成 Step 3 领域模型生成。

**推荐方案**: 添加防御性检查 + 状态恢复机制。

---

## 2. 问题定义

### 2.1 现象
- 用户在首页输入需求，生成限界上下文
- 进入 Step 2 确认页面，选择核心上下文
- 点击"确认继续"进入 Step 3 领域模型页面
- 页面崩溃，控制台显示 TypeError

### 2.2 错误定位

**主要崩溃点**: `/root/.openclaw/vibex/vibex-fronted/src/app/confirm/model/page.tsx`

```typescript
// Line 43 - 潜在 TypeError
const selectedContexts = boundedContexts.filter((c) =>
  selectedContextIds.includes(c.id)
);
```

**问题**: 如果 `boundedContexts` 为 `undefined` 或 `null`，调用 `.filter()` 会抛出:
```
TypeError: Cannot read properties of undefined (reading 'filter')
```

### 2.3 影响范围

| 影响维度 | 说明 |
|---------|------|
| 用户流程 | 阻塞 Step 1 → Step 3 流程 |
| 功能模块 | DDD 建模核心功能不可用 |
| 用户体验 | 白屏/崩溃，无法继续操作 |
| 业务影响 | 新用户无法体验核心价值 |

---

## 3. 现状分析

### 3.1 数据流分析

```
首页 (confirm/page.tsx)
  ↓ SSE 生成 boundedContexts
  ↓ setBoundedContexts(contexts)
  ↓ 
Step 2 (confirm/context/page.tsx)
  ↓ 用户选择 selectedContextIds
  ↓ goToNextStep()
  ↓ router.push('/confirm/model')
  
Step 3 (confirm/model/page.tsx) ← 此处崩溃
  ↓ boundedContexts.filter(...) ← TypeError
```

### 3.2 状态管理分析

**Store**: `confirmationStore.ts`
- `boundedContexts` 默认值: `[]`
- 通过 `setBoundedContexts()` 更新
- 使用 `zustand/persist` 持久化到 localStorage

**潜在问题**:
1. **持久化延迟**: localStorage 写入是异步的，页面跳转时可能未完成
2. **状态重置**: 某些情况下 store 可能被重置
3. **直接 URL 访问**: 用户直接访问 `/confirm/model` 而没有前置数据

### 3.3 现有防护机制

**context/page.tsx** (Line 38-43):
```typescript
useEffect(() => {
  if (boundedContexts.length === 0 && !loading) {
    alert('请先输入需求描述，AI 将为您生成限界上下文图');
    router.push('/confirm');
  }
}, [boundedContexts, loading, router]);
```

**问题**: 此检查在 `context` 页面，但 `model` 页面缺少类似保护。

---

## 4. 方案对比

### 方案 A: 防御性检查 + 重定向 (推荐)

**实现**:
```typescript
// model/page.tsx
useEffect(() => {
  // 防御性检查
  if (!boundedContexts || boundedContexts.length === 0) {
    router.push('/confirm/context');
    return;
  }
  // ... 原有生成逻辑
}, [boundedContexts, selectedContextIds]);
```

**优点**:
- 改动最小
- 立即生效
- 用户体验友好 (自动跳转回正确步骤)

**缺点**:
- 不解决根因 (数据丢失)

**工作量**: 0.5h

---

### 方案 B: 状态恢复 + 数据缓存

**实现**:
1. 添加 `useAutoSnapshot` 自动保存
2. 添加 localStorage 备份机制
3. 页面加载时恢复数据

**优点**:
- 解决数据丢失问题
- 支持断点续传

**缺点**:
- 改动较大
- 需要测试多个边缘场景

**工作量**: 2h

---

### 方案 C: 使用 SSE 流式 API (长期方案)

**实现**:
1. 将 `model/page.tsx` 改为使用 `useDomainModelStream` hook
2. 与 Step 1 保持一致的 SSE 流式体验

**优点**:
- 用户体验一致
- 实时反馈 AI 思考过程
- 更好的错误处理

**缺点**:
- 需要后端支持 `/ddd/domain-model/stream` API
- 改动较大

**工作量**: 4h (前端) + 2h (后端)

---

## 5. 推荐方案

**短期 (P0)**: 方案 A - 防御性检查 + 重定向  
**中期 (P1)**: 方案 B - 状态恢复机制  
**长期 (P2)**: 方案 C - SSE 流式 API

### 实施步骤 (方案 A)

1. **添加空状态检查** (model/page.tsx)
   ```typescript
   useEffect(() => {
     if (!boundedContexts || boundedContexts.length === 0) {
       // 提示用户并重定向
       setError('请先在上一页选择限界上下文');
       setTimeout(() => router.push('/confirm/context'), 1500);
       return;
     }
   }, [boundedContexts]);
   ```

2. **添加可选链操作符**
   ```typescript
   const selectedContexts = boundedContexts?.filter((c) =>
     selectedContextIds?.includes(c.id)
   ) || [];
   ```

3. **添加加载状态提示**
   ```typescript
   if (!boundedContexts || boundedContexts.length === 0) {
     return <LoadingState message="正在加载数据..." />;
   }
   ```

---

## 6. 验收标准

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| 1 | 直接访问 `/confirm/model` 不崩溃 | 手动测试 |
| 2 | 空数据时自动跳转到正确页面 | E2E 测试 |
| 3 | 正常流程不受影响 | 回归测试 |
| 4 | 控制台无 TypeError | 开发工具检查 |

---

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| 跳转循环 | 低 | 中 | 添加跳转计数器限制 |
| 数据丢失 | 中 | 高 | 方案 B 状态恢复 |
| localStorage 损坏 | 低 | 中 | 添加数据校验 |

---

## 8. 相关文件

```
vibex-fronted/
├── src/app/confirm/model/page.tsx        # 主要修改点
├── src/app/confirm/context/page.tsx      # 参考 (已有保护)
├── src/stores/confirmationStore.ts       # 状态管理
├── src/hooks/useDDDStream.ts             # SSE Hook
└── src/services/api/modules/ddd.ts       # API 接口
```

---

## 9. 附录: 代码修改示例

### model/page.tsx 修改

```typescript
// 在 useEffect 开始处添加防御性检查
useEffect(() => {
  const generateModels = async () => {
    // === 新增: 防御性检查 ===
    if (!boundedContexts || boundedContexts.length === 0) {
      console.warn('[model/page] No bounded contexts, redirecting...');
      setError('请先选择限界上下文');
      setTimeout(() => router.push('/confirm/context'), 1000);
      return;
    }
    
    if (selectedContextIds.length === 0) {
      setError('请至少选择一个限界上下文');
      setTimeout(() => router.push('/confirm/context'), 1000);
      return;
    }
    // === 防御性检查结束 ===
    
    if (selectedContextIds.length > 0 && domainModels.length === 0) {
      // ... 原有逻辑
    }
  };

  generateModels();
}, [selectedContextIds, boundedContexts, requirementText, domainModels.length]);
```

---

**分析完成** ✅