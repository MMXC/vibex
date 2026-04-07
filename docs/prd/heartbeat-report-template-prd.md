# PRD: 心跳报告 Slack Blocks 模板

**项目**: heartbeat-report-template
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

当前心跳报告使用树状文本格式，在 Slack 显示不美观、信息密度低、缺少视觉层次。

### 目标

设计 Slack Blocks 格式的心跳报告模板，提升可读性和信息密度。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 核心信息获取时间 | < 5 秒 |
| 用户满意度 | ≥ 4/5 |

---

## 2. 功能需求

### F1: Slack Blocks 模板

**描述**: 使用 Slack Block Kit 组件构建报告

**验收标准**:
- AC1.1: 使用 Header 组件显示报告标题
- AC1.2: 使用 Section/Fields 显示状态摘要
- AC1.3: 使用 Divider 分隔不同区域
- AC1.4: 使用 Context 显示辅助信息

### F2: 动态变量替换

**描述**: 模板支持动态填充变量

**验收标准**:
- AC2.1: 替换 `{timestamp}` 为当前时间
- AC2.2: 替换 `{status}` 为心跳结果
- AC2.3: 替换 `{active_projects}` 为活跃项目数
- AC2.4: 替换 `{decisions}` 为决策内容

### F3: 视觉设计

**描述**: 使用颜色和图标区分状态

**验收标准**:
- AC3.1: 绿色 ✅ 表示正常
- AC3.2: 黄色 🟡 表示警告
- AC3.3: 红色 🔴 表示错误
- AC3.4: 图标增强可读性

---

## 3. Epic 拆分

### Epic 1: 模板开发

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 创建 Slack Blocks JSON 模板 | expect(template).toBeValidJSON() |
| S1.2 | 实现变量替换函数 | expect(replaceVars(template)).toHaveAllVarsReplaced() |

---

### Epic 2: 集成测试

**负责人**: Tester | **预估**: 0.5h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 发送测试消息到 Slack | expect(message).toBeDelivered() |
| S2.2 | 验证显示效果 | expect(render).toMatchDesign() |

---

## 4. 模板结构

```
📊 Heartbeat Report [时间]
├── 状态摘要 (Fields)
│   ├── 状态: ✅ HEARTBEAT_OK
│   ├── 活跃项目: 3 个
│   ├── 待办事项: 2 项
│   └── 异常: 0 个
├── 活跃项目列表
├── 本轮决策
└── 上下文信息
```

---

## 5. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 模板开发 | 1h |
| Phase 2 | 变量替换 | 1h |
| Phase 3 | 测试验证 | 0.5h |

**总计**: 2.5h

---

## 6. 验收 CheckList

- [ ] AC1.1: Header 组件
- [ ] AC1.2: Section/Fields 组件
- [ ] AC1.3: Divider 组件
- [ ] AC1.4: Context 组件
- [ ] AC2.1: timestamp 替换
- [ ] AC2.2: status 替换
- [ ] AC2.3: active_projects 替换
- [ ] AC2.4: decisions 替换
- [ ] AC3.1: 绿色状态
- [ ] AC3.2: 黄色警告
- [ ] AC3.3: 红色错误
- [ ] AC3.4: 图标使用

---

**DoD**:
1. 模板 JSON 有效
2. 变量正确替换
3. Slack 测试通过
