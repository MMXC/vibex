# AGENTS.md: Epic3 KnowledgeBase 虚假完成修复

**Project**: `epic3-knowledgebase-recovery-fakefix`

---

## Agent Responsibilities

### dev
- 补全 `docs/epic3-knowledgebase-recovery/` 目录下的缺失文档：
  - `AGENTS.md`（从模板生成）
  - `IMPLEMENTATION_PLAN.md`（按 PRD 补全）
  - `specs/verification-guide.md`（新建）
- **workspace**: `/root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/`
- **verification**: 使用 `bash verify-doc-project.sh`（见 verification-guide.md）

### tester
- 使用文件存在性验证替代 `npm test`
- 验证命令见 `specs/verification-guide.md`
- 检查 patterns ≥ 4, templates ≥ 3

### reviewer
- 确认文档完整性和验证流程正确
- 检查 AGENTS.md 中测试命令不包含 `npm test`

---

## Verification Commands

> ⚠️ 文档项目无 `package.json`，不使用 `npm test`

```bash
# 基础文件存在性
test -f docs/epic3-knowledgebase-recovery/AGENTS.md && echo "✅ AGENTS.md"
test -f docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md && echo "✅ IMPLEMENTATION_PLAN.md"

# 知识库内容
[ "$(ls docs/knowledge/patterns/*.md 2>/dev/null | wc -l)" -ge 4 ] && echo "✅ patterns≥4"
[ "$(ls docs/knowledge/templates/*.md 2>/dev/null | wc -l)" -ge 3 ] && echo "✅ templates≥3"

# 非空验证
for f in docs/knowledge/patterns/*.md docs/knowledge/templates/*.md; do
    [ -s "$f" ] && echo "✅ $(basename $f)" || echo "❌ $(basename $f) EMPTY"
done
```

---

## Workflow

1. **dev** → 补全缺失文档（AGENTS.md, IMPLEMENTATION_PLAN.md, verification-guide.md）
2. **dev** → 运行 `bash verify-doc-project.sh` 自检
3. **tester** → 使用文件验证命令验证
4. **reviewer** → 代码审查 + 确认虚假完成问题已修复
