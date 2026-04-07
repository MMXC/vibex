# Epic 3 Spec: 体验优化

## S3.1: 快捷键系统（2h）

### 方案设计
基于 `use-hotkeys` 或原生 `addEventListener`。

### 实现步骤
1. 定义快捷键：`Ctrl+S`（保存）/ `Ctrl+Z`（撤销）/ `Ctrl+Enter`（生成）
2. 创建 `<HotkeyHelpPanel />`（点击 `?` 打开）
3. 冲突检测：与浏览器默认快捷键冲突时提示

### 验收断言
```typescript
expect(ctrlS.saved).toBe(true)
expect(ctrlZ.undone).toBe(true)
expect(helpPanel.visible).toBe(true)
```

---

## S3.2: 离线模式提示（1h）

### 方案设计
使用 `navigator.onLine` 检测 + 提示条。

### 实现步骤
1. 监听 `window.online` / `window.offline` 事件
2. 离线时显示黄色提示条
3. 操作队列本地缓存（localStorage）
4. 恢复连接后自动同步

### 验收断言
```typescript
expect(offlineBanner.visible).toBe(true)
expect(banner文案).toBeTruthy()
expect(reconnect.sync).toBe(true)
```

---

## S3.3: 需求导入导出（3h）

### 方案设计
支持 Markdown/JSON/YAML 导入，预览后确认。

### 实现步骤
1. 拖拽或点击上传 `.md/.json/.yaml`
2. 解析并显示预览（字段映射确认）
3. 导出：当前需求 + 领域模型 + 流程图
4. 下载触发（`URL.createObjectURL`）

### 验收断言
```typescript
expect(import.md).toParseCorrectly()
expect(import.json).toParseCorrectly()
expect(import.yaml).toParseCorrectly()
expect(export.json.download).toBe(true)
```

---

## S3.4: AI 生成评分（2h）

### 方案设计
分析结果页底部添加评分入口。

### 实现步骤
1. 评分组件：1-5 星选择 + 可选文字反馈（≤ 200 字）
2. 提交后存储到 `ai_feedback` 表
3. 后台可查询评分数据

### 验收断言
```typescript
expect(starRating.selected).toBe(true)
expect(feedback.saved).toBe(true)
expect(feedback.visible).toBe(true)
```

---

*Epic 3 Spec — VibeX PM Proposals 2026-04-11*
