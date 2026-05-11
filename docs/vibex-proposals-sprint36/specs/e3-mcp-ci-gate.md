# Spec E3: MCP DoD CI Gate

## 概述

在 GitHub Actions CI 中增加 tool-index 同步验证 job，防止 MCP tool 源文件变更后文档失步。

## 现状分析

- `scripts/generate-tool-index.ts` 已存在且完整
- `docs/mcp-tools/INDEX.md` 已存在（2026-04-30 自动生成）
- `.github/workflows/test.yml` 存在，需要新增 job

## S3.1 Tool Index CI 验证

### 文件位置
`.github/workflows/test.yml`（修改）

### 实现要求

在现有 `test.yml` 中新增 job：

```yaml
  generate-tool-index:
    name: Generate and verify MCP tool index
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要 git diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate tool index
        run: node scripts/generate-tool-index.ts

      - name: Check for index changes
        run: |
          if git diff --exit-code docs/mcp-tools/INDEX.md; then
            echo "INDEX.md is up to date"
          else
            echo "ERROR: INDEX.md is out of sync with tool definitions"
            echo "Please run 'node scripts/generate-tool-index.ts' and commit the changes"
            exit 1
          fi
```

### Trigger 配置

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'packages/mcp-server/src/tools/**/*.ts'
      - 'scripts/generate-tool-index.ts'
  pull_request:
    branches: [main]
    paths:
      - 'packages/mcp-server/src/tools/**/*.ts'
      - 'scripts/generate-tool-index.ts'
```

### 降级路径

当 `generate-tool-index.ts` 脚本执行失败时：
- CI job 整体 fail（脚本 exit 1）
- 错误信息清晰指出哪个 tool 文件有问题

---

## DoD 检查清单

- [ ] `.github/workflows/test.yml` 包含 `generate-tool-index` job
- [ ] job 在 tool 源文件变更时触发（paths 配置正确）
- [ ] `node scripts/generate-tool-index.ts` 被执行
- [ ] `git diff --exit-code` 检测 INDEX.md 失步
- [ ] INDEX.md 失步时 CI exit code = 1
- [ ] INDEX.md 同步时 CI exit code = 0
