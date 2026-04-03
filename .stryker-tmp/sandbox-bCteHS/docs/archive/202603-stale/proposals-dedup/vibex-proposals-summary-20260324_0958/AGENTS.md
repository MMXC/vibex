# 开发约束 — 提案汇总项目

**项目**: vibex-proposals-summary-20260324_0958  
**作者**: Architect Agent  
**时间**: 2026-03-24 11:15 (Asia/Shanghai)

---

## Agent 约束清单

### Dev Agent 约束

#### ErrorBoundary 去重
- ✅ 统一到 `components/ui/ErrorBoundary.tsx`
- ✅ 删除 `components/error-boundary/` 目录
- ✅ 更新所有 import：`from '@/components/ui/ErrorBoundary'`
- ❌ 禁止新建第二个 ErrorBoundary 实现
- ❌ 禁止在业务组件中内联 error boundary 逻辑

#### confirmationStore 拆分
- ✅ 使用 Zustand slice/combine pattern
- ✅ 保持 `useConfirmationStore()` API 不变
- ✅ localStorage 快照格式保持 `confirmation_snapshot_v1` 兼容
- ✅ 每步拆分完成后运行 `npm test`
- ❌ 禁止一次性全部重写，必须渐进式
- ❌ 禁止移除现有 `reset()` 或 `set*()` 方法

#### dedup 生产验证
- ✅ 在 `proposals/20260323/` 真实数据上验证
- ✅ 关键词提取支持中文bigram
- ✅ 集成到 `task_manager.py check-dup` 命令

#### E2E 纳入 CI
- ✅ Playwright tests 无 UI 模式运行（`--project=chromium` headless）
- ✅ CI 容器安装 Chromium browser
- ✅ 生成 HTML 报告到 `playwright-report/`

---

### Tester Agent 约束

#### 验收测试要求
- ✅ `npm test` 必须 100% 通过后才算完成
- ✅ ErrorBoundary 测试覆盖：正常渲染 + 错误触发 + 错误恢复
- ✅ confirmationStore 测试：每个 step hook 独立测试 + 集成测试
- ✅ dedup 验证测试：真实数据上的去重效果测试
- ✅ E2E 测试：Playwright 9 个测试用例全部通过

#### 测试禁止项
- ❌ 不得跳过任何现有测试用例
- ❌ 不得添加 `test.skip` 或 `test.only` 到 CI

---

### Architect Agent 约束

#### 架构审查
- ✅ confirmationStore 拆分方案须经 architect 审核后方可实施
- ✅ 共享类型包结构须经 architect 设计
- ✅ React Query 迁移方案须 architect 评审

#### 文档产出
- ✅ `architecture.md` — 系统架构设计
- ✅ `IMPLEMENTATION_PLAN.md` — 实施计划
- ✅ `AGENTS.md` — 开发约束（本文件）

---

### Reviewer Agent 约束

#### 审查清单
- ✅ ErrorBoundary 去重：确认无残留引用
- ✅ confirmationStore 拆分：确认 API 兼容，无 breaking change
- ✅ 所有新文件符合 ESLint + Prettier 规范
- ✅ `CHANGELOG.md` 更新
- ✅ 代码变更有 git commit

#### 驳回红线
- ❌ confirmationStore 拆分后 API 不兼容 → 驳回
- ❌ 存在未处理的 `any` 类型 → 驳回
- ❌ 缺少测试覆盖 → 驳回

---

## 跨 Agent 约束

### 数据一致性
- ✅ 所有类型定义优先使用 `packages/types/` 中的类型
- ✅ API 响应类型必须与 `types/api.ts` 一致

### 向后兼容
- ✅ 所有重构必须保持现有 API 不变
- ✅ localStorage 中的用户数据必须可读取

### 安全约束
- ✅ 禁止在客户端代码中硬编码 API 密钥
- ✅ 错误信息不得泄露敏感内部路径

---

## 执行顺序

```
1. dev: ErrorBoundary 去重 (0.5d)
   └─ tester: 验证 (0.25d)
   └─ reviewer: 审查 + 推送 (0.25d)
   
2. dev: confirmationStore 拆分 (1.5d)
   └─ architect: 方案审核 (每个 step)
   └─ tester: 集成测试 (0.5d)
   └─ reviewer: 审查 + 推送 (0.5d)

3. dev+tester: dedup 生产验证 (2d)
   └─ reviewer: 审查 + 推送 (0.5d)

4. dev: heartbeat 幽灵任务 (0.5d)
   └─ tester: 验证 (0.25d)
   └─ reviewer: 审查 + 推送 (0.25d)

5. dev+architect: 共享类型包 (2d)
   └─ reviewer: 审查 + 推送 (0.5d)
```
