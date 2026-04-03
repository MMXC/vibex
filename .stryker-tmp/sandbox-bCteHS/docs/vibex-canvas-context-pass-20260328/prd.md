# PRD: vibex-canvas-context-pass

**项目**: vibex-canvas-context-pass-20260328  
**任务**: create-prd  
**创建时间**: 2026-03-28 16:38  
**PM**: pm agent

---

## 一、项目背景

| 项目 | 内容 |
|------|------|
| **目标** | 修复「继续·流程树」按钮点击后没有携带用户编辑确认的上下文树信息请求后端的问题 |
| **问题** | 用户编辑上下文树后点击按钮，后端无法获取最新上下文数据，导致操作被忽略 |
| **预期收益** | 用户编辑的上下文数据能正确传递到后端，流程生成基于最新数据 |

---

## 二、功能范围

### Epic 1: 上下文数据传递修复

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Store 上下文同步 | 上下文树编辑后，Zustand store 正确更新 contextTree 字段 | `expect(screen.getByText('提交')).toBeDisabled()` 在未保存时禁用 | 【需页面集成】 |
| F1.2 | API 调用参数传递 | 「继续·流程树」按钮 onClick handler 从 store 读取 contextTree 并传递给 API | `expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({ contextTree: expect.any(Object) }))` | 【需页面集成】 |
| F1.3 | 后端参数接收 | 后端接口正确接收并使用 contextTree 参数 | `expect(response).toContainKey('flowTree')` 基于 contextTree 生成 | N/A |
| F1.4 | 数据流验证 | 完整数据流：编辑 → Store 更新 → API 调用 → 后端响应 | 端到端测试通过 | 【需页面集成】 |

---

## 三、优先级矩阵

| 优先级 | 功能点 | 理由 |
|--------|--------|------|
| **P0** | F1.1, F1.2 | 核心数据流，阻塞功能 |
| **P0** | F1.3 | 后端必须适配 |
| **P1** | F1.4 | 完整验证，确保修复有效 |

---

## 四、约束与边界

### 包含
- [x] 上下文树数据结构定义
- [x] Zustand store contextTree 字段更新逻辑
- [x] 「继续·流程树」按钮 API 调用参数构造
- [x] 后端接口参数接收
- [x] 端到端数据流验证

### 不包含
- [ ] 上下文树编辑 UI 优化
- [ ] 上下文树数据结构变更
- [ ] 流程树生成算法优化
- [ ] 其他按钮的上下文传递

### 红线约束
- ❌ 不能破坏现有 Store 其他字段的正常工作
- ❌ 不能影响其他 API 调用的参数传递
- ❌ 不能引入新的 console.error 或 unhandled rejection

---

## 五、验收标准（可写断言）

### F1.1 Store 上下文同步

```
GIVEN 用户编辑了上下文树
WHEN 编辑完成
THEN useDDDStore.getState().contextTree 包含最新编辑的数据
     expect(store.getState().contextTree).toEqual(expect.objectContaining({
       nodes: expect.any(Array),
       edges: expect.any(Array)
     }))
```

### F1.2 API 调用参数传递

```
GIVEN 用户编辑了上下文树并点击「继续·流程树」按钮
WHEN API 请求发出
THEN 请求 body 包含 contextTree 字段
     expect(fetch).toHaveBeenCalledWith(
       expect.any(String),
       expect.objectContaining({
         body: expect.stringContaining('"contextTree"')
       })
     )
```

### F1.3 后端参数接收

```
GIVEN 前端发送了包含 contextTree 的请求
WHEN 后端处理请求
THEN 后端日志/响应显示 contextTree 被正确解析
     expect(response.status).toBe(200)
     expect(response.body.flowTree).toBeDefined()
```

### F1.4 端到端验证

```
GIVEN 用户完整操作流程：编辑上下文 → 点击按钮 → 查看结果
WHEN 操作完成
THEN 结果反映用户的最新编辑
     // 可用 gstack 自动化测试
```

---

## 六、用户流程

```
┌─────────────────┐
│  1. 编辑上下文树  │ ← 用户操作
└────────┬────────┘
         │ Store 更新
         ▼
┌─────────────────┐
│  2. 点击「继续·   │ ← 问题点：是否传 contextTree?
│     流程树」按钮  │
└────────┬────────┘
         │ API 调用 (contextTree 参数)
         ▼
┌─────────────────┐
│  3. 后端接收并   │
│     使用参数     │
└────────┬────────┘
         │ 响应
         ▼
┌─────────────────┐
│  4. 显示基于最新  │ ← 用户感知结果
│     上下文的流程  │
└─────────────────┘
```

---

## 七、技术方案要点

| 层级 | 文件/组件 | 关键改动 |
|------|-----------|----------|
| Store | `useDDDStore` | 确保 contextTree 字段正确更新 |
| Button Handler | 「继续·流程树」组件 | onClick 中传递 contextTree |
| API Layer | `canvasApi.ts` | 确保参数透传 |
| Backend | `routes/flow.ts` | 接收并使用 contextTree |

---

## 八、DoD (Definition of Done)

### 每个功能点的 DoD

| 功能点 | DoD |
|--------|-----|
| F1.1 | [ ] Store 单元测试通过<br>[ ] 手动测试验证 editor → store 数据同步 |
| F1.2 | [ ] Network 监控验证请求包含 contextTree<br>[ ] API 集成测试通过 |
| F1.3 | [ ] 后端单元测试验证参数解析<br>[ ] 集成测试验证流程生成 |
| F1.4 | [ ] E2E 测试覆盖完整流程<br>[ ] gstack 自动化测试通过 |

### 整体 DoD

- [ ] 所有功能点验收标准通过
- [ ] 无 console.error 或 unhandled rejection
- [ ] 代码符合现有项目规范
- [ ] PR review 通过

---

## 九、Success Metrics

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| 上下文传递成功率 | 100% | E2E 测试自动化验证 |
| API 请求参数完整性 | contextTree 100% 包含 | Network 监控 |
| 后端响应正确性 | flowTree 基于 contextTree 生成 | Response 断言 |

---

## 十、相关文件

| 类型 | 路径 |
|------|------|
| 分析文档 | `/root/.openclaw/vibex/docs/vibex-canvas-context-pass-20260328/analysis.md` |
| 详细规格 | `/root/.openclaw/vibex/docs/vibex-canvas-context-pass-20260328/specs/` |
| 前端代码 | `/root/.openclaw/vibex/vibex-fronted/` |
| 后端代码 | `/root/.openclaw/vibex/backend/` |

---

**PRD 创建完成** | 等待 architect 进行架构设计
