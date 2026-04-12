# Spec: Epic 6 — 流程标准化

**Epic**: E6  
**PRD 引用**: `prd.md` § Epic 6  
**优先级**: P1  
**目标 Sprint**: Sprint 2（04/15-04/18）  
**工时**: 1.5h（S6.1: 0.75h, S6.2: 0.75h）  
**前置依赖**: 无  
**状态**: 待开发

---

## 概述

建立标准化 SOP，减少重复提案和 Token 日志类问题的再次发生。

---

## 详细设计

### S6.1 — 需求澄清 SOP

#### F6.1: 需求澄清标准操作流程

**问题背景**: 当前需求来源混杂（Analyst、Architect、Reviewer、Tester），缺乏统一的需求澄清步骤，导致提案重复、验收标准模糊。

**SOP 内容**（写入 `docs/AGENTS.md` 和 `docs/proposals/SOP.md`）:

```markdown
## 需求澄清 SOP

### 触发条件
收到任何需求提案时，必须执行以下步骤：

### Step 1: 5W 确认
- **Who**: 谁需要这个功能？用户画像是什么？
- **What**: 具体要解决什么问题？不能用什么词？
- **Why**: 为什么要做？收益是什么？
- **When**: 何时需要？优先级依据是什么？
- **Where**: 在哪个场景触发？

### Step 2: 验收标准制定
每个需求必须有明确的验收标准（Acceptance Criteria）：
- Given / When / Then 格式
- 可测试、可验证
- 覆盖正常路径和异常路径

### Step 3: 依赖检查
- 技术依赖（需要哪些团队/系统配合）
- 优先级确认（MoSCoW / RICE）
- 阻塞风险评估

### Step 4: 提案文档化
- 写入 `docs/proposals/` 目录
- 包含以上所有信息
- 添加到 `INDEX.md`（status: pending）

### Step 5: 评审
- PM 初审（确认需求清晰度）
- Architect 评审（确认技术可行性）
- 评审通过后 status → in-progress
```

### S6.2 — console.* pre-commit hook

#### F6.2: ESLint 拦截 console.*

**问题描述**: Token 日志泄露的根本原因是缺乏强制检查机制。

**解决方案**: 在 pre-commit hook 中使用 ESLint 规则拦截 `console.*` 调用。

**实现**:

```yaml
# packages/eslint-config-custom/index.js
module.exports = {
  rules: {
    'no-console': ['error', {
      allow: ['warn', 'error'], // 允许 warn/error，禁止 log/debug
    }],
    // 或更严格的规则：
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="console"][arguments.length>=1]',
        message: 'Use safeLog or safeError instead of console.*',
      },
    ],
  },
};
```

**pre-commit hook**:
```yaml
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Stage 检查（暂存区文件才检查）
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -n "$STAGED_FILES" ]; then
  echo "Running ESLint on staged files..."
  npx eslint --max-warnings=0 $STAGED_FILES
  
  if [ $? -ne 0 ]; then
    echo "❌ ESLint failed. Please fix the errors before committing."
    exit 1
  fi
fi

echo "✅ Pre-commit checks passed"
```

**安装步骤**:
```bash
# 安装 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npx eslint --max-warnings=0 ."

# 验证
git add .husky/pre-commit
git commit -m "chore: add pre-commit ESLint hook"
```

---

## API/接口

本 Epic 不涉及 API 接口变更，纯流程和工具层面。

---

## 实现步骤

### Phase 1: 需求澄清 SOP（0.75h）

1. **更新 AGENTS.md**
   - 在 PM 章节添加 SOP 引用
   - 链接到 `docs/proposals/SOP.md`

2. **更新 SOP.md**
   - 补充完整的 5 步流程

3. **通知团队**

### Phase 2: console.* pre-commit（0.75h）

1. **安装 husky**
   ```bash
   cd /root/.openclaw/vibex
   npm install -D husky
   npx husky install
   ```

2. **配置 ESLint 规则**
   - 更新 `packages/eslint-config-custom/index.js`

3. **创建 pre-commit hook**
   ```bash
   npx husky add .husky/pre-commit "npx eslint --max-warnings=0 ."
   ```

4. **测试拦截**
   ```bash
   # 验证：添加一行 console.log 应被拦截
   echo "console.log('test')" >> /tmp/test-file.ts
   npx eslint /tmp/test-file.ts
   # 应报错
   ```

---

## 验收测试

### AC6.1 — 需求澄清 SOP

```typescript
//验收测试: 需求澄清SOP存在且完整
describe('Requirement Clarification SOP (AC6.1)', () => {
  const sopPath = '/root/.openclaw/vibex/docs/proposals/SOP.md';
  const agentsPath = '/root/.openclaw/vibex/docs/vibex-proposals-20260412/AGENTS.md';

  it('SOP document exists', () => {
    expect(fs.existsSync(sopPath)).toBe(true);
  });

  it('SOP contains 5W section', () => {
    const content = fs.readFileSync(sopPath, 'utf-8');
    expect(content).toMatch(/Who|who/);
    expect(content).toMatch(/What|what/);
    expect(content).toMatch(/Why|why/);
    expect(content).toMatch(/When|when/);
    expect(content).toMatch(/Where|where/);
  });

  it('SOP defines acceptance criteria requirements', () => {
    const content = fs.readFileSync(sopPath, 'utf-8');
    expect(content).toMatch(/验收标准|acceptance.?criteria/i);
    expect(content).toMatch(/Given.*When.*Then/s);
  });

  it('SOP defines 5 steps', () => {
    const content = fs.readFileSync(sopPath, 'utf-8');
    const stepMatches = content.match(/Step\s*\d+/gi) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(4);
  });

  it('AGENTS.md references the SOP', () => {
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    expect(agentsContent).toMatch(/SOP|sop/i);
  });
});
```

### AC6.2 — console.* pre-commit

```typescript
//验收测试: console.* pre-commit hook拦截生效
describe('console.* Pre-commit Hook (AC6.2)', () => {
  const preCommitPath = '/root/.openclaw/vibex/.husky/pre-commit';
  const eslintConfigPath = '/root/.openclaw/vibex/packages/eslint-config-custom/index.js';

  it('pre-commit hook exists', () => {
    expect(fs.existsSync(preCommitPath)).toBe(true);
  });

  it('pre-commit hook references ESLint', () => {
    const content = fs.readFileSync(preCommitPath, 'utf-8');
    expect(content).toMatch(/eslint/i);
  });

  it('ESLint config has no-console rule', () => {
    const content = fs.readFileSync(eslintConfigPath, 'utf-8');
    expect(content).toMatch(/['"]no-console['"]/);
  });

  it('console.log is blocked by ESLint', () => {
    const testFile = '/tmp/eslint-test-console.ts';
    fs.writeFileSync(testFile, 'console.log("leaked token: abc123");\n');
    
    const result = execSync(
      `npx eslint ${testFile} 2>&1`,
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    
    const hasError = result.includes('error') || result.includes('no-console');
    expect(hasError).toBe(true);
  });

  it('safeLog and safeError are allowed', () => {
    const testFile = '/tmp/eslint-test-safe.ts';
    fs.writeFileSync(testFile, `
import { safeLog, safeError } from '@vibex/utils';
safeLog('test', { key: 'value' });
safeError('test', new Error('msg'));
console.warn('allowed warning');
`.trim() + '\n');

    const result = execSync(
      `npx eslint ${testFile} 2>&1`,
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    
    // 仅允许 warn/error，log/debug 应被拦截
    const hasBlockedError = result.includes('no-console') && result.includes('log');
    expect(hasBlockedError).toBe(true);
  });

  it('pre-commit hook blocks commits with console.log', () => {
    // 模拟 staged 文件包含 console.log
    const testRepo = '/tmp/vibex-test-repo';
    execSync(`cp -r /root/.openclaw/vibex ${testRepo}`);
    execSync('git init', { cwd: testRepo });
    execSync('git config user.email "test@test.com"', { cwd: testRepo });
    execSync('git config user.name "Test"', { cwd: testRepo });
    
    const testFile = `${testRepo}/test-leak.ts`;
    fs.writeFileSync(testFile, 'console.log("SECRET_TOKEN");');
    execSync(`git add ${testFile}`, { cwd: testRepo });
    
    // pre-commit hook 应失败
    const result = execSync(
      'sh .husky/pre-commit 2>&1 || true',
      { encoding: 'utf-8', cwd: testRepo }
    );
    expect(result).toMatch(/failed|error/i);
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| SOP 文档建立后执行率低 | 高 | 中 | 定期审计提案是否符合 SOP，纳入 team-tasks 追踪 |
| ESLint 误报（合法 console.warn） | 低 | 低 | 配置 allow 列表，允许 warn/error |
| pre-commit hook 安装失败 | 低 | 中 | 提供手动安装说明 |
