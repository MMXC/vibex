# RCA 工具使用指南

**版本**: 2.0
**更新日期**: 2026-03-19

---

## 快速开始

```bash
# 基本用法
./tools/rca-tool/rca-tool.sh "问题描述" <目标路径>

# 示例：检查 UI 组件
./tools/rca-tool/rca-tool.sh "React 渲染问题" ./src/components/

# 示例：检查 API 模块
./tools/rca-tool/rca-tool.sh "API 集成问题" ./src/services/api/ -c api-integration
```

## 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `<issue>` | 问题描述（必需） | `"页面渲染失败"` |
| `<target-path>` | 目标代码路径（必需） | `./src/components/` |
| `-c, --category` | 模式类别 | `ui-rendering` |
| `-o, --output` | 输出文件 | `-o report.md` |
| `-f, --format` | 输出格式 | `-f json` |
| `-v, --verbose` | 详细输出 | `-v` |
| `--dry-run` | 仅分析，不生成报告 | `--dry-run` |
| `-l, --log` | 分析日志文件 | `-l app.log` |
| `-h, --help` | 显示帮助 | `-h` |

## 模式类别

| 类别 | 说明 | 适用场景 |
|------|------|----------|
| `ui-rendering` | React/Vue 渲染问题 | 组件问题、useEffect 问题 |
| `api-integration` | API 调用问题 | fetch/axios 错误处理 |
| `state-management` | 状态管理问题 | Zustand/Redux 状态同步 |
| `performance` | 性能问题 | 内存泄漏、无限循环 |

## 输出格式

### Markdown (默认)

```bash
./rca-tool.sh "问题" ./src/ -f markdown -o report.md
```

### JSON

```bash
./rca-tool.sh "问题" ./src/ -f json | jq .
```

### Text

```bash
./rca-tool.sh "问题" ./src/ -f text
```

## 检测模式

### UI 渲染模式

- **stale-closures**: useEffect 中的过时闭包
- **missing-dependencies**: useEffect 缺少依赖项
- **infinite-loops**: useEffect 无限循环

### API 集成模式

- **missing-error-handling**: 缺少错误处理
- **retry-loops**: 重试循环问题

### 性能模式

- **memory-leaks**: 内存泄漏模式

## 集成到 CI/CD

### GitHub Actions

```yaml
- name: Run RCA Tool
  run: |
    ./tools/rca-tool/rca-tool.sh \
      "CI Quality Check" ./src/ -c ui-rendering
```

完整工作流见 [`.github/workflows/rca-check.yml`](.github/workflows/rca-check.yml)

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
./tools/rca-tool/rca-tool.sh "pre-commit check" ./src/ -c ui-rendering --dry-run
```

## 报告解读

### 匹配格式

```
TYPE|LINE_NUMBER|内容片段
```

- `TYPE`: 匹配类型 (LOG_ERROR, PATTERN 等)
- `LINE_NUMBER`: 文件中的行号
- `内容片段`: 匹配的代码片段

### 严重程度

| 严重度 | 匹配数 | 建议 |
|--------|--------|------|
| ✅ 正常 | 0 | 无问题 |
| ⚠️ 警告 | 1-5 | 建议审查 |
| 🔴 严重 | > 5 | 必须处理 |

## 常见问题

### Q: 工具不执行？

```bash
# 检查权限
chmod +x ./tools/rca-tool/rca-tool.sh
```

### Q: jq 未安装？

```bash
# Ubuntu/Debian
apt install jq

# macOS
brew install jq
```

### Q: 如何忽略误报？

```bash
# 使用 --dry-run 先检查
./rca-tool.sh "check" ./src/ -c ui-rendering --dry-run
```

---

## 相关文件

- 工具脚本: `tools/rca-tool/rca-tool.sh`
- 模式定义: `tools/rca-tool/patterns/`
- 库函数: `tools/rca-tool/lib/`
- CI 工作流: `.github/workflows/rca-check.yml`
