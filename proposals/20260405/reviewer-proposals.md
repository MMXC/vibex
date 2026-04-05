# Reviewer 提案 — 2026-04-05

**Agent**: reviewer
**日期**: 2026-04-05
**项目**: proposals-20260405
**仓库**: /root/.openclaw/vibex
**分析视角**: 代码质量审查流程、门禁机制、PR 质量标准

---

## 提案索引

| ID | 类别 | 标题 | 优先级 |
|----|------|------|--------|
| P001 | review-process | Reviewer 审查流程标准化 | P0 |
| P002 | review-process | 重复通知去重机制 | P1 |
| P003 | code-quality | 测试覆盖率门禁增强 | P0 |
| P004 | code-quality | 安全扫描集成到 CI | P1 |
| P005 | pr-quality | PR 描述质量标准 | P2 |
| P006 | review-process | 审查报告自动化归档 | P2 |

---

## P001: Reviewer 审查流程标准化

### 问题描述
当前 reviewer 工作流程存在不一致：
1. 每个任务需要手动确认 changelog 是否更新
2. 推送验证步骤与功能审查步骤有时被混淆
3. 任务状态更新依赖手动执行 CLI，容易遗漏

### 根因分析
- 缺乏统一的审查报告模板
- changelog 检查点未自动化
- reviewer 流程未固化到可复用脚本

### 建议方案

**1. 审查报告模板标准化**

```markdown
## [Project] Epic[N] 审查报告

### 审查结论: PASSED / REJECTED / CONDITIONAL PASS

**代码质量**: ✅/❌
**安全检查**: ✅/❌
**测试覆盖**: ✅/❌
**Changelog**: ✅/❌

### 发现的问题
- 🔴 [Blocker]: <描述>
- 🟡 [Suggestion]: <描述>

### 下游任务
- reviewer-push-[epic] → ready
- coord-completed → ready
```

**2. changelog 自动化检查脚本**

```bash
#!/bin/bash
# scripts/reviewer/check-changelog.sh
PROJECT=$1
EPIC=$2
CHANGELOG="CHANGELOG.md"

if grep -q "$PROJECT E$EPIC" "$CHANGELOG"; then
  echo "✅ Changelog 包含 $PROJECT E$EPIC"
  exit 0
else
  echo "❌ Changelog 缺少 $PROJECT E$EPIC 条目"
  exit 1
fi
```

**3. Reviewer 任务完成 CLI 增强**

在 `task_manager.py` 中增加 `reviewer-complete` 子命令：
- 自动检查 changelog 更新
- 自动 commit 审查发现（如果有）
- 自动更新状态并通知下游

### 验收标准
- [ ] 审查报告模板固化到 `docs/templates/review-report.md`
- [ ] `check-changelog.sh` 脚本可用
- [ ] 3 个以上的 reviewer 任务使用新模板

### 影响范围
- `workspace-reviewer/` workspace
- `skills/team-tasks/scripts/task_manager.py`

---

## P002: 重复通知去重机制

### 问题描述
今日收到同一任务的重复唤醒消息高达 10+ 次（6分钟内5次），导致：
1. 审查状态检查重复
2. 消息队列积压
3. 容易误操作（对已完成任务重复审查）

### 根因分析
1. Coord/heartbeat 在状态未同步时重复派发
2. 已完成任务（done/rejected）仍被重复唤醒
3. 缺少去重时间窗口

### 建议方案

**方案 A: Reviewer 端主动去重**

在 `sessions_send` 前检查任务是否已完成：
```python
# 在收到任务消息时先检查状态
status = get_task_status(project, task)
if status in ("done", "rejected"):
    print(f"任务 {project}/{task} 已完成({status})，跳过")
    return  # 不处理
```

**方案 B: Coord 端增加去重规则**
- 同一任务在 5 分钟内只允许唤醒一次
- 已完成任务不再出现在 ready 状态
- 完成状态变化后延迟 30 秒再广播

### 验收标准
- [ ] 重复唤醒次数 ≤ 2（允许一次重试）
- [ ] 已完成任务不再出现在 ready 状态
- [ ] Heartbeat 日志显示去重统计

### 影响范围
- `workspace-coord/` heartbeat 脚本
- `workspace-reviewer/` 任务处理逻辑

---

## P003: 测试覆盖率门禁增强

### 问题描述
当前 `vibex-fronted` 测试覆盖率：
- Statements: ~60% (目标 65%)
- Branches: ~51% (目标 55%)
- Functions: ~60% (目标 65%)

多个 Epic 审查时未强制验证覆盖率，导致覆盖率持续低迷。

### 根因分析
1. CI 未配置覆盖率阈值门禁
2. `vitest --coverage` 配置存在但未集成到 CI
3. 覆盖率下降无自动告警

### 建议方案

**1. 在 `vitest.config.ts` 中配置强制阈值**

```typescript
coverage: {
  thresholds: {
    lines: 65,
    functions: 65,
    branches: 55,
    statements: 65,
  },
  checkThreshold: true,  // 强制门禁
  perFile: false,
}
```

**2. Playwright E2E 覆盖率补充**

E2E 测试添加 `coverage` 标签，CI 中单独统计：
```typescript
test('E2E coverage: auth flow', { tag: ['@coverage'] }, async ({ page }) => {
  // ...
});
```

**3. 覆盖率趋势追踪**

在 `CHANGELOG.md` 中增加覆盖率变化记录：
```markdown
### 测试覆盖率变化
| 日期 | Lines | Branches | Functions |
|------|-------|----------|-----------|
| 2026-04-05 | 60.3% | 51.0% | 60.1% |
| 2026-04-01 | 58.7% | 49.5% | 58.9% |
```

### 验收标准
- [ ] `vitest.config.ts` 覆盖率阈值门禁配置完成
- [ ] CI 中 `pnpm test:coverage` 执行并阻塞不合格 PR
- [ ] 覆盖率报告自动上传到 Artifacts

### 影响范围
- `vibex-fronted/tests/unit/vitest.config.ts`
- `.github/workflows/test.yml`

---

## P004: 安全扫描集成到 CI

### 问题描述
当前安全扫描依赖手动执行 `npm audit`，且仅扫描直接依赖，间接依赖漏洞（如 monaco-editor@0.53.0 → DOMPurify XSS）容易被忽略。

### 根因分析
1. `npm audit` 在 CI 中未强制执行
2. 缺乏依赖漏洞监控机制
3. 间接依赖漏洞需要 `npm ls` 追踪

### 建议方案

**1. CI 中增加安全扫描步骤**

```yaml
security:
  name: Security Audit
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - run: pnpm install --frozen-lockfile
    - name: Run npm audit
      run: pnpm audit --audit-level=moderate
    - name: Check indirect dependencies
      run: |
        npm ls dompurify --depth=3
        npm ls minimist --depth=3
    - name: Upload audit report
      uses: actions/upload-artifact@v4
      with:
        name: security-audit
        path: audit-report.json
```

**2. 添加 Dependabot 配置**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/vibex-fronted"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    security-updates: true
```

**3. 安全漏洞告警规则**

当发现 HIGH/CITICAL 漏洞时，自动在 #security 频道通知。

### 验收标准
- [ ] `.github/workflows/security.yml` 存在
- [ ] CI 中 `pnpm audit` 阻塞 HIGH+ 漏洞
- [ ] Dependabot 配置完成
- [ ] `npm ls` 追踪脚本可用

### 影响范围
- `.github/workflows/security.yml` (新建)
- `.github/dependabot.yml` (新建)
- `vibex-fronted/package.json`

---

## P005: PR 描述质量标准

### 问题描述
当前 PR 描述质量参差不齐：
- 部分 PR 缺少变更说明
- 测试结果未记录
- 关联 issue 未链接

### 建议方案

**PR 描述模板**

```markdown
## 变更摘要
<!-- 1-3 句话描述本次变更 -->

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] CI/CD

## 测试验证
<!-- 包含测试结果截图或输出 -->

## 相关链接
- Issue: #
- 关联 PR: #

## 检查清单
- [ ] `npm run lint` 通过
- [ ] `npm test` 全部通过
- [ ] `npm run build` 成功
- [ ] changelog 已更新
```

### 验收标准
- [ ] `.github/pull_request_template.md` 模板创建
- [ ] 5 个 PR 使用新模板
- [ ] Reviewer 审查时检查 PR 模板合规性

---

## P006: 审查报告自动化归档

### 问题描述
审查报告分散在多个位置：
- `reports/reviewer-*.md` — tester 报告
- `docs/review-reports/YYYYMMDD/` — reviewer 报告
- `docs/vibex-[project]/review-epic[N].md` — 项目级报告

导致历史追踪困难，难以形成知识积累。

### 建议方案

**统一报告目录结构**

```
reports/
  INDEX.md                          # 报告索引
  2026-04/
    review-vibex-e2e-test-fix.md
    review-vibex-proposals-20260405.md
  2026-03/
    ...
```

**INDEX.md 模板**

```markdown
# Review Reports Index

## 2026-04

| 日期 | 项目 | Epic | 结论 | 关键发现 |
|------|------|------|------|---------|
| 04-05 | vibex-e2e-test-fix | E1 | ✅ PASSED | grepInvert 缺失修复 |
| 04-05 | vibex-e2e-test-fix | E2 | ✅ PASSED | No-Op 验证 |
```

### 验收标准
- [ ] `reports/INDEX.md` 创建
- [ ] 所有历史报告归入 `reports/YYYY-MM/` 目录
- [ ] 新报告自动添加到索引

---

## 今日审查经验总结

### 通过的检查项（E2E Test Fix E1）
| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ 0 errors |
| test.skip + fixme 注释 | ✅ 已添加 |
| @ci-blocking: 前缀 | ✅ 已添加 |
| BASE_URL 环境变量 | ✅ 已支持 |
| npm scripts | ✅ 正确 |
| grepInvert CI 跳过 | ✅ 已修复 |
| 3 个 changelog 文件 | ✅ 已更新 |
| commit message 格式 | ✅ 符合规范 |

### 发现的问题模式
1. **注释与实现不一致**: `grepInvert` 注释声称 CI 跳过但代码未实现
2. **BASE_URL vs E2E_BASE_URL 不一致**: 配置文件用 BASE_URL，测试文件用 E2E_BASE_URL
3. **锁文件变更未同步**: pnpm-lock.yaml 变更需单独 commit
