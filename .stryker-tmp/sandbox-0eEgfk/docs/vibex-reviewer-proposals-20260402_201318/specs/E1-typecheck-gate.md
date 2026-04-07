# Epic 1: 前端测试质量保障 — 技术规格

## 概述

修复 `canvas-expand.spec.ts` 中的 TypeScript 错误，并在 CI 层面建立 ESLint 门禁，防止 TypeScript 错误级别的 lint 错误进入 main 分支。

---

## E1-S1: 修复 canvas-expand.spec.ts TypeScript 错误

### 现状分析
- 文件：`frontend/tests/unit/canvas-expand.spec.ts`
- 症状：`npm run test` 的 pre-test-check ESLint 预检查失败
- 影响：阻塞所有前端测试的 CI 流程

### 实施步骤
1. 运行 `npx eslint frontend/tests/unit/canvas-expand.spec.ts --format=json` 定位具体错误行
2. 逐项修复 TypeScript 类型错误
3. 验证：`npm run test` pre-test-check 通过

### 验收条件
- `npx tsc --noEmit` 无 error
- `npm run lint` 无 TS error 输出

---

## E1-S2: 建立 ESLint TypeScript 错误门禁

### 实施步骤
1. 在 CI 配置（GitHub Actions 或其他）添加步骤：
   ```yaml
   - name: TypeScript type check
     run: npx tsc --noEmit
   ```
2. 在 ESLint 配置中确保 `@typescript-eslint/ban-ts-comment` 和相关规则启用
3. 配置 CI 在 lint/stage 阶段失败时阻断 PR merge
4. 实测：创建一个包含 `as any` 的测试 PR，验证 CI 失败

### CI 配置示例
```yaml
# .github/workflows/ci.yml
types:
  - name: TypeScript Check
    run: npx tsc --noEmit
    fail-on: errors

  - name: ESLint
    run: npx eslint ./frontend --max-warnings 0
    fail-on: warnings
```

### 验收条件
- 包含 TS error 的 PR push 时 CI 失败
- main 分支实测零 TS error
- PR 状态检查中可见 TypeScript Check 门禁

---

## E1-S3: npm audit CI 集成

### 实施步骤
1. 在 CI 的 test stage 添加：
   ```yaml
   - name: Security audit
     run: npm audit --audit-level=moderate
   ```
2. 可选：设置 Slack webhook 通知当检测到高危漏洞
3. 在 CHANGELOG 中记录当前 dompurify XSS 漏洞状态

### 验收条件
- CI 包含 `npm audit --audit-level=moderate` 检查
- 漏洞等级 moderate 及以上时 CI 失败

---

## DoD 检查清单

- [ ] E1-S1: `npx tsc --noEmit` 无 error
- [ ] E1-S1: `npm run lint` 无 TS error
- [ ] E1-S2: CI 配置包含 TypeScript check 步骤
- [ ] E1-S2: 包含 TS error 的 PR 被阻断
- [ ] E1-S3: CI 配置包含 `npm audit --audit-level=moderate`
- [ ] E1-S3: CHANGELOG 记录 dompurify 漏洞追踪
