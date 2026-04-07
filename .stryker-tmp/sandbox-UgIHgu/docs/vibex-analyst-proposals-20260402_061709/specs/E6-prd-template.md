# Spec: E6 - PRD 模板规范落地

## 1. 概述

**工时**: 3-4h | **优先级**: P2
**依赖**: 无外部依赖

## 2. 修改范围

### 2.1 Story 模板

**文件**: `docs/templates/story-template.md`

```markdown
## Story: [标题]

**Given** (上下文):
- [前置条件 1]
- [前置条件 2]

**When** (操作):
- [用户操作]

**Then** (结果):
- [预期结果 1]
- [预期结果 2]

**验收标准** (expect 断言):
- expect([condition]).toBe([value])
```

### 2.2 pre-commit hook

**文件**: `.husky/pre-commit` 或 `.git/hooks/pre-commit`

```bash
#!/bin/bash
# 检查新增的 .md 文件是否包含 GIVEN/WHEN/THEN
for file in $(git diff --cached --name-only | grep '\.md$'); do
  if ! grep -q "Given\|When\|Then" "$file"; then
    echo "Error: $file missing GIVEN/WHEN/THEN template"
    exit 1
  fi
done
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E6-AC1 | 检查模板 | 新 Story | 包含 GIVEN/WHEN/THEN |
| E6-AC2 | 运行 hook | git commit | hook 存在且工作 |
| E6-AC3 | 统计历史 | 补充的 Story | ≤ 20% |

## 4. DoD

- [ ] GIVEN/WHEN/THEN 模板定义
- [ ] pre-commit hook 工作正常
- [ ] 历史 Story 补充 ≤ 20%
