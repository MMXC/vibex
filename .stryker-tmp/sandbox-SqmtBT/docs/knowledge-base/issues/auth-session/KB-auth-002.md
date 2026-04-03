# KB-auth-002: 登录状态和实时预览问题

> 从 VIBEX-007 迁移

---

## 基本信息

| 字段 | 内容 |
|------|------|
| **问题 ID** | KB-auth-002 |
| **标题** | 登录状态和实时预览问题 |
| **严重级别** | P0 |
| **影响范围** | 认证 + 预览模块 |
| **发现日期** | 2026-03-12 |
| **状态** | Resolved |

---

## 问题描述

### 现象描述
登录状态与实时预览功能联动存在问题，用户登录后预览不更新。

### 影响分析
- 用户无法实时看到预览
- 功能体验断裂

---

## 根因分析 (Root Cause Analysis)

### 问题根因
预览组件未订阅认证状态变化。

### 技术细节
```typescript
// 问题代码
const preview = usePreview();
// 未监听 auth 状态变化
```

### 正确做法
```typescript
// 修复后
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
useEffect(() => {
  if (isAuthenticated) refreshPreview();
}, [isAuthenticated]);
```

---

## 解决方案

### 修复方案
让预览组件订阅认证状态，状态变化时刷新预览。

---

## 防范机制 (Prevention)

### 短期措施
- [x] 添加状态联动测试

### 长期措施
- [ ] 建立状态依赖管理规范

---

## 关联问题 (Related Issues)

| 关联类型 | 问题 ID | 描述 |
|----------|---------|------|
| 相关 | KB-auth-001 | 登录状态持久化 |
| 相关 | KB-ui-003 | 预览区域 |

---

*最后更新: 2026-03-15*
