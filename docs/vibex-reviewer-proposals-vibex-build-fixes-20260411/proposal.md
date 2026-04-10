# VibeX 构建修复审查提案

**提案日期**: 2026-04-11
**问题类别**: 构建失败（前端 + 后端）
**影响范围**: `vibex-fronted` / `vibex-backend`
**提案编号**: vibex-reviewer-proposals-vibex-build-fixes-20260411

---

## 1. 问题概述

| # | 严重度 | 影响范围 | 根因分类 |
|---|--------|----------|----------|
| 问题1: CanvasHeader 引用缺失 | 🔴 高 | `vibex-fronted` 构建 | 孤立 Storybook 文件引用不存在的组件 |
| 问题2: Unicode 弯引号 | 🟡 中 | `vibex-backend` 构建 | 3个 API route 文件含 Unicode 弯引号（`'`/`'`/`"`/`"`），破坏 TS 解析 |

---

## 2. 代码审查要点

### 2.1 问题1: `CanvasHeader.stories.tsx` 引用不存在的组件

**文件**: `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`

**现状**:
```tsx
import { CanvasHeader } from '../CanvasHeader';
```
`../CanvasHeader` 组件文件不存在于 `canvas/` 目录中。`canvas/` 下仅存在 `CanvasToolbar.tsx` 等组件，无 `CanvasHeader.tsx`。

**审查要点**:

| 检查项 | 说明 |
|--------|------|
| Story 文件是否与实际组件一一对应 | 每个 `.stories.tsx` 必须对应一个真实导出的组件 |
| 组件路径是否存在 | 使用绝对或相对路径导入前，确认目标文件存在 |
| Story 中的 `component` prop 类型是否匹配 | `Meta<typeof CanvasHeader>` 依赖组件实际存在才能完成类型推导 |
| Story 中引用的 props 是否在组件中声明 | 本次仅发现 `mode: 'edit' | 'project'`，需确认组件实际接受此接口 |

**修复方案**:

**方案 A（推荐）**: 删除孤立的 story 文件
```bash
rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
```
原因：`CanvasHeader` 组件不存在，无需保留无对应组件的 story。

**方案 B**: 如果 `CanvasHeader` 是规划中的组件，需先创建组件再修复 story。

### 2.2 问题2: Unicode 弯引号破坏 TypeScript 解析

**受影响文件**:
- `vibex-backend/src/app/api/agents/route.ts`
- `vibex-backend/src/app/api/pages/route.ts`
- `vibex-backend/src/app/api/prototype-snapshots/route.ts`

**根因**: 文件中部分引号使用了 Unicode 弯引号（`'` U+2018/`'` U+2019/`"` U+201C/`"` U+201D）而非标准 ASCII 引号（`'` U+0027/`"` U+0022），导致 TypeScript/JavaScript 词法分析失败。

**审查要点**:

| 检查项 | 说明 |
|--------|------|
| 所有引号是否为 ASCII 标准字符 | 弯引号 `'` `"` 与直引号 `'` `"` 语义不同 |
| 字符串字面量一致性 | 同一文件内混用不同引号类型会引发解析错误 |
| 文件编码一致性 | 确保文件以 UTF-8 编码保存，避免多字节字符意外引入 |

**修复方案**:

```bash
# 将所有 Unicode 弯引号替换为 ASCII 直引号
sed -i "s/[']/'/g; s/["]/"/g" \
  vibex-backend/src/app/api/agents/route.ts \
  vibex-backend/src/app/api/pages/route.ts \
  vibex-backend/src/app/api/prototype-snapshots/route.ts
```

修复后需验证：
```bash
# 确认无残留 Unicode 弯引号
python3 -c "
import sys
files = [
    'vibex-backend/src/app/api/agents/route.ts',
    'vibex-backend/src/app/api/pages/route.ts',
    'vibex-backend/src/app/api/prototype-snapshots/route.ts',
]
for f in files:
    with open(f, 'rb') as fh:
        data = fh.read()
    found = []
    for i in range(len(data)-2):
        if data[i] == 0xe2 and data[i+1] in (0x80, 0x9c, 0x9d):
            cp = (data[i]&0x0f)<<12 | (data[i+1]&0x3f)<<6 | (data[i+2]&0x3f)
            if cp in (0x2018,0x2019,0x201c,0x201d):
                found.append(f'  U+{cp:04X} at byte {i}')
    if found:
        print(f'{f}: {found}')
    else:
        print(f'{f}: OK - no curly quotes')
"
```

---

## 3. PR 合入标准

在将修复 PR 合入主分支前，必须满足以下所有条件：

### 构建验证

```bash
# 前端构建验证
cd vibex-fronted && npm run build

# 后端构建验证
cd vibex-backend && npx tsc --noEmit
```

- [ ] `npm run build` (frontend) 退出码为 0
- [ ] `npx tsc --noEmit` (backend) 退出码为 0，无 `TS` 错误
- [ ] Storybook 构建（若 Storybook 存在）通过

### 代码质量

- [ ] 所有变更仅涉及本次问题相关文件，无无关修改
- [ ] 修改后无新的 lint 错误（`npm run lint`）
- [ ] Unicode 弯引号已彻底清除（通过上述 Python 脚本验证）

### 安全与一致性

- [ ] API route 中 `V0_DEPRECATION_HEADERS` 未被误删或改动
- [ ] Auth 逻辑未被改动
- [ ] Prisma schema 操作未被改动

---

## 4. 预防类似问题的审查规则

### 规则 1: Storybook Story 文件必须有对应组件

**触发条件**: 新增或修改 `**/*.stories.tsx`
**检查方式**: CI 中加入自动化检查

```typescript
// .github/workflows/check-stories.ts（或集成到 lint 流程）
import { glob } from 'glob';
import { existsSync } from 'fs';
import { resolve } from 'path';

const storyFiles = await glob('src/**/*.stories.tsx');
const errors: string[] = [];

for (const story of storyFiles) {
  // 提取 import 语句中的组件路径
  const content = await readFile(story, 'utf-8');
  const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    const importedPath = match[1];
    const resolvedPath = resolve(story, '..', importedPath);
    if (!existsSync(resolvedPath) && !existsSync(resolvedPath + '.tsx')) {
      errors.push(`${story}: imports non-existent component "${importedPath}"`);
    }
  }
}

if (errors.length > 0) {
  console.error('Storybook import errors:', errors);
  process.exit(1);
}
```

### 规则 2: 禁止 Unicode 弯引号进入源码

**触发条件**: 任意 `.ts` / `.tsx` / `.js` / `.jsx` 文件提交
**检查方式**: ESLint 规则 + pre-commit hook

```json
// .eslintrc.json (相关 rules)
{
  "rules": {
    "no-irregular-whitespace": "error",
    "curly": ["error", "all"]
  }
}
```

```bash
# pre-commit hook (或 husky)
#!/bin/bash
BAD_CHARS=$(grep -rPl $'[\xE2\x80\x98-\xE2\x80\x99\xE2\x80\x9C-\xE2\x80\x9D]' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  . 2>/dev/null)

if [ -n "$BAD_CHARS" ]; then
  echo "❌ Unicode curly quotes found in:"
  echo "$BAD_CHARS"
  echo "Replace with ASCII quotes: ' -> ', \" -> \""
  exit 1
fi
```

### 规则 3: 构建必须通过才能合入 PR

- **强制**: `main` / `master` 分支合入前必须通过 GitHub Actions CI
- **前端 CI 步骤**: `npm run build` + `npm run lint`
- **后端 CI 步骤**: `npx tsc --noEmit` + `npm run lint`

### 规则 4: Storybook 构建纳入 CI

```yaml
# .github/workflows/ci.yml (新增步骤)
- name: Storybook Build
  run: npm run build-storybook
  working-directory: vibex-fronted
```

---

## 5. 质量门禁建议

### 5.1 自动化门禁（CI/CD 级别）

| 门禁 | 工具 | 失败处理 |
|------|------|----------|
| TypeScript 类型检查 | `tsc --noEmit` | CI 失败，阻止合入 |
| Storybook 构建 | `build-storybook` | CI 失败，阻止合入 |
| ESLint 检查 | `eslint src` | CI 失败，阻止合入 |
| 弯引号扫描 | `grep -rPl [弯引号]` | CI 失败，阻止合入 |
| Story 孤立组件检查 | 自定义脚本 | CI 失败，阻止合入 |
| Prettier 格式化 | `prettier --check` | CI 失败，阻止合入 |

### 5.2 Code Review 门禁（人工审查级别）

| 审查项 | 审查人 | 通过条件 |
|--------|--------|----------|
| Import 路径准确性 | Reviewer | 所有 import 路径对应真实文件 |
| 字符串引号一致性 | Reviewer | 无弯引号混用 |
| Story → Component 对应关系 | Reviewer | 每个 story 有对应组件 |
| 构建在本地通过 | Author | 合入前必须本地验证 |

### 5.3 长期质量建议

1. **引入 Prettier**: 统一代码格式，减少因引号风格不同导致的 lint 失败
2. **配置 EditorConfig**: 在团队编辑器层面统一字符集
3. **设置 husky pre-commit hook**: 在提交前运行 `npm run lint` 和弯引号扫描
4. **Storybook CI**: 将 Storybook 构建纳入 CI，及时发现孤立 story
5. **定期扫描**: 每季度运行一次全库弯引号扫描（避免历史积累）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID（待绑定）
- **执行日期**: 2026-04-11

---

*Generated by Analyst | 审查提案编号: vibex-reviewer-proposals-vibex-build-fixes-20260411*
