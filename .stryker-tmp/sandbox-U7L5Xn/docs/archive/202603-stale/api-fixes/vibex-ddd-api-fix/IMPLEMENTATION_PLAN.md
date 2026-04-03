# IMPLEMENTATION_PLAN: vibex-ddd-api-fix

> **项目**: vibex-ddd-api-fix
> **日期**: 2026-03-20
> **Architect**: Architect Agent

---

## 阶段一产出物

- ✅ `docs/vibex-ddd-api-fix/analysis.md` — 根因分析
- ✅ `docs/vibex-ddd-api-fix/prd.md` — PRD + Epic/Story
- ✅ `docs/vibex-ddd-api-fix/architecture.md` — 本文档（架构设计）

---

## 开发任务清单（Phase 2）

### Epic 1: API 增强

#### Dev Task: fix-ddd-api-routing
**指派**: Dev Agent
**文件改动**:
1. `vibex-fronted/src/constants/homepage.ts` — 更新 API 路由常量
2. `vibex-fronted/src/hooks/queries/useDDD.ts` — 使用新路由
3. `vibex-backend/src/app/api/v1/domain-model/[projectId]/route.ts` — 更新提示词 + Zod schema
4. `vibex-fronted/src/utils/mermaid-generator.ts` — Mermaid 边生成逻辑

**验收命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted && npm test -- --grep "bounded-context"
npm run build
```

#### Tester Task: test-ddd-api-routing
**指派**: Tester Agent
**依赖**: fix-ddd-api-routing
**测试用例**:
1. `test/bounded-contexts-api.test.ts` — API 返回 relationships
2. `test/mermaid-generator.test.ts` — Mermaid 含 `<path>` 元素
3. `test/schema-validation.test.ts` — Zod 拒绝无效格式
4. `test/compatibility.test.ts` — 旧数据格式兼容

**验收命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted && npm test
```

#### Reviewer Task: review-ddd-api-routing
**指派**: Reviewer Agent
**依赖**: test-ddd-api-routing
**检查项**:
1. 代码质量（无 console.log，类型完整）
2. 安全（输入校验）
3. Changelog 更新
4. 功能 commit

#### Reviewer-Push Task: review-push-ddd-api-routing
**指派**: Reviewer Agent
**依赖**: review-ddd-api-routing
**检查项**:
1. 远程有 commit
2. 本地无未提交修改
3. npm test 全部通过

---

## 快速验证脚本

```bash
#!/bin/bash
cd /root/.openclaw/vibex

# 1. 前端构建
cd vibex-fronted
npm run build || { echo "❌ Build failed"; exit 1; }

# 2. 测试
npm test -- --grep "bounded-context" || { echo "❌ Tests failed"; exit 1; }

# 3. 后端检查
cd ../vibex-backend
grep -q "relationships" src/app/api/v1/domain-model/[projectId]/route.ts || { echo "❌ Backend not updated"; exit 1; }

echo "✅ All checks passed"
```

---

## 依赖关系

```
analyze-requirements (done)
    ↓
create-prd (done)
    ↓
design-architecture (done) ← 当前
    ↓
coord-decision (pending)
    ↓ (if approved)
fix-ddd-api-routing (dev)
    ↓
test-ddd-api-routing (tester)
    ↓
review-ddd-api-routing (reviewer)
    ↓
review-push-ddd-api-routing (reviewer-push)
```

---

*Architect Agent | 2026-03-20*
