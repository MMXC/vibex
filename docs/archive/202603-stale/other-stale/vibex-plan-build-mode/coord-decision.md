# Coord Decision: Plan/Build 双模式切换

**项目**: vibex-plan-build-mode
**决策者**: Coord Agent
**日期**: 2026-03-14 09:50
**状态**: ✅ APPROVED

---

## 1. 决策摘要

**结论**: 架构方案可行，批准进入开发阶段。

**关键决策**:
- ✅ 技术选型合理（Zustand + SSE + TypeScript）
- ✅ 架构设计清晰（三层架构 + 状态流转）
- ✅ 功能覆盖完整（F1-F4 全部覆盖）
- ✅ 验收标准可测试（每个功能有 expect() 断言）

---

## 2. 架构审核

### 2.1 技术选型 ✅

| 技术 | 评估 | 结论 |
|------|------|------|
| React 19.x | 与现有项目一致 | ✅ 合理 |
| Zustand 4.x | 已有 Slice 模式 | ✅ 合理 |
| SSE 流式传输 | 已有架构支持 | ✅ 合理 |
| TypeScript 5.x | 已有项目基础 | ✅ 合理 |

**风险评估**: 无新技术引入，风险可控。

### 2.2 架构设计 ✅

| 维度 | 评估 |
|------|------|
| 系统架构 | 三层分离（UI/State/API），职责清晰 |
| 流程设计 | Plan 模式有确认环节，Build 模式保持简洁 |
| 状态管理 | Zustand Store 统一管理，支持持久化 |
| API 设计 | Plan API 独立，Build API 扩展现有接口 |

### 2.3 功能覆盖 ✅

| 功能 ID | 功能点 | 架构覆盖 | 验收标准 |
|---------|--------|----------|----------|
| F1.1 | 模式选择器 | PlanBuildButtons | ✅ 可测试 |
| F1.2-F1.4 | 按钮组件 | PlanBuildButtons | ✅ 可测试 |
| F2.1-F2.4 | Plan 模式 | PlanResult + 子组件 | ✅ 可测试 |
| F3.1-F3.3 | Build 模式 | useBuild Hook | ✅ 可测试 |
| F4.1-F4.3 | 状态管理 | usePlanBuildStore | ✅ 可测试 |

### 2.4 验收标准 ✅

- 每个功能点有明确的 `expect()` 断言
- 测试覆盖率目标：70-90%
- E2E 测试场景覆盖完整

---

## 3. 开发任务拆分

根据架构设计，拆分为以下开发任务：

### Epic 1: 模式选择 UI 【需页面集成】

| 任务 ID | 任务名 | 负责人 | 功能点 |
|---------|--------|--------|--------|
| impl-plan-build-buttons | PlanBuildButtons 组件 | dev | F1.1-F1.4 |

### Epic 2: Plan 模式 【需页面集成】

| 任务 ID | 任务名 | 负责人 | 功能点 |
|---------|--------|--------|--------|
| impl-plan-result | PlanResult 组件 | dev | F2.1-F2.4 |
| impl-plan-api | Plan API + 服务 | dev | 后端 API |

### Epic 3: Build 模式

| 任务 ID | 任务名 | 负责人 | 功能点 |
|---------|--------|--------|--------|
| impl-build-extension | Build API 扩展 | dev | F3.1-F3.3 |

### Epic 4: 状态管理

| 任务 ID | 任务名 | 负责人 | 功能点 |
|---------|--------|--------|--------|
| impl-plan-build-store | Zustand Store + Hooks | dev | F4.1-F4.3 |

---

## 4. 红线约束

1. **工作目录**: `/root/.openclaw/vibex/vibex-fronted`
2. **禁止**: 删除现有组件或修改其他页面逻辑
3. **必须**: 每个功能点提交开发检查清单
4. **必须**: UI 功能集成到首页，提供页面截图
5. **测试**: 测试覆盖率 > 70%

---

## 5. 验收要求

1. ✅ 所有 dev 任务完成 + 检查清单提交
2. ✅ tester 验证通过（功能 + 截图 + 检查清单）
3. ✅ reviewer 审查通过（代码质量 + 安全 + 需求一致性）
4. ✅ 首页显示 Plan/Build 模式选择
5. ✅ Plan 模式有确认环节
6. ✅ Build 模式行为不变

---

## 6. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| Plan 结果不准确 | 置信度提示 + 用户可调整 |
| 增加用户操作步骤 | 保留 Build 快捷模式 |
| API 响应慢 | 流式输出 + Loading 动画 |

---

## 7. 下一步行动

1. 创建 impl-plan-build-store 任务（状态管理基础）
2. 创建 impl-plan-api 任务（后端 API）
3. 创建 impl-plan-build-buttons 任务（UI 组件）
4. 创建 impl-plan-result 任务（Plan 结果展示）
5. 创建 impl-build-extension 任务（Build 扩展）

---

**决策时间**: 2026-03-14 09:50
**下一步**: 创建阶段二开发任务