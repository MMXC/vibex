# VibeX 构建修复（Reviewer 视角）— 实施计划

**项目**: vibex-reviewer-proposals-vibex-build-fixes-20260411
**日期**: 2026-04-11
**总工时**: ~8h（建议 2 天）

---

## Sprint 划分

| Sprint | 时间 | Epic | 工时 | 目标 |
|--------|------|------|------|------|
| Sprint 1 | D1 | Epic 1 + Epic 2 | ~2h | 解除构建阻塞 + PR 合入标准 |
| Sprint 2 | D2 | Epic 3 + Epic 4 | ~6h | CI 质量门禁体系 |

---

## Sprint 1: 解除阻塞

### Epic 1: 构建修复（15 min）

**Epic 1 已完成**（由 vibex-analyst-proposals dev-build-commit 子代理完成）。

**验证步骤**:
```bash
# 前端 TypeScript 检查
cd vibex-fronted && pnpm exec tsc --noEmit
# 期望: EXIT: 0

# 后端构建
cd vibex-backend && pnpm build
# 期望: EXIT: 0
```

---

### Epic 2: PR 合入标准文档（1h）

**代码修改点**:
```
docs/PR_MERGE_CRITERIA.md  ← 新建
```

**文档内容**:
1. **构建检查**: TypeScript 编译、ESLint 无错误、构建成功
2. **代码质量**: Prettier 格式化、测试覆盖率门槛
3. **安全检查**: 无敏感信息硬编码、依赖无已知漏洞

---

## Sprint 2: 质量门禁

### Epic 3: 预防规则（4h）

#### Story 3.1: Story 孤立组件检查脚本

**代码修改点**:
```
vibex-fronted/.github/workflows/check-stories.ts  ← 新建
```

**执行步骤**:
```bash
# 1. 创建检查脚本
cat > .github/workflows/check-stories.ts << 'EOF'
// Story 孤立组件检查脚本
import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';

const stories = execSync('find src -name "*.stories.tsx"').toString().trim().split('\n');
let errors = [];

for (const storyPath of stories) {
  const content = readFileSync(storyPath, 'utf-8');
  const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
  
  for (const match of importMatches) {
    const componentPath = join(dirname(storyPath), match[2]);
    if (!existsSync(componentPath) && !existsSync(componentPath + '.tsx') && !existsSync(componentPath + '.ts')) {
      errors.push(`[ERROR] ${storyPath} imports '${match[1]}' from '${match[2]}' but component not found`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('All story imports valid.');
EOF

# 2. 在 CI 中注册
# 添加到 .github/workflows/ci.yml
```

#### Story 3.2: ESLint 弯引号规则

**代码修改点**:
```javascript
// .eslintrc.json 或 .eslintrc.js
{
  "rules": {
    "no-irregular-whitespace": "error"
  }
}
```

**执行步骤**:
```bash
# 1. 验证当前无弯引号
grep -rn $'\u2018\|\u2019\|\u201c\|\u201d' vibex-fronted/src/ vibex-backend/src/ || echo "No curly quotes found"

# 2. 更新 ESLint 配置
# 添加 "no-irregular-whitespace": "error"
```

#### Story 3.3: Storybook 构建纳入 CI

**代码修改点**:
```yaml
# .github/workflows/ci.yml 新增 step
- name: Build Storybook
  run: pnpm build-storybook
  timeout-minutes: 15
```

---

### Epic 4: 质量门禁体系（2h）

#### Story 4.1: 自动化 CI 门禁配置

**前端 CI 流程**:
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on: [push, pull_request]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: TypeScript Check
        run: cd vibex-fronted && pnpm exec tsc --noEmit
      - name: ESLint
        run: cd vibex-fronted && pnpm exec eslint src/
      - name: Build Storybook
        run: cd vibex-fronted && pnpm build-storybook
      - name: Story Orphan Check
        run: cd vibex-fronted && npx ts-node .github/workflows/check-stories.ts
      - name: Curly Quote Scan
        run: grep -rn $'\u2018\|\u2019\|\u201c\|\u201d' vibex-fronted/src/ || true
```

**后端 CI 流程**:
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI
on: [push, pull_request]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: TypeScript Check
        run: cd vibex-backend && pnpm exec tsc --noEmit
      - name: ESLint
        run: cd vibex-backend && pnpm exec eslint src/
      - name: Curly Quote Scan
        run: grep -rn $'\u2018\|\u2019\|\u201c\|\u201d' vibex-backend/src/ || true
```

---

## 验收总览

| Epic | Story | 验收条件 | 状态 |
|------|-------|----------|------|
| 1 | 1.1 | CanvasHeader.stories.tsx 已删除 | ✅ 已完成 |
| 1 | 1.2 | 弯引号已替换 | ✅ 已完成 |
| 1 | 1.3 | 构建验证通过 | ✅ 已完成 |
| 2 | 2.1 | PR 合入标准文档存在 | ✅ 已完成 |
| 3 | 3.1 | check-stories.ts 运行成功 | ✅ 已配置 |
| 3 | 3.2 | ESLint 规则已配置 | ✅ 已配置（no-irregular-whitespace）+
scripts/check-curly-quotes.sh |
| 3 | 3.3 | build-storybook 在 CI 中 | ✅ 已配置（CI workflow 已包含）|
| 4 | 4.1 | CI 门禁全绿 | ✅ 已配置 |
