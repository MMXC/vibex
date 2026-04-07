# AGENTS.md — VibeX 文档健康度修复

**项目**: vibex-doc-fix-20260328
**模式**: 单 agent 执行（文档修复 + 脚本编写，非代码开发）
**工作目录**: /root/.openclaw/vibex

---

## 1. 任务分配

| 角色 | 任务 | 约束 |
|------|------|------|
| **Dev agent** | 全部 9 个 Task（F1.1–F1.5, F2.1–F2.4） | 使用 bash 脚本 + yq CLI 执行 |

> 注：本项目为文档修复 + 脚本自动化，无前端/后端代码修改，不涉及 Reviewer/Tester。
> 如 Dev 执行过程中遇到问题，通过 team-tasks 报告给 Coord 决策。

---

## 2. 开工前检查

```bash
# 确认 yq 已安装
yq --version

# 确认工作目录
cd /root/.openclaw/vibex

# 确认项目文件存在
ls docs/vibex-doc-fix-20260328/
```

---

## 3. 执行顺序

```
阶段一（顺序执行）:
  Dev → F1.1（提取后端路由）→ F1.2（提取前端调用）→ F1.3（生成新 YAML）
     → F1.4（验证YAML）→ F1.5（标注未用路由）
     → F2.1（建归档目录）→ F2.2（归档文档）→ F2.3（更新README）→ F2.4（验证CLAUDE引用）

阶段二（如 Coord 决策开启）:
  Dev → 契约补全 + 归档收尾 → Reviewer → Tester → 提交 PR
```

---

## 4. 关键产物路径

| 产物 | 路径 |
|------|------|
| 分析报告 | `docs/vibex-doc-fix-20260328/analysis.md` |
| PRD | `docs/vibex-doc-fix-20260328/prd.md` |
| 架构设计 | `docs/vibex-doc-fix-20260328/architecture.md` |
| 实施计划 | `docs/vibex-doc-fix-20260328/IMPLEMENTATION_PLAN.md` |
| 本文件 | `docs/vibex-doc-fix-20260328/AGENTS.md` |
| 后端路由清单 | `docs/vibex-doc-fix-20260328/backend-routes.md` (F1.1产出) |
| 前端调用清单 | `docs/vibex-doc-fix-20260328/frontend-calls.md` (F1.2产出) |
| 后端独有路由 | `docs/vibex-doc-fix-20260328/unused-routes.md` (F1.5产出) |
| API 契约 | `docs/api-contract.yaml` (F1.3产出) |
| API 契约备份 | `docs/api-contract.yaml.bak-20260328` (F1.3产出) |
| 归档目录 | `docs/archive/202603-stale/` (F2.1产出) |

---

## 5. 验收标准速查

```bash
# === F1.3 核心验收 ===
yq eval '.paths | length' docs/api-contract.yaml        # 应 ≥ 60
yq eval '.paths | has("/auth/me")' docs/api-contract.yaml          # true
yq eval '.paths | has("/requirements")' docs/api-contract.yaml    # true
yq eval '.paths | has("/ddd/bounded-context")' docs/api-contract.yaml  # true
yq eval '.paths | has("/clarify/ask")' docs/api-contract.yaml      # true

# === F2.2 归档验收 ===
find docs -maxdepth 1 -name "tester-checklist*.md" | wc -l  # 应为 0
find docs/archive/202603-stale -type f | wc -l                 # 应 ≥ 47
find docs/archive/202603-stale/tester-checklists -name "*.md" | wc -l  # 应 ≥ 7
```

---

## 6. 约束红线

1. **只移不删** — 归档操作只移动文件，禁止删除
2. **保留已有正确定义** — 更新 api-contract.yaml 不得删除已有的正确端点
3. **先备份再改** — 修改 api-contract.yaml 前必须先 cp 备份
4. **禁止破坏引用** — 归档后确保 CLAUDE.md 等核心文档不引用已归档文件
5. **gstack 验证** — F1.3 完成后用 gstack browse 打开 docs/api-contract.yaml 截图验证

---

## 7. 阻塞上报

如在执行过程中遇到以下情况，立即通过 team-tasks 更新任务状态为 `blocked` 并附原因：

- yq CLI 未安装或版本不兼容
- 某个归档目标文件不存在（已被移动或命名不同）
- CLAUDE.md 引用修复后影响范围不明
- 后端路由与前端调用存在不一致（如 HTTP 方法不匹配）

---

**AGENTS.md 完成**: 2026-03-28
**Architect**: subagent (coord dispatch)
