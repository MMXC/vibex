# Spec: E05 — 通知系统（Notification System）

**Epic**: E04 Spec 补全
**Story**: S09
**Agent**: pm
**日期**: 2026-05-07

---

## 1. 概述

定义 VibeX 通知系统的触发时机、通知类型、降级策略。Sprint 29 E01 spec 缺失，本文档补全。

---

## 2. 通知类型

| Type ID | 名称 | 触发时机 | 接收方 | 展示位置 |
|---------|------|---------|--------|---------|
| SHARE_INVITE | 分享邀请 | 用户 A 分享项目给用户 B | 被分享者 B | 顶部 badge + Dashboard 通知列表 |
| SHARE_TO_TEAM | 团队分享 | 用户 A 将项目分享给 Team | Team 成员 | Toast + badge |
| COMMENT_MENTION | @提及 | 评论中 @ 其他用户 | 被 @ 者 | 顶部 badge + 通知列表 |
| PROJECT_UPDATE | 项目更新 | 协作者修改了项目 | 项目成员 | Dashboard 通知列表 |

---

## 3. 触发时机详解

### SHARE_TO_TEAM

```
用户操作: ShareToTeamModal → 选择 Team → 确认发送
→ Backend: 遍历 Team 成员列表
→ 对每个成员创建 SHARE_TO_TEAM 通知记录（DB write）
→ Backend 返回: { notified: N }
→ Frontend Toast: "已通知 N 人"
→ Backend: 触发 RTDB push（若 RTDB 就绪）
```

**边界条件**:
- Team 成员数为 0 → Toast: "团队无成员"
- 成员超过 20 人 → 分批创建通知（每批 20），前端显示进度
- 用户已离开 Team → 跳过，计入 skipped 计数

### SHARE_INVITE

```
用户操作: 分享项目到单个用户邮箱
→ Backend: 查找邮箱对应用户
  - 不存在 → 返回 404 + "用户不存在"
  - 已是项目成员 → 返回 409 + "该用户已是协作者"
→ 创建 SHARE_INVITE 通知
→ 发送邮件（可选，降级）
```

---

## 4. 降级策略（Degradation）

### 通知未送达

| 失败阶段 | 降级策略 |
|---------|---------|
| RTDB write 失败 | 静默降级：DB 通知记录已写入 → UI 仍显示 badge，不抛错 |
| RTDB 整体不可用 | 仅 DB 持久化，用户下次刷新 Dashboard 时展示 |
| 邮件发送失败 | 仅通知记录，Toast 显示"已通知（邮件可能延迟）" |

### ShareBadge 降级

```
try {
  const unreadCount = await fetchUnreadNotifications();
  badge.textContent = unreadCount;   // 正常
} catch (e) {
  badge.textContent = '';             // 隐藏数字
  badge.style.display = 'none';       // 降级：完全不显示 badge
  // 通知数据仍可从 Dashboard 通知列表访问
}
```

### Toast 降级

```
若 Toast 系统不可用：
→ 使用原生 window.alert() 作为最后兜底
→ 不阻塞用户操作
```

---

## 5. ShareBadge 行为规范

| 状态 | 展示 |
|------|------|
| 无未读通知 | badge 隐藏（`display: none`） |
| 1-99 未读 | badge 显示数字，如 `3` |
| ≥100 未读 | badge 显示 `99+` |
| 通知列表已读 | 点击通知列表 → badge 清零 → 隐藏 |

---

## 6. 通知列表 API

```
GET /api/notifications?page=1&limit=20

Response 200:
{
  "data": [
    {
      "id": "notif_001",
      "type": "SHARE_TO_TEAM",
      "projectId": "proj_001",
      "actorId": "user_001",
      "actorName": "张三",
      "message": "张三分享了「项目 A」到你的团队",
      "read": false,
      "createdAt": "2026-05-07T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42 },
  "unreadCount": 3
}
```

---

## 7. DoD

- [ ] 所有通知类型（SHARE_INVITE/SHARE_TO_TEAM/COMMENT_MENTION/PROJECT_UPDATE）有明确触发时机定义
- [ ] RTDB 失败时降级路径明确（DB 持久化兜底，UI 不报错）
- [ ] ShareBadge 状态机完整（隐藏/数字/99+）
- [ ] Toast 降级链路不阻塞用户操作
- [ ] API 错误码覆盖：400/401/403/404
