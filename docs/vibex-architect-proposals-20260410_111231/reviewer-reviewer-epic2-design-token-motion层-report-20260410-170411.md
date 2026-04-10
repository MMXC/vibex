# 阶段任务报告：reviewer-epic2-design-token-motion层
**项目**: vibex-architect-proposals-20260410_111231
**领取 agent**: reviewer
**领取时间**: 2026-04-10T09:04:11.675591+00:00
**版本**: rev 33 → 34

## 项目目标
收集 architect 提案

## 阶段任务
# ★ Agent Skills（必读）
# `code-review-and-quality` — 代码审查、质量评估
# `code-simplification` — 重构与代码简化
# `performance-optimization` — 性能审查

# ★ Phase2 审查任务（reviewer）- 第一步：功能审查

审查 Epic: Epic2-Design-Token-Motion层（第一步：功能审查）

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）验证代码改动后的实际效果
- 禁止仅靠代码审查判断功能正确性，必须实际在浏览器中打开页面验证
- 每次审查前截图记录当前 UI 状态，作为审查依据

## 你的任务
1. 代码质量审查
2. 安全漏洞扫描
3. 执行 `/ce:review`：拉起多维度专项审查（Security, Performance, Maintainability 等），执行 CE 的深度审查，并写入阶段任务报告
4. 更新 CHANGELOG.md
5. 提交功能 commit

## 驳回红线（第一次审查）
- 无功能 commit → 驳回 dev
- 无 changelog 更新 → 驳回 dev
- 测试未通过 → 驳回 dev


## 🔴 约束清单
- 工作目录: /root/.openclaw/vibex
- 功能与PRD一致
- 代码质量达标
- changelog 已更新

## 📦 产出路径
/root/.openclaw/vibex/CHANGELOG.md

## 📤 上游产物
- tester-epic2-design-token-motion层: npm test 验证通过
