# Architecture: vibex-prd-template-standardization

**Project**: PRD 模板标准化
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/prd-template-standardization/analysis.md

---

## 1. 统一 PRD 模板

位置：`/root/.openclaw/vibex/docs/prd-template.md`

```markdown
# PRD: <项目名称>

> **任务**: <project>/create-prd
> **创建日期**: YYYY-MM-DD
> **PM**: <name>

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | <一句话描述背景> |
| **目标** | <可量化的目标> |
| **成功指标** | <可测试的指标> |

---

## 2. Epic 拆分

### Epic N: <名称>（<优先级>）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| Sx.x | <描述> | <h> | `<expect(...)>` |

**DoD**: <完成定义>

---

## 3. 验收标准总表

| ID | 验收条件 | 测试断言 |
|----|---------|----------|
| AC-N | <条件> | `expect(...)` |

---

## 4. 实施计划

| Epic | 工时 | 负责人 |
|------|------|--------|
| Epic 1 | <h> | <name> |

**总工时**: <X>h
```

---

## 2. 模板验证脚本

```bash
#!/bin/bash
# scripts/validate-prd.sh
REQUIRED_FIELDS=("背景" "目标" "Epic" "验收标准" "DoD" "实施计划")
REQUIRED_ELEMENTS=("## 1" "## 2" "## 3" "## 4")

for field in "${REQUIRED_FIELDS[@]}"; do
  if ! grep -q "$field" "$1"; then
    echo "Missing required field: $field"
    exit 1
  fi
done
echo "Template valid"
```

---

## 3. HEARTBEAT.md 更新

每个 agent 的 HEARTBEAT.md CLAIM checklist 中增加：
```
- [ ] PRD 使用统一模板（docs/prd-template.md）
- [ ] 模板验证脚本通过
```

---

## 4. 文件变更

| 文件 | 操作 |
|------|------|
| `docs/prd-template.md` | 新增 |
| `scripts/validate-prd.sh` | 新增 |
| `AGENTS.md`（各 agent） | 修改，引用模板 |

---

*Architect 产出物 | 2026-03-31*
