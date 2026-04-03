# Epic 2: 安全漏洞监控 — 技术规格

## 概述

建立持续安全漏洞监控机制，追踪当前 `dompurify` XSS 漏洞（GHSA-v2wj-7wpq-c8vv），并通过 CI 和 CHANGELOG 记录追踪状态。

---

## E2-S1: dompurify XSS 漏洞追踪文档

### 漏洞信息
- **CVE/GHSA**: GHSA-v2wj-7wpq-c8vv
- **影响**: dompurify XSS 漏洞，通过 monaco-editor 间接依赖引入
- **直接依赖状态**: 已升级（无直接依赖漏洞）
- **间接依赖状态**: 等待上游 monaco-editor 修复

### 实施步骤
1. 在 `CHANGELOG.md` 追加安全漏洞追踪条目：
   ```markdown
   ## 安全漏洞追踪
   
   | 漏洞 ID | 严重度 | 依赖 | 状态 | 更新日期 |
   |---------|--------|------|------|---------|
   | GHSA-v2wj-7wpq-c8vv | High (XSS) | monaco-editor → dompurify | 等待上游修复 | 2026-04-02 |
   ```
2. 创建 `SECURITY.md` 文档记录漏洞详情和缓解措施
3. 每 sprint 复查时更新状态

### 缓解措施
- 前端渲染用户输入时增加额外 HTML 过滤层
- 限制 monaco-editor 内容来源，不渲染不可信 HTML
- 监控上游 monaco-editor 更新，及时升级

### 验收条件
- CHANGELOG.md 包含漏洞条目
- SECURITY.md 存在且记录缓解措施
- 当前 sprint 复查记录存在

---

## E2-S2: 建立上游漏洞监控机制

### 实施步骤
1. 创建 `scripts/check-security.sh` 脚本：
   ```bash
   #!/bin/bash
   echo "=== Security Audit ==="
   npm audit --audit-level=moderate
   echo "=== Indirect Dependencies ==="
   npm list --depth=2 | grep -E "(dompurify|monaco-editor)"
   ```
2. 在 CI 中集成此检查
3. 在 `AGENTS.md` 或 `CONTRIBUTING.md` 中说明每 sprint 检查流程

### 验收条件
- `scripts/check-security.sh` 存在且可执行
- CI 中集成安全检查步骤
- 文档说明每 sprint 检查流程
