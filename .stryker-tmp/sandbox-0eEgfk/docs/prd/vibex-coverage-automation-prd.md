# 测试覆盖率自动化 PRD

**项目**: vibex-coverage-automation  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

项目已有 Jest 测试框架和覆盖率报告，但**缺乏自动化监控和阈值告警机制**：
- 当前覆盖率约 45-50%
- 无覆盖率阈值配置
- 无历史覆盖率对比
- 无自动化告警机制

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 定义渐进式阈值策略
- 明确告警触发条件
- 覆盖率低于阈值时自动告警

### 2.2 Non-Goals
- 不修改业务代码
- 不添加新测试用例
- 不改变 CI/CD 配置

---

## 3. Progressive Threshold Strategy (渐进式阈值策略)

### 3.1 分阶段阈值

| 阶段 | 阈值 | 触发条件 | 时间 |
|-----|------|---------|------|
| Phase 1 | 40% | 立即启用 | 第 1 周 |
| Phase 2 | 50% | 稳定运行 2 周后 | 第 3 周 |
| Phase 3 | 60% | 稳定运行 1 个月后 | 第 2 个月 |
| Phase 4 | 70% | 稳定运行 3 个月后 | 第 4 个月 |

### 3.2 分模块阈值

| 模块 | 初始阈值 | 目标阈值 |
|-----|---------|---------|
| global (全局) | 40% | 60% |
| components | 40% | 60% |
| lib | 50% | 70% |
| hooks | 40% | 60% |
| services | 50% | 70% |

### 3.3 Jest 配置

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 40,
        "functions": 40,
        "lines": 40,
        "statements": 40
      },
      "./src/components/**/*.tsx": {
        "lines": 40
      },
      "./src/lib/**/*.ts": {
        "lines": 50
      }
    }
  }
}
```

---

## 4. Alert Trigger Conditions (告警触发条件)

### 4.1 阈值告警

| 条件 | 动作 |
|------|------|
| 覆盖率 < 40% | 🔴 阻止合并 |
| 覆盖率 40-50% | 🟡 警告，不阻止 |

### 4.2 退化告警

| 条件 | 动作 |
|------|------|
| 覆盖率下降 > 5% | 🔴 阻止合并 |
| 覆盖率下降 2-5% | 🟡 警告 |

### 4.3 历史记录告警

| 条件 | 动作 |
|------|------|
| 连续 3 天下降 | 🔴 严重警告 |
| 周环比下降 > 10% | 🟡 警告 |

---

## 5. Implementation Plan

### 5.1 步骤 1: 配置 Jest 阈值

- 修改 `package.json` 添加 `coverageThreshold`
- 验证 `npm test -- --coverage` 返回非零退出码

### 5.2 步骤 2: 创建覆盖率检查脚本

```typescript
// scripts/check-coverage.ts
// 1. 运行测试收集覆盖率
// 2. 解析 coverage-summary.json
// 3. 检查阈值
// 4. 对比历史记录
// 5. 触发告警
```

### 5.3 步骤 3: 创建历史记录脚本

```bash
# scripts/save-coverage-history.sh
// 保存每日覆盖率到 JSON Lines 格式
```

### 5.4 步骤 4: 配置 OpenClaw Cron

- 每日 6:00 自动运行覆盖率检查
- 覆盖率低于阈值时发送 Slack 告警

---

## 6. Acceptance Criteria (验收标准)

### 6.1 阈值配置

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | Jest 配置包含 coverageThreshold | 检查 package.json |
| AC-02 | 全局阈值设为 40% | 运行测试确认 |
| AC-03 | 低于阈值时测试失败 | 注入低覆盖率代码 |

### 6.2 历史记录

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | 历史记录文件创建成功 | 运行脚本检查文件 |
| AC-05 | 记录包含日期和覆盖率 | 检查 JSON Lines 格式 |
| AC-06 | 历史对比正常工作 | 检查脚本输出 |

### 6.3 告警机制

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-07 | 低于阈值触发告警 | 模拟低覆盖率场景 |
| AC-08 | 告警消息格式正确 | 检查 Slack 消息 |
| AC-09 | 退化告警正常工作 | 模拟覆盖率下降场景 |

### 6.4 Cron 集成

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-10 | Cron 任务配置成功 | 检查 cron jobs |
| AC-11 | 每日定时触发 | 观察日志 |

---

## 7. Definition of Done (DoD)

### 7.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | Jest coverageThreshold 配置完成 |
| DoD-2 | 渐进式阈值策略定义完成 (4 阶段) |
| DoD-3 | 覆盖率检查脚本可执行 |
| DoD-4 | 历史记录脚本正常工作 |
| DoD-5 | 低于阈值时自动告警 |
| DoD-6 | OpenClaw Cron 定时任务配置 |

### 7.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-7 | 脚本执行无报错 |
| DoD-8 | 告警消息包含上下文信息 |
| DoD-9 | 历史记录格式统一 |

---

## 8. File Changes

| 文件 | 操作 |
|-----|------|
| `package.json` | 添加 coverageThreshold |
| `scripts/check-coverage.ts` | 新增 |
| `scripts/save-coverage-history.sh` | 新增 |
| `coverage-history/` | 新增目录 |

---

## 9. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| Jest 阈值配置 | 0.5h |
| 检查脚本开发 | 1h |
| 历史记录脚本 | 0.5h |
| Cron 集成 | 0.5h |
| 验证测试 | 0.5h |
| **总计** | **3h** |

---

## 10. Dependencies

- **前置**: analyze-coverage-needs (已完成)
- **依赖**: Jest 已配置、OpenClaw cron 工具

---

*PRD 完成于 2026-03-05 (PM Agent)*
