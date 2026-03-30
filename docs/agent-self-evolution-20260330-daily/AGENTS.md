# 开发约束 (AGENTS.md): Agent 每日自检任务自动机

> **项目**: agent-self-evolution-20260330-daily
> **阶段**: Phase1 — 自检标准化 + 异常检测
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **脚本语言** | TypeScript (ts-node 执行) |
| **测试框架** | Vitest |
| **自动化调度** | Cron（现有） |
| **通知** | Slack API（现有 openclaw） |
| **文件存储** | JSON + Markdown（现有） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `docs/templates/selfcheck-template.md` | 新建 | 自检模板 |
| `src/scripts/selfcheck-validator.ts` | 新建 | 格式验证器 |
| `src/scripts/__tests__/selfcheck-validator.test.ts` | 新建 | 验证测试 |
| `src/scripts/actionable-collector.ts` | 新建 | 建议收集器 |
| `src/scripts/__tests__/actionable-collector.test.ts` | 新建 | 收集测试 |
| `src/scripts/zombie-alert.ts` | 新建 | Zombie 告警 |
| `src/scripts/__tests__/zombie-alert.test.ts` | 新建 | 告警测试 |
| `src/scripts/daily-report.ts` | 新建 | 报告生成器 |
| `src/scripts/__tests__/daily-report.test.ts` | 新建 | 报告测试 |
| `scripts/trigger-selfcheck.sh` | 新建 | 自检触发脚本 |
| `crontab` | 修改 | 添加定时任务 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 修改 task_manager 核心逻辑 | 已有基础设施 |
| ❌ 引入新数据库 | 保持轻量 |
| ❌ 修改现有 agent 的 self-check 格式 | 渐进式迁移 |
| ❌ 发送外部通知（非 Slack） | 已有 openclaw 集成 |

---

## 3. 代码规范

### 3.1 TypeScript 类型定义

```typescript
// ✅ 正确：显式类型
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ❌ 错误：any
function validate(doc: any): any
```

### 3.2 脚本入口

```typescript
// ✅ 正确：CLI 入口检查
if (require.main === module) {
  const args = process.argv.slice(2);
  // 处理 CLI 参数
}

// ❌ 错误：直接执行
validate(doc);
console.log('done');
```

### 3.3 错误处理

```typescript
// ✅ 正确：显式错误 + exit code
if (!filePath) {
  console.error('Usage: validator.ts <file-path>');
  process.exit(1);
}

// ❌ 错误：静默失败
if (!filePath) return;
```

---

## 4. 测试要求

### 4.1 覆盖率门禁

```bash
# 必须通过的门禁
pnpm test --coverage --reporter=text

# 覆盖率要求:
# - selfcheck-validator.ts: ≥ 90%
# - actionable-collector.ts: ≥ 85%
# - zombie-alert.ts: ≥ 80%
# - daily-report.ts: ≥ 85%
```

### 4.2 集成测试检查清单

```bash
# 1. 格式验证测试
echo "---" | npx ts-node src/scripts/selfcheck-validator.ts -
# 预期: 验证通过

# 2. 建议收集测试
npx ts-node src/scripts/actionable-collector.ts docs 2026-03-30
# 预期: 生成 actionable-suggestions.json

# 3. 报告生成测试
npx ts-node src/scripts/daily-report.ts 2026-03-30
# 预期: 生成 daily-reports/2026-03-30.md

# 4. Cron 模拟测试
bash scripts/trigger-selfcheck.sh
# 预期: 所有检查通过
```

### 4.3 性能要求

| 操作 | 阈值 |
|------|------|
| 单文件验证 | < 50ms |
| 全量建议收集 | < 5s |
| 报告生成 | < 10s |
| Cron 总执行 | < 30s |

---

## 5. 提交流程

```
1. dev 完成代码
2. 运行: pnpm test -- --coverage
3. 覆盖率检查通过
4. 运行集成测试
5. 提交: git commit -m "feat(self-evolution): <功能描述>"
6. 推送: git push
7. tester 审查 → reviewer 二审 → 合并
```

---

## 6. 自检模板使用规范

### 6.1 格式要求

```markdown
---
agent: [agent-name]
date: [YYYY-MM-DD]
score: [1-10]
---

## 今日完成
- 完成事项

## 发现问题
- 问题描述

## 改进建议
- [ACTIONABLE] 可执行建议
- 不可执行建议
```

### 6.2 [ACTIONABLE] 标签规则

- 仅用于**可立即执行**的改进建议
- 格式: `- [ACTIONABLE] 具体建议内容`
- 将被自动收集到 `proposals/YYYYMMDD/actionable-suggestions.json`

---

## 7. Zombie 告警规则

| 条件 | 动作 |
|------|------|
| zombie <= 2 | 重置为 ready，继续监控 |
| zombie 3-4 | 发送警告到 Slack (@ 小羊) |
| zombie >= 5 | 发送严重告警到 Slack |
| zombie 响应 > 30min | 升级告警 |

---

## 8. 回滚计划

| 场景 | 应对 |
|------|------|
| 格式验证误报 | 放宽验证规则，支持两种格式 |
| 告警轰炸 | 增加 5min 最小间隔 |
| Cron 失败 | 查看日志 `logs/cron-YYYYMMDD.log` |

---

## 9. 相关文档

| 文档 | 路径 |
|------|------|
| 架构文档 | `docs/agent-self-evolution-20260330-daily/architecture.md` |
| PRD | `docs/agent-self-evolution-20260330-daily/prd.md` |
| 实现计划 | `docs/agent-self-evolution-20260330-daily/IMPLEMENTATION_PLAN.md` |

---

*本文档由 Architect Agent 生成，用于约束 dev 和 tester 的开发行为。*
