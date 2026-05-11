# Spec E3: MCP DoD CI Gate

## S3.1 Tool Index CI 验证

### 实现位置
`.github/workflows/test.yml`（修改）

### 四态定义（CI Job）

| 状态 | 触发条件 | 行为 |
|------|----------|------|
| 成功态 | INDEX.md 与 tool 源码同步 | job exit 0，CI 通过 |
| 失败态（INDEX.md 失步）| `git diff docs/mcp-tools/INDEX.md` 非空 | job exit 1，CI 失败，输出引导文案 |
| 错误态 | `generate-tool-index.ts` 脚本执行失败 | job exit 1，CI 失败 |

### 实现要求

```yaml
generate-tool-index:
  name: Tool Index Sync
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # git diff 需要

    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate tool index
      run: node scripts/generate-tool-index.ts

    - name: Check for Index.md changes
      run: |
        if ! git diff --exit-code docs/mcp-tools/INDEX.md; then
          echo "ERROR: docs/mcp-tools/INDEX.md is out of sync with tool definitions"
          echo "Please run 'node scripts/generate-tool-index.ts' and commit the changes"
          exit 1
        fi

  paths:
    - 'packages/mcp-server/src/tools/**/*.ts'
    - 'scripts/generate-tool-index.ts'
```

### 引导文案（CI 失败输出）

当 INDEX.md 失步时，CI 日志输出：
```
ERROR: docs/mcp-tools/INDEX.md is out of sync with tool definitions
Please run 'node scripts/generate-tool-index.ts' and commit the changes
```

---

## DoD 检查清单

- [ ] `.github/workflows/test.yml` 包含 `name: Tool Index Sync` job
- [ ] job 使用 paths filter 配置（仅在 tool 文件变更时触发）
- [ ] `node scripts/generate-tool-index.ts` 被执行
- [ ] `git diff --exit-code docs/mcp-tools/INDEX.md` 逻辑存在
- [ ] INDEX.md 失步时 CI exit code = 1
- [ ] 失败输出包含引导文案（运行脚本 + commit）