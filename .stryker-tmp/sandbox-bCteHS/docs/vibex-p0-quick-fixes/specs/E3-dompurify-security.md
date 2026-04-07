# Spec: E3 - DOMPurify 安全审查

## 1. 概述

**工时**: 0.25h | **优先级**: P0
**依赖**: 无（可与 E1/E2 并行）

## 2. 当前状态

- DOMPurify 版本: 3.3.3（最新版）
- 所有间接依赖统一指向 3.3.3
- **未发现 monaco-editor 依赖**

## 3. 审查步骤

### 3.1 npm audit

```bash
cd vibex-fronted
npm audit --audit-level=high 2>&1 | grep -c "high\|critical"
# 期望: 0
```

### 3.2 如需添加 overrides

```json
// package.json
{
  "overrides": {
    "dompurify": "^3.3.3"
  }
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E3-AC1 | 执行 audit | npm audit --audit-level=high | high/critical = 0 |
| E3-AC2 | 检查版本 | DOMPurify | >= 3.3.3 |

## 5. DoD

- [ ] npm audit 无 high/critical
- [ ] DOMPurify 版本 >= 3.3.3
