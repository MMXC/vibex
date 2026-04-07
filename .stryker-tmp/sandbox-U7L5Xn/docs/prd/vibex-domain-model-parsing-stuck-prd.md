# PRD: 领域模型 Parsing 卡顿问题修复

**项目**: vibex-domain-model-parsing-stuck
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

领域模型生成时 ThinkingPanel 卡在 'parsing' 步骤，AI stream 接口已返回完整内容但状态不变。

### 目标

修复后端错误处理，确保异常时发送 error 事件；前端增加超时检测。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 错误事件发送率 | 100% |
| 超时检测响应 | ≤ 60s |

---

## 2. 问题陈述

### 2.1 用户痛点

- ThinkingPanel 卡在 'parsing' 步骤
- 进度条显示 67%
- 无法进入下一步骤

### 2.2 根因

后端 `parseJSONWithRetry` 返回 null 抛出异常，但未发送 error 事件到前端。

---

## 3. 功能需求

### F1: 后端错误处理增强

**描述**: 确保所有异常都发送 error 事件

**验收标准**:
- AC1.1: AI 返回格式错误时发送 error 事件
- AC1.2: JSON 解析失败时发送 error 事件
- AC1.3: 所有异常都被捕获并记录日志

### F2: 前端超时检测

**描述**: 增加请求超时检测

**验收标准**:
- AC2.1: 60 秒无响应时自动超时
- AC2.2: 超时后显示错误信息
- AC2.3: 可重试

---

## 4. Epic 拆分

### Epic 1: 后端错误处理

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 增强 ddd.ts 错误处理 | expect(error).toSendErrorEvent() |
| S1.2 | 确保 controller.close() 在 finally 中调用 | expect(stream).toClose() |

---

### Epic 2: 前端超时检测

**负责人**: Dev | **预估**: 0.5h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 添加 setTimeout 超时检测 | expect(timeout).toTriggerAfter(60000) |
| S2.2 | 超时后设置 error 状态 | expect(status).toBe('error') |

---

### Epic 3: 测试验证

**负责人**: Tester | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S3.1 | 模拟错误 JSON 格式 | expect(errorEvent).toBeReceived() |
| S3.2 | 模拟超时场景 | expect(timeoutError).toBeShown() |

---

## 5. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 后端错误处理 | 1h |
| Phase 2 | 前端超时检测 | 0.5h |
| Phase 3 | 测试验证 | 1h |

**总计**: 2.5h

---

## 6. 验收 CheckList

- [ ] AC1.1: 格式错误发送 error
- [ ] AC1.2: 解析失败发送 error
- [ ] AC1.3: 日志记录
- [ ] AC2.1: 60s 超时
- [ ] AC2.2: 超时错误信息
- [ ] AC2.3: 可重试

---

**DoD**:
1. 代码合并
2. 错误场景测试通过
3. 无回归问题
