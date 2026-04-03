# PRD: vibex-domain-model-parsing-stuck - 领域模型 Parsing 卡顿修复

**项目**: vibex-domain-model-parsing-stuck  
**版本**: 1.0  
**日期**: 2026-03-16  
**状态**: 待开发  
**优先级**: 🔴 高

---

## 1. 执行摘要

### 1.1 背景

领域模型生成时 ThinkingPanel 卡在 'parsing' 步骤，AI stream 接口已返回完整内容但状态不变。

### 1.2 根因

后端 `aiService.generateJSON()` 返回的 JSON 格式不符合预期，`parseJSONWithRetry` 返回 `null`，抛出异常但前端未收到 `error` 事件。

### 1.3 目标

1. 增强后端 JSON 解析错误处理
2. 确保异常时发送 error 事件
3. 前端增加超时检测

---

## 2. 功能需求

### F1: 后端错误事件发送

**描述**: 当 AI 返回格式错误或 JSON 解析失败时，后端应发送明确的 error 事件

**验收标准**:
```typescript
// 模拟 AI 返回错误格式
mockAI.returnFormatError();
const events = await getSSEEvents('/api/ddd/domain-model/stream');
expect(events).toContainEqual(expect.objectContaining({ type: 'error' }));
```

**【需页面集成】**: 后端 ddd.ts

---

### F2: JSON 解析失败处理

**描述**: 当 JSON 解析失败时，后端应发送 error 事件而非静默失败

**验收标准**:
```typescript
mockAI.returnIncompleteJSON();
const events = await getSSEEvents('/api/ddd/domain-model/stream');
expect(events).toContainEqual(expect.objectContaining({
  type: 'error',
  message: expect.stringContaining('解析')
}));
```

---

### F3: 前端超时检测

**描述**: 前端设置 60 秒超时，逾时自动切换为 error 状态

**验收标准**:
```typescript
// 模拟无响应
mockNetwork.delay(70000);
await generateDomainModels();
expect(status).toBe('error');
expect(errorMessage).toContain('超时');
```

**【需页面集成】**: useDDDStream.ts

---

### F4: 日志记录

**描述**: 后端记录所有错误详情便于排查

**验收标准**:
```typescript
mockAI.returnError();
await generateDomainModels();
const logs = getBackendLogs();
expect(logs).toContain('[Domain Model Stream]');
expect(logs).toContain('Error');
```

---

### F5: 正常流程验证

**描述**: 正常生成完成后 ThinkingPanel 显示 done 状态

**验收标准**:
```typescript
await generateDomainModels();
expect(status).toBe('done');
expect(thinkingPanel).toShowStep('parsing', 'complete');
```

---

## 3. Epic 拆分

### Epic 1: 后端错误处理增强 (1h)

| Story | 描述 | 验收点 |
|-------|------|--------|
| S1.1 | 增强 ddd.ts 错误处理 | 格式错误时发送 error |
| S1.2 | 添加详细日志 | 记录所有错误详情 |
| S1.3 | 确保 finally 关闭连接 | controller.close() |

**DoD**:
- [ ] 格式错误发送 error 事件
- [ ] 解析失败发送 error 事件
- [ ] 日志记录完整

---

### Epic 2: 前端超时检测 (0.5h)

| Story | 描述 | 验收点 |
|-------|------|--------|
| S2.1 | 添加 setTimeout | 60秒超时 |
| S2.2 | 超时切换 error 状态 | 显示超时提示 |
| S2.3 | 清除超时定时器 | done/error 时清除 |

---

### Epic 3: 测试验证 (1h)

| Story | 描述 | 验收点 |
|-------|------|--------|
| S3.1 | 错误格式测试 | 验证 error 事件 |
| S3.2 | 超时测试 | 验证超时处理 |
| S3.3 | 回归测试 | 限界上下文/业务流程正常 |

---

## 4. 工作量

| 阶段 | 工时 |
|------|------|
| 后端错误处理 | 1h |
| 前端超时检测 | 0.5h |
| 测试验证 | 1h |
| **总计** | **2.5h** |

---

## 5. 风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| 修复影响其他 SSE | 🟢 低 | 测试所有端点 |

---

**后续**: Architect → Dev → Tester → Reviewer
