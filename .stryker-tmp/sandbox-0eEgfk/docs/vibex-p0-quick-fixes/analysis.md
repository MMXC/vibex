# VibeX Sprint 0 — P0 快速修复需求分析

**文档版本**: v1.0  
**作者**: Analyst  
**日期**: 2026-04-02  
**状态**: 已完成

---

## 📋 摘要

| 项目 | 结论 |
|------|------|
| D-001 TS 错误 | ✅ 已确认，根因清晰，修复方案明确 |
| R-P0-2 DOMPurify | ⚠️ 需进一步验证，版本 3.3.3 为最新，需确认 CVE 编号 |
| D-002 vitest | ❓ 需要澄清，实际 `npm run test` 为 pre-test-check，非 vitest |

---

## 1. 业务场景分析

VibeX 前端处于 Sprint 0 紧急修复阶段。当前 CI/CD 门禁因以下三类问题处于**阻断状态**：

1. **TypeScript 编译失败** → 所有 `npm run build` 通过（exit 0），但 `npx tsc --noEmit` 失败，pre-test-check 脚本（`npm run test`）阻断
2. **ESLint 检查失败** → pre-test-check 中 ESLint 报告问题
3. **潜在安全漏洞** → DOMPurify 依赖链需审查（是否有 CVE）

这些问题直接影响：
- **开发者体验**：本地无法通过 pre-test 检查即跑测试
- **CI 门禁**：PR 无法合并，需阻塞到修复完成
- **安全合规**：若存在 XSS 漏洞，需紧急热修复

---

## 2. 核心 JTBD（Jobs To Be Done）

| ID | JTBD | 优先级 | 紧迫性 |
|----|------|--------|--------|
| J-1 | 作为开发者，我希望 `npm run test` 快速通过，无需绕过检查 | P0 | 🔴 立即 |
| J-2 | 作为安全负责人，我希望所有直接依赖无已知 CVE 漏洞 | P0 | 🔴 立即 |
| J-3 | 作为 CI 管理员，我希望 CI 门禁全绿（TS + ESLint + Build），无阻断项 | P0 | 🔴 立即 |
| J-4 | 作为运维人员，我希望测试环境稳定，超时/OOM 可预期 | P1 | 🟡 Sprint 内 |
| J-5 | 作为贡献者，我希望代码库质量持续可维护，技术债不堆积 | P2 | 🟢 后续 |

---

## 3. 实际检查结果

### 3.1 TypeScript 错误（D-001）

**检查命令**：
```bash
cd /root/.openclaw/vibex/vibex-fronted && npx tsc --noEmit 2>&1 | head -60
```

**结果**：✅ `npm run build` 全量构建成功（exit 0），所有 29 个静态页面生成无误。

❌ **但 `npx tsc --noEmit` 失败**，所有错误集中在：
```
tests/e2e/canvas-expand.spec.ts (9 处错误)
  第 66 行: TS1434 — Unexpected keyword or identifier
  第 139 行: TS1434 — Unexpected keyword or identifier
  第 172 行: TS1005 — ')' expected (3 处 TS1434 + TS1005 级联)
  第 310 行: TS1128 — Declaration or statement expected (2 处)
```

**根因分析**：
`tests/e2e/canvas-expand.spec.ts` 文件被注入了大量编译后的 Mermaid theme 代码（数千行压缩的 JS）。该文件原本应为 Playwright E2E 测试文件，现混入了非 TS 源码内容，导致解析器报错。这是一起**代码污染事件**，可能是：
- 错误的文件合并
- 构建产物误写入源码目录
- 或某次 hot-fix 意外覆盖

### 3.2 DOMPurify 安全审查（R-P0-2）

**检查命令**：
```bash
cd /root/.openclaw/vibex/vibex-fronted && npm ls dompurify
```

**结果**：
```
dompurify@3.3.3
├── @types/dompurify@3.2.0 → dompurify@3.3.3
├── mermaid@11.13.0 → dompurify@3.3.3 (deduped)
├── mermaid@11.14.0 → dompurify@3.3.3 (deduped)
└── @types/mermaid@9.2.0 → mermaid@11.14.0 → dompurify@3.3.3 (deduped)
```

所有引用统一指向 **DOMPurify 3.3.3**（最新版）。

⚠️ **需澄清项**：六方提案提到的 "monaco-editor 间接依赖漏洞版本" — 本次检查中**未发现 monaco-editor 依赖**。可能：
1. monaco-editor 已从依赖中移除
2. 提案信息与当前代码不同步
3. 漏洞在其他间接包中（如 `@types/dompurify@3.2.0` 较旧）

建议 Dev 在修复时执行 `npm audit`（需先解决 `pnpm-lock.yaml` 不兼容 npm 的问题）验证是否真正存在漏洞。

### 3.3 测试环境稳定性（D-002）

**检查命令**：
```bash
cd /root/.openclaw/vibex/vibex-fronted && npm run test
```

**结果**：`npm run test` 实际执行的是 `scripts/pre-test-check.js`，该脚本顺序执行：
1. ✅ Environment check — Node.js v22.22.1
2. ❌ TypeScript check — FAILED（与 D-001 同一问题）
3. ❌ ESLint — Issues found
4. ✅ Dependencies — OK
5. ✅ Build — OK

⚠️ **关键发现**：本项目中**不存在 vitest**（`npm ls vitest` 返回空）。`D-002: vitest 环境稳定性` 可能与实际项目配置不符，或 vitest 在其他子包中。建议 PM 确认 D-002 的实际目标测试框架。

---

## 4. 技术方案选项

### 方案 A：一键快速修复（推荐）

**针对 D-001（TS 错误）**：
```bash
# 方案 A1：恢复文件（推荐）
# 检查 git 历史，找到 canvas-expand.spec.ts 的干净版本
cd /root/.openclaw/vibex/vibex-fronted
git log --oneline tests/e2e/canvas-expand.spec.ts | head -5

# 方案 A2：如果历史也被污染，则删除该文件并重建
# 该文件属于 Epic 3.2 canvas 扩展测试，可暂时跳过
mv tests/e2e/canvas-expand.spec.ts tests/e2e/canvas-expand.spec.ts.bak
```

**针对 D-002（ESLint）**：
```bash
# 快速查看 ESLint 错误
cd /root/.openclaw/vibex/vibex-fronted && npx eslint . --format stylish 2>&1 | head -30
```

**针对 R-P0-2（DOMPurify）**：
```json
// 在 package.json 中添加 overrides
{
  "overrides": {
    "dompurify": "^3.3.3"
  }
}
```

**工时估算**：0.5h（文件恢复/删除 + ESLint 快速修复 + overrides 添加）

### 方案 B：系统性根因修复

1. **D-001**：调查 canvas-expand.spec.ts 污染来源，检查 CI 历史和 git blame
2. **D-002**：运行 `npx eslint . --fix` 自动修复风格问题，review 手动修复项
3. **R-P0-2**：执行 `npm audit`（转换为 pnpm audit 或使用 pnpm audit）
4. **D-002 重评估**：确认 vitest 是否存在于项目中，如不存在则更新提案

**工时估算**：1h（系统性调查 + 修复 + 验证）

### 方案对比

| 维度 | 方案 A | 方案 B |
|------|--------|--------|
| 修复速度 | 0.5h | 1h |
| 根因清除 | ❌ 不清除 | ✅ 清除 |
| 再次污染风险 | 高 | 低 |
| CI 通过保障 | 高（快速） | 高（彻底） |
| 推荐场景 | Sprint 0 紧急上线 | 持续维护 |

---

## 5. 可行性评估

| 修复项 | 可行性 | 风险 |
|--------|--------|------|
| D-001 TS 错误 | ✅ 高 | 极低（git 恢复或删除即可） |
| D-001 ESLint | ✅ 高 | 低（eslint --fix 自动修复大部分） |
| R-P0-2 DOMPurify | ⚠️ 待验证 | 需先确认 CVE 编号 |
| D-002 vitest | ❓ 需澄清 | 项目中无 vitest，需重新定义任务范围 |

**前置依赖**：无外部依赖，可立即执行。

---

## 6. 风险识别

| 风险 ID | 描述 | 概率 | 影响 | 缓解措施 |
|---------|------|------|------|----------|
| R-1 | `canvas-expand.spec.ts` 的污染蔓延到其他文件 | 中 | 高 | 立即 git blame 检查 |
| R-2 | DOMPurify 实际存在 CVE 但未被发现 | 低 | 高 | 执行 pnpm audit 并检查 npm advisory |
| R-3 | 快速修复后 CI 再次污染 | 中 | 中 | 添加 git hooks + pre-commit 检查 |
| R-4 | D-002 任务范围与实际不符 | 高 | 中 | PM 立即澄清 vitest 实际配置 |
| R-5 | ESLint 问题数量多，手动修复耗时超预期 | 低 | 中 | 先 `eslint --fix`，超 30 条再评估 |

---

## 7. 验收标准（具体可测试）

### D-001 TS 错误修复
- [ ] `npx tsc --noEmit` 在 vibex-fronted 目录返回 exit code 0
- [ ] `npm run build` 继续返回 exit code 0（回归验证）
- [ ] `git status` 显示 tests/e2e/canvas-expand.spec.ts 已修复

### R-P0-2 DOMPurify 安全修复
- [ ] `pnpm audit` 或 `npm audit` 返回 0 个 high/critical 漏洞（关于 dompurify 或其依赖链）
- [ ] DOMPurify 版本 >= 3.3.3（当前版本已满足）
- [ ] 若添加 overrides，package.json 包含正确的 overrides 字段

### D-002 ESLint 修复
- [ ] `npx eslint . --format stylish 2>&1 | wc -l` 输出 < 5 行
- [ ] `npm run test` 输出全部绿色（Environment ✅ + TypeScript ✅ + ESLint ✅ + Dependencies ✅ + Build ✅）

### D-002 vitest 稳定性（待澄清后补充）
- [ ] 确认 vitest 实际存在于哪个子包
- [ ] 确认超时/OOM 的具体测试用例
- [ ] 修复后测试在 < 60s 内完成，无 OOM

---

## 8. 建议后续行动

1. **立即**（0.5h）：执行方案 A，删除/恢复污染的 test 文件 + ESLint --fix + DOMPurify overrides
2. **当天**：PM 澄清 D-002 vitest 范围，确认是否需要 vitest 配置
3. **当天**：Dev 执行 pnpm audit 确认 DOMPurify 漏洞真实性
4. **Sprint 内**：方案 B 系统性根因修复，防止再次污染

---

## 附录：关键检查命令汇总

```bash
# 1. TypeScript 检查
cd /root/.openclaw/vibex/vibex-fronted && npx tsc --noEmit

# 2. ESLint 检查
cd /root/.openclaw/vibex/vibex-fronted && npx eslint . --format stylish

# 3. DOMPurify 依赖树
cd /root/.openclaw/vibex && npm ls dompurify 2>&1 | grep -v "extraneous"

# 4. Audit（需解决 pnpm 问题）
cd /root/.openclaw/vibex/vibex-fronted && pnpm audit

# 5. Git 历史检查
cd /root/.openclaw/vibex/vibex-fronted && git log --oneline tests/e2e/canvas-expand.spec.ts | head -5

# 6. Pre-test check
cd /root/.openclaw/vibex/vibex-fronted && npm run test
```
