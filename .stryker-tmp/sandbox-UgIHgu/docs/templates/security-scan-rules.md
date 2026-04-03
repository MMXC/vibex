# 安全扫描规则扩展

**版本**: 1.0
**创建日期**: 2026-03-18
**维护人**: Reviewer Agent

---

## 1. 概述

扩展 VibeX 项目安全扫描规则，提升漏洞发现能力。

---

## 2. 当前状态

| 检查项 | 状态 | 说明 |
|--------|------|------|
| npm audit | ✅ 基础 | 检测直接依赖漏洞 |
| 敏感信息扫描 | ⚠️ 简化 | 仅 grep 硬编码 |
| 依赖深度扫描 | ❌ 缺失 | 无法检测传递依赖 |

---

## 3. 扩展规则

### 3.1 依赖漏洞扫描

```bash
# 直接依赖漏洞
npm audit

# 传递依赖漏洞 (深度扫描)
npm ls --all

# 安全公告检查
npm audit --audit-level=high
```

### 3.2 敏感信息检测

```bash
# 硬编码凭证
grep -rn "password\|secret\|token\|apiKey\|apikey" --include="*.ts" --include="*.tsx"

# 环境变量泄露
grep -rn "process.env" --include="*.ts" --include="*.tsx" | grep -v "= process.env"

# 私钥检测
grep -rn "PRIVATE KEY\|BEGIN.*PRIVATE KEY" .
```

### 3.3 代码注入检测

```bash
# eval/exec 使用
grep -rn "eval\|exec\|spawn" --include="*.ts" --include="*.tsx"

# 动态代码生成
grep -rn "new Function\|eval\|setTimeout.*string\|setInterval.*string"
```

### 3.4 XSS 防护检查

```bash
# dangerouslySetInnerHTML 使用
grep -rn "dangerouslySetInnerHTML" --include="*.tsx"

# 内部HTML注入
grep -rn "innerHTML\|outerHTML" --include="*.ts" --include="*.tsx"
```

### 3.5 路径遍历检测

```bash
# 文件路径操作
grep -rn "\.\/\|\\\\|\/\.\." --include="*.ts" | grep -v "import\|require"
```

---

## 4. 检查清单

### 4.1 依赖安全

- [ ] npm audit 无高危漏洞
- [ ] 依赖版本无已知 CVE
- [ ] 无过期的依赖包

### 4.2 代码安全

- [ ] 无硬编码凭证
- [ ] 无命令注入风险
- [ ] 无路径遍历漏洞
- [ ] XSS 防护到位

### 4.3 配置安全

- [ ] .gitignore 包含敏感文件
- [ ] 环境变量正确使用
- [ ] 无调试模式泄露

---

## 5. 自动化脚本

```typescript
// scripts/security-scan.ts

interface SecurityScanResult {
  timestamp: string;
  vulnerabilities: Vulnerability[];
  hardcodedSecrets: Secret[];
  codeIssues: CodeIssue[];
}

async function runSecurityScan(): Promise<SecurityScanResult> {
  const [auditResult, secrets, injection, xss] = await Promise.all([
    runNpmAudit(),
    scanHardcodedSecrets(),
    scanCodeInjection(),
    scanXSS()
  ]);

  return {
    timestamp: new Date().toISOString(),
    vulnerabilities: auditResult,
    hardcodedSecrets: secrets,
    codeIssues: [...injection, ...xss]
  };
}
```

---

## 6. 集成 CI

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm audit --audit-level=high
      - run: node scripts/security-scan.js
```

---

## 7. 漏洞响应

| 级别 | 定义 | 响应时间 |
|------|------|----------|
| Critical | 数据泄露、远程执行 | 24h |
| High | 权限绕过、信息泄露 | 72h |
| Medium | 拒绝服务、绕过限制 | 1周 |
| Low | 最佳实践偏离 | 2周 |

---

**版本**: 1.0
**最后更新**: 2026-03-18
