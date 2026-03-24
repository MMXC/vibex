# 实施计划：VibeX 提案汇总执行

**项目**: vibex-proposals-summary-20260324_185417  
**日期**: 2026-03-24  
**角色**: architect  
**状态**: Proposed

---

## 概述

本计划基于 `architecture.md` 和 `prd.md`，细化 21 条提案的技术实施路径，按 Sprint 组织，强调风险管控与分批验证。

**执行周期**: 3 周（18 个工作日）  
**团队节奏**: dev 并行执行，architect 评审架构变更

---

## Sprint 0 — 立即止血（0.5d）

### P0-2: task_manager.py 挂起修复
**执行者**: dev  
**工时**: 2-4h  
**触发条件**: 无前置依赖

**实施步骤**:
1. 复现问题：`python3 task_manager.py list` 观察挂起点
2. 添加超时装饰器到所有文件 IO 操作
3. 识别死锁根因（可能是循环依赖或子进程阻塞）
4. 添加降级方案：超时后输出缓存结果
5. 验证：所有子命令 ≤ 5s

**验证命令**:
```bash
time python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py list
time python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py claim test dummy
```

**回滚方案**: git revert 上一次提交（保护 main 分支）

---

### P0-1: page.test.tsx 过时用例修复
**执行者**: dev  
**工时**: 1h  
**触发条件**: 无前置依赖

**实施步骤**:
1. 识别 4 个过时测试：three-column layout, navigation, five steps, basic elements
2. 根据 simplified-flow 重构后的 UI 更新断言
3. 或删除已无意义的测试用例

**验证命令**:
```bash
cd /root/.openclaw/vibex && npm test -- page.test.tsx
```

---

## Sprint 1 — 质量基线（5d）

### P0-3: proposal-dedup 生产验证
**执行者**: dev + tester  
**工时**: 2d  
**前置依赖**: P0-2 完成（解锁 task_manager）

**实施步骤**:
1. 在 staging 环境运行 dedup.run('proposals/20260324')
2. 验证 Chinese bigram 边界提取正确性（人工抽检 20 条）
3. 调整 SIMILARITY_THRESHOLD 使精确率 ≥ 80%，召回率 ≥ 70%
4. 添加配置化阈值到 config/dedup.yaml
5. tester 编写验收测试

**配置**:
```yaml
# config/dedup.yaml
thresholds:
  similarity: 0.75
  min_keyword_overlap: 2
validation:
  sample_size: 20
  precision_target: 0.80
  recall_target: 0.70
```

**验证命令**:
```bash
python3 scripts/dedup.py --config config/dedup.yaml proposals/20260324
```

---

### P1-1: ErrorBoundary 组件去重
**执行者**: dev  
**工时**: 0.5d

**实施步骤**:
1. 定位两套 ErrorBoundary 实现
2. 统一到 `components/ui/ErrorBoundary.tsx`
3. 清理 `error-boundary/ErrorBoundary` 的导入
4. 更新所有引用

**验证命令**:
```bash
grep -r "error-boundary/ErrorBoundary" src/ --include="*.tsx" --include="*.ts"
# 应返回空
```

---

### P1-2: heartbeat 幽灵任务修复
**执行者**: dev  
**工时**: 0.5d

**实施步骤**:
1. 在 heartbeat 脚本中，读取任务前检查目录存在性
2. 添加 `os.path.isdir(project_dir)` 检查
3. 跳过不存在的项目目录

**验证命令**:
```bash
bash scripts/heartbeat-scan.sh nonexistent-project
# 应返回空，不报错
```

---

### P1-3: CardTreeNode 单元测试
**执行者**: dev  
**工时**: 4h

**实施步骤**:
1. 补充 CardTreeNode 测试覆盖：
   - 正常渲染
   - 空 children 空状态
   - 多层级嵌套展开
2. 目标覆盖率 ≥ 85%

**验证命令**:
```bash
cd /root/.openclaw/vibex && npm test -- CardTreeNode --coverage
```

---

### P1-5: E2E 入 CI
**执行者**: dev  
**工时**: 2h

**实施步骤**:
1. 在 `.github/workflows/e2e.yml` 添加 Playwright job
2. 配置 retry=3 + flaky 标记
3. 配置报告上传到 GitHub Artifacts
4. 在 PR 检查中启用

**验证命令**:
```bash
# 本地验证
npx playwright test --reporter=html
# CI 验证：PR 检查通过 + 报告上传成功
```

---

### P1-6: API 错误测试补全
**执行者**: dev  
**工时**: 2h

**实施步骤**:
1. 识别 API 错误边界场景：401、403、404、timeout、parse error
2. 补充 jest 单元测试
3. 补充 Playwright E2E 测试

**验证命令**:
```bash
npm test -- api.test.ts
```

---

### P1-7: Accessibility 基线
**执行者**: dev  
**工时**: 2h

**实施步骤**:
1. 安装 jest-axe
2. 为 confirm + flow 页面添加 accessibility 测试
3. 修复发现的所有 WCAG 违规项

**验证命令**:
```bash
npm test -- accessibility.test.ts
```

---

## Sprint 2 — 架构债务（3d）

### P1-4: confirmationStore 拆分
**执行者**: dev + architect  
**工时**: 1.5d  
**风险**: 🔴 High  
**分 3 批执行**

#### Batch 1: requirementStep 分离
1. 创建 `hooks/useRequirementStep.ts`
2. 将 requirementStep 相关状态迁移
3. 保留 useConfirmationStore API 不变（添加代理）
4. 运行 E2E 全量回归
5. PR → reviewer → merge

#### Batch 2: snapshotHistory 分离
1. 创建 `hooks/useSnapshotHistory.ts`
2. 将 snapshotHistory 相关状态迁移
3. 移除 useConfirmationStore 中的代理
4. 运行 E2E 全量回归 + snapshot 对比
5. PR → reviewer → merge

#### Batch 3: 清理与统一导出
1. 移除遗留状态，清理无引用代码
2. 统一导出规范
3. 更新 AGENTS.md 中的引用
4. PR → reviewer → merge

**验证命令**:
```bash
# 每批次
npm test -- confirmation.test.ts
npx playwright test e2e/confirm
git diff origin/main --stat
```

---

### P1-8: HEARTBEAT 话题追踪
**执行者**: analyst + dev  
**工时**: 1d

**实施步骤**:
1. 实现 `heartbeat.replyToThread(om_xxx, msg)` 函数
2. 实现 `heartbeat.extractThreadId(file)` 函数
3. 集成到 HEARTBEAT.md 工作流

---

### P2-1: 报告约束截断修复
**执行者**: dev  
**工时**: 0.5d

**问题**: 阶段任务报告约束清单被截断  
**修复**: 调整报告模板，避免长文本截断

---

## Sprint 3 — 持续改进（3d+）

### P2-2: 错误处理统一 ✅ DONE
**执行者**: dev  
**工时**: 2d

**实施步骤**:
1. 定义 ErrorType 枚举：`NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN`
2. 创建 `hooks/useErrorHandler.ts`
3. 统一所有组件的错误处理逻辑

---

### P3-1: 共享类型包
**执行者**: architect  
**工时**: 2d  
**前置依赖**: P1-4 完成

**实施步骤**:
1. 创建 `packages/types/` 目录
2. 迁移共享类型定义（从各组件提取）
3. 配置 TypeScript project references
4. 发布到内部 registry

**类型范围**:
```typescript
// packages/types/src/index.ts
export * from './api'
export * from './store'
export * from './events'
```

---

## 执行节奏

### 并行度建议
| Sprint | 可并行任务 | 说明 |
|--------|----------|------|
| Sprint 0 | P0-1 + P0-2 | 可同时派给 dev |
| Sprint 1 | P1-1, P1-2, P1-3, P1-5, P1-6, P1-7 | dev 串行或按能力分配 |
| Sprint 1 | P0-3 | 独立 track，dev+tester |
| Sprint 2 | P1-4 (高风险) + P1-8 + P2-1 | P1-4 单独处理 |

### 协调机制
- **每日 standup**: coord 心跳追踪各 Sprint 进度
- **PR 门禁**: CI + reviewer + 至少 1 个 E2E 通过
- **架构变更评审**: P1-4 每批次 PR 必须 architect 参与

---

## 进度追踪

| Sprint | 开始 | 结束 | 状态 | 备注 |
|--------|------|------|------|------|
| Sprint 0 | 2026-03-24 | 2026-03-24 | 🔄 进行中 | task_manager + page.test |
| Sprint 1 | TBD | TBD | ⬜ 待开始 | 6 项 |
| Sprint 2 | TBD | TBD | ⬜ 待开始 | 3 项 |
| Sprint 3 | TBD | TBD | ⬜ 待开始 | 3 项 |
