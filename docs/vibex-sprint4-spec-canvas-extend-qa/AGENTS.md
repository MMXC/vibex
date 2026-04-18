# AGENTS.md — vibex-sprint4-spec-canvas-extend-qa

**项目**: vibex-sprint4-spec-canvas-extend-qa
**版本**: v1.0
**日期**: 2026-04-18

---

## Agent 职责分配

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **architect** | 技术架构设计 + 缺陷分类 | `architecture.md` + `IMPLEMENTATION_PLAN.md` + `AGENTS.md` ✅ |
| **dev** | P0 缺陷修复 | `defects/P0/*.md` 修复后代码提交 |
| **tester** | 补充测试 + gstack 截图 | 补充测试用例 + 截图文件 |
| **reviewer** | 缺陷质量评审 | `defects/reviewer/*.md` |
| **coord** | 流程协调 | 进度跟踪 |

---

## 工作约定

### 架构原则

1. **QA 发现问题，不修复问题** — 缺陷归档由 architect 完成，修复由 dev 负责
2. **P0 阻断门控** — 存在 P0 缺陷时，不产出"QA 通过"报告
3. **Spec 为准** — 实现与 Spec 不一致时，以 Spec 为准（除非 Spec 本身错误）
4. **证据驱动** — 每个缺陷必须有代码证据（grep 输出、文件路径+行号）

### 代码审查规范

**必查项**:
```bash
# CSS Token 定义检查
grep -rE "color-method-|color-sm-" src/styles/

# 硬编码颜色检查
grep -rE "#[0-9a-fA-F]{6}" src/components/dds/cards/

# APIEndpointCard.tsx 中的 METHOD_COLORS
grep -n "METHOD_COLORS" src/components/dds/cards/APIEndpointCard.tsx

# StateMachineCard.tsx 中的 STATE_COLORS
grep -n "STATE_COLORS" src/components/dds/cards/StateMachineCard.tsx
```

### gstack 使用规范

```bash
# 启动 gstack
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

# 截图命名
screenshot "docs/vibex-sprint4-spec-canvas-extend-qa/gstack/G1-toolbar-5chapters.png"
screenshot "docs/vibex-sprint4-spec-canvas-extend-qa/gstack/G2-api-empty-state.png"
```

### 缺陷优先级判定

| 优先级 | 定义 | 示例 |
|--------|------|------|
| P0 | 阻塞系统基本功能，用户无法完成核心操作 | CSS Token 未定义、导出功能崩溃 |
| P1 | 影响功能完整性，但有 workaround | 导出格式不符合标准、可手动绕过 |
| P2 | 体验/代码质量，非功能性 | CSS 块残留、缺少创建表单 |

---

## 协作流程

```
architect (QA Architecture)
  → 完成 architecture.md + IMPLEMENTATION_PLAN.md + AGENTS.md
  → 提交给 coord

coord
  → 分配任务给 dev (修复 P0)
  → 分配任务给 tester (补充测试 + gstack)

dev (P0 修复)
  → 读取 defects/P0/*.md
  → 修复后提交 PR
  → 通知 tester 重新验证

tester (QA 验证)
  → 执行补充测试
  → 执行 gstack 截图
  → 更新 defects/ 状态

reviewer (缺陷评审)
  → 验证每个缺陷描述清晰、证据充分
  → 确认 P0/P1/P2 分类合理

architect (最终报告)
  → 读取所有 defects/
  → 产出 qa-final-report.md
  → task update done
```

---

## 文件命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 缺陷归档 | `P{0-2}-{NNN}-{short-name}.md` | `P0-001-css-token-missing.md` |
| 截图 | `G{n}-{description}.png` | `G1-toolbar-5chapters.png` |
| 测试补充 | `{component}-spec-alignment.test.ts` | `exporter-spec-alignment.test.ts` |
| 最终报告 | `qa-final-report.md` | — |

---

## 约束

- 所有 Slack 消息使用简体中文（简体汉字）
- 缺陷描述必须包含代码证据，禁止主观描述
- gstack 截图必须包含文件名和验证时间
- P0 缺陷修复后才能推进 E5 QA
