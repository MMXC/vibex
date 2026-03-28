# 需求分析: 安全漏洞自动检测集成

**项目**: vibex-security-auto-detect
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 目标

集成 npm audit / pnpm audit 到 CI 流程和本地开发流程，实现依赖漏洞自动扫描，提升安全漏洞发现率 60%。

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| CI 安全扫描 | 存在但不阻塞 | 阻塞 critical/high |
| 本地安全扫描 | 无脚本 | 开发者可一键扫描 |
| 硬编码密钥检测 | 有配置但非强制 | 强制检测并阻塞 |
| 漏洞发现率 | 人工审查 | 自动化 90%+ |

### 预期收益

- 安全漏洞发现率提升 60%
- 依赖漏洞实时监控
- 开发阶段提前发现问题

---

## 2. 问题定义

### 2.1 核心痛点

| 问题 | 当前状态 | 影响 |
|------|----------|------|
| CI 扫描不阻塞 | `continue-on-error: true` | 漏洞可被忽略 |
| 无本地扫描脚本 | 开发者需手动运行 npm audit | 漏洞发现延迟 |
| 硬编码密钥检测弱 | 仅 gitleaks，无 pre-commit hook | 密钥可能被提交 |
| 扫描结果无汇总 | 分散在各 workflow | 难以追踪趋势 |

### 2.2 根因分析

| 环节 | 问题 | 影响 | 解决方案 |
|------|------|------|----------|
| CI 配置 | `continue-on-error: true` | 扫描失败仍可合并 | 改为阻塞模式 |
| 本地开发 | 无安全扫描脚本 | 漏洞在 CI 才发现 | 创建本地脚本 |
| Pre-commit | 无安全检查 hook | 硬编码密钥可提交 | 添加 husky hook |
| 报告汇总 | 无统一输出 | 无法追踪趋势 | 创建汇总脚本 |

### 2.3 业务场景

**场景 1**: 开发者提交代码
- 当前: 提交后 CI 才发现问题，需返工
- 期望: 本地 pre-commit 就检测到问题

**场景 2**: 依赖更新
- 当前: 更新后不知道是否有漏洞
- 期望: 更新时自动扫描新依赖

**场景 3**: 安全审计
- 当前: 手动运行多个命令，结果分散
- 期望: 一键生成安全报告

---

## 3. 现状分析

### 3.1 现有安全配置审查

| 文件 | 状态 | 问题 |
|------|------|------|
| `.github/workflows/security-scan.yml` | ✅ 存在 | `continue-on-error: true` 不阻塞 |
| `.github/workflows/dependency-security.yml` | ✅ 存在 | 同上 |
| `.gitleaks.toml` | ✅ 存在 | 规则完善 |
| `scripts/security-scan.sh` | ❌ 不存在 | 需创建 |
| `.husky/pre-commit` 安全检查 | ⚠️ 部分 | 需增强 |

### 3.2 现有 npm audit 结果

```bash
$ npm audit --audit-level=moderate
found 0 vulnerabilities
```

当前依赖状态良好，无已知漏洞。

### 3.3 现有 gitleaks 配置

配置文件包含 12 条规则:
- AWS Access Key / Secret Key
- GitHub Token
- Slack Token
- Private Key (RSA/SSH)
- API Key Generic
- VibeX 特定规则 (JWT Secret, Database URL, API Endpoint)

**结论**: 规则配置完善，但未在 pre-commit 强制执行。

---

## 4. 解决方案

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Scan Pipeline                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Local Development         CI/CD Pipeline                   │
│  ─────────────────         ────────────────                 │
│                                                             │
│  ┌─────────────┐          ┌──────────────────┐             │
│  │ pre-commit  │          │ security-scan.yml │             │
│  │   hook      │          │ dependency-sec.yml│             │
│  └──────┬──────┘          └────────┬─────────┘             │
│         │                          │                        │
│         v                          v                        │
│  ┌─────────────┐          ┌──────────────────┐             │
│  │ npm audit   │          │ npm audit        │             │
│  │ gitleaks    │          │ gitleaks         │             │
│  │ secret scan │          │ Snyk (optional)  │             │
│  └──────┬──────┘          └────────┬─────────┘             │
│         │                          │                        │
│         v                          v                        │
│  ┌─────────────┐          ┌──────────────────┐             │
│  │ Block on    │          │ Block PR on      │             │
│  │ Critical    │          │ Critical/High    │             │
│  └─────────────┘          └──────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 实施方案

| ID | 任务 | 产出物 | 预估工时 |
|----|------|--------|----------|
| F1 | 创建本地安全扫描脚本 | `scripts/security-scan.sh` | 1h |
| F2 | 增强 pre-commit hook | `.husky/pre-commit` 更新 | 0.5h |
| F3 | 修复 CI 阻塞配置 | workflow 文件修改 | 0.5h |
| F4 | 创建安全报告汇总 | `scripts/security-report.js` | 1h |

### 4.3 功能需求详细说明

#### F1: 本地安全扫描脚本

**文件**: `scripts/security-scan.sh`

**功能**:
- npm audit (依赖漏洞)
- gitleaks (硬编码密钥)
- 敏感文件检查 (.env 等)
- 生成报告

**验收标准**:
- AC1.1: 脚本支持 `--fix` 参数自动修复
- AC1.2: 脚本支持 `--report` 参数生成 JSON 报告
- AC1.3: Critical/High 漏洞返回非零退出码

#### F2: pre-commit hook 增强

**文件**: `.husky/pre-commit`

**功能**:
- 运行 gitleaks 检测硬编码密钥
- 运行 npm audit (仅检查 critical)
- 阻止有漏洞的提交

**验收标准**:
- AC2.1: 检测到硬编码密钥时阻止提交
- AC2.2: Critical 漏洞时阻止提交
- AC2.3: 可通过 `--no-verify` 跳过（紧急情况）

#### F3: CI 阻塞配置修复

**文件**: `.github/workflows/security-scan.yml`

**修改**:
```yaml
# 修改前
- run: npm audit --audit-level=moderate
  continue-on-error: true

# 修改后
- run: npm audit --audit-level=high
  # 移除 continue-on-error，critical/high 阻塞 CI
```

**验收标准**:
- AC3.1: Critical/High 漏洞阻塞 PR 合并
- AC3.2: Moderate/Low 仅警告不阻塞
- AC3.3: 生成扫描报告作为 artifact

#### F4: 安全报告汇总

**文件**: `scripts/security-report.js`

**功能**:
- 汇总 npm audit 结果
- 汇总 gitleaks 结果
- 生成 Markdown 报告
- 保存到 `security-reports/` 目录

**验收标准**:
- AC4.1: 报告包含漏洞数量、严重级别、修复建议
- AC4.2: 报告保存到 `security-reports/YYYY-MM-DD.md`
- AC4.3: 支持 CI 和本地两种运行模式

---

## 5. 技术方案

### 5.1 security-scan.sh 脚本设计

```bash
#!/bin/bash
# scripts/security-scan.sh - 本地安全扫描脚本

set -e

REPORT_MODE=false
FIX_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --report) REPORT_MODE=true; shift ;;
    --fix) FIX_MODE=true; shift ;;
    *) echo "Usage: $0 [--report] [--fix]"; exit 1 ;;
  esac
done

echo "🔍 Running security scan..."

# 1. npm audit
echo "📦 Checking dependencies..."
if npm audit --audit-level=high; then
  echo "✅ No high/critical vulnerabilities"
else
  echo "❌ Found vulnerabilities"
  [ "$FIX_MODE" = true ] && npm audit fix
  exit 1
fi

# 2. gitleaks (需要安装)
echo "🔐 Checking for hardcoded secrets..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --config .gitleaks.toml
else
  echo "⚠️  gitleaks not installed, skipping"
fi

# 3. 敏感文件检查
echo "📁 Checking for sensitive files..."
# ... (实现略)

echo "✅ Security scan complete"
```

### 5.2 pre-commit hook 增强

```bash
# .husky/pre-commit
#!/bin/bash
. "$(dirname "$0")/_/husky.sh"

# 安全检查
echo "🔍 Running security checks..."

# 1. 检查硬编码密钥
if command -v gitleaks &> /dev/null; then
  gitleaks protect --config .gitleaks.toml || {
    echo "❌ Hardcoded secrets detected!"
    exit 1
  }
fi

# 2. 检查关键漏洞 (仅 critical)
npm audit --audit-level=critical || {
  echo "❌ Critical vulnerabilities found!"
  exit 1
}

echo "✅ Security checks passed"
```

### 5.3 CI 配置修复

**关键修改点**:
1. 移除 `continue-on-error: true` (对于 critical/high)
2. 添加扫描结果 artifact 上传
3. 添加 PR 评论通知

---

## 6. 验收标准

### 6.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | `scripts/security-scan.sh` 存在并可执行 | `test -x` |
| AC1.2 | 脚本正确检测漏洞 | 模拟漏洞测试 |
| AC2.1 | pre-commit 检测硬编码密钥 | 提交含密钥文件 |
| AC2.2 | pre-commit 阻止 critical 漏洞 | 模拟漏洞提交 |
| AC3.1 | CI 阻塞 critical/high 漏洞 | PR 测试 |
| AC4.1 | 安全报告生成正确 | 运行脚本验证 |

### 6.2 质量验收

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| 扫描覆盖率 | 100% 依赖 + 密钥 | 配置检查 |
| 误报率 | < 5% | 测试验证 |
| 扫描时间 | < 30s | 本地测试 |

---

## 7. 风险评估

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|------|------|------|------|----------|
| gitleaks 未安装 | 中 | 低 | 低 | 脚本检测并跳过 |
| npm audit 误报 | 低 | 中 | 低 | 允许 --no-verify 跳过 |
| CI 扫描时间过长 | 低 | 低 | 低 | 缓存依赖 |
| 紧急提交被阻塞 | 中 | 高 | 中 | 提供 --no-verify 选项 |

### 7.2 依赖项

| 依赖 | 说明 |
|------|------|
| gitleaks | 硬编码密钥检测工具，需安装 |
| husky | pre-commit hook 管理，已存在 |

---

## 8. 实施建议

### 8.1 推荐优先级

1. **P0 (立即)**: F1 本地扫描脚本 + F3 CI 修复
2. **P1 (本周)**: F2 pre-commit 增强
3. **P2 (本月)**: F4 报告汇总

### 8.2 预估工时

| 阶段 | 工时 |
|------|------|
| F1 本地脚本 | 1h |
| F2 pre-commit | 0.5h |
| F3 CI 修复 | 0.5h |
| F4 报告汇总 | 1h |
| **总计** | **3h** |

### 8.3 下一步行动

1. PM 创建 PRD，细化功能需求
2. Dev 实施脚本和配置修改
3. Tester 验证安全检查流程

---

## 附录

### A. 现有安全配置文件

- `.github/workflows/security-scan.yml`
- `.github/workflows/dependency-security.yml`
- `.gitleaks.toml`
- `package.json` scripts: `scan:vuln`, `report:vuln`

### B. 相关提案

- Reviewer 提案 20260317: 安全漏洞自动检测集成 (P0)

### C. 参考资料

- [npm audit 文档](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [gitleaks 文档](https://github.com/gitleaks/gitleaks)
- [husky 文档](https://typicode.github.io/husky/)

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-security-auto-detect/analysis.md`