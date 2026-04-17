# Spec: Epic 3 — 用户漏斗监控体系

**Epic ID**: F3
**文件路径**: /root/.openclaw/vibex/vibex-fronted/src/
**状态**: Pending

---

## F3.1 核心漏斗事件定义

### 事件清单
```typescript
const FUNNEL_EVENTS = [
  'homepage_view',        // 首页访问
  'requirement_submitted', // 需求提交
  'step1_completed',      // Step1 完成
  'step2_completed',      // Step2 完成
  'step3_completed',      // Step3 完成
  'step4_completed',      // Step4 完成
  'canvas_view',         // Canvas 访问
  'project_created',      // 项目创建
];
```

### 触发时机
- `homepage_view`: 首页组件 mount 时
- `requirement_submitted`: 用户点击提交需求按钮
- `stepN_completed`: 每步 AI 分析完成回调
- `canvas_view`: Canvas 页面 load 事件
- `project_created`: 项目创建 API 返回 200

---

## F3.2 埋点接入

### 工具选择
- **推荐**: Plausible Analytics（GDPR 合规，无需 cookie consent）
- **备选**: Umami

### 接入方式
```typescript
// src/lib/analytics/track.ts
import { plauible } from 'plausible-tracker';

export const track = plauible({
  domain: 'vibex.app',
  apiHost: 'https://plausible.io',
});

export function trackEvent(name: string, props?: Record<string, string | number>) {
  track(name, { props });
}
```

---

## F3.3 漏斗 Dashboard

### 展示内容
- 每日/每周 UV 和漏斗各步骤用户数
- 各步骤转化率（与上期对比）
- 导出 CSV 功能

### Dashboard URL
- `/analytics` 或集成到现有管理后台

---

## F3.4 Session 行为序列

### 存储结构
```typescript
interface SessionEvent {
  sessionId: string;
  events: Array<{
    name: string;
    timestamp: number;
    props?: Record<string, unknown>;
  }>;
}
```

### 存储方式
- 优先发送到后端 `/api/analytics/session`
- 后端存储至数据库或日志
