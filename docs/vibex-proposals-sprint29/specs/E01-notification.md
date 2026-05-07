# Spec: E01-Notification — 分享通知系统（Sprint 29）

**Epic**: E01 项目分享通知
**Story**: S01
**Agent**: pm
**日期**: 2026-04-28

---

## 1. 概述

当用户分享项目给团队成员时，触发通知。支持 Slack DM + 站内降级双通道。

---

## 2. 通知触发时机

| 场景 | 触发条件 | 说明 |
|------|---------|------|
| 项目分享 | 用户点击"分享"按钮并选择成员 | 主要场景 |
| 团队邀请 | 向团队发送邀请链接 | 次要场景 |

---

## 3. 通知通道

### 通道 1: Slack DM（主通道）

**前提条件**: `SLACK_BOT_TOKEN` 环境变量存在且以 `xox` 开头。

**发送内容**:
- 项目分享者名称
- 项目名称
- 可选的留言
- "查看项目" 按钮（链接到 `/canvas/:projectId`）

**响应字段**:
```typescript
{
  success: true;
  channel: 'slack';
  notificationId: string; // `${timestamp}-${random}`
  deliveredAt: string; // ISO datetime
}
```

### 通道 2: 站内通知（降级通道）

**触发条件**: Slack token 不存在或 Slack API 返回失败。

**存储结构**:
```typescript
Map<userId, Array<{
  id: string;
  read: boolean;
  createdAt: string;
}>>
```

**响应字段**:
```typescript
{
  success: true;
  channel: 'inapp';
  notificationId: string;
  deliveredAt: string;
}
```

---

## 4. 降级策略

```
尝试 Slack DM
  → token 存在? 否 → 降级站内
  → API 返回 ok? 否 → 静默降级站内（console.error）
  → 降级站内
```

**原则**: Slack 失败绝不阻断分享流程，降级站内通知静默进行。

---

## 5. API 接口

### `POST /api/notifications/share`

**Request**:
```typescript
{
  projectId: string;
  recipientId: string; // 用户 ID 或 Slack channel ID
  senderName: string;
  projectName: string;
  message?: string; // 可选的留言
}
```

**Response**:
```typescript
// Success
{
  success: true;
  channel: 'slack' | 'inapp';
  notificationId: string;
  deliveredAt: string;
}

// Error
{
  success: false;
  error: 'PERMISSION_DENIED' | 'SLACK_API_ERROR' | 'INTERNAL_ERROR';
  message: string;
}
```

### `GET /api/notifications/inapp`

**Response**:
```typescript
Array<{
  id: string;
  read: boolean;
  createdAt: string;
}>
```

---

## 6. ShareBadge 前端组件

**data-testid**: `data-testid="share-badge"`

**行为**:
- `count <= 0`: 不渲染
- `count > 0`: 显示红色 dot + 数字
- `count > 99`: 显示 `99+`

**Props**:
```typescript
interface ShareBadgeProps {
  count: number;
  onClick?: () => void;
}
```

---

## 7. Error Handling

| 场景 | 行为 |
|------|------|
| Slack token 不存在 | 降级站内通知 |
| Slack API 返回 error | 静默降级站内 |
| Slack fetch 抛出异常 | 静默降级站内 |
| recipientId 不存在 | 站内创建空通知队列 |

---

## 8. DoD

- [x] NotificationService Slack DM + in-app fallback
- [x] 静默降级（不阻断分享流程）
- [x] ShareBadge data-testid="share-badge"
- [x] count > 0 时显示，count = 0 时隐藏
- [x] 99+ 超限显示
