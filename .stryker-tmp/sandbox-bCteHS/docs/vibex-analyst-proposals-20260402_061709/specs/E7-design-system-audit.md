# Spec: E7 - 设计系统一致性审计

## 1. 概述

**工时**: 6-8h | **优先级**: P3
**依赖**: 无外部依赖

## 2. 修改范围

### 2.1 移除 emoji

**搜索**: `packages/canvas/src/`
```bash
grep -r "emoji\|🟢\|🔴\|✅\|❌" packages/canvas/src/
```

**替换方案**: SVG icon 组件

### 2.2 spacing token

**文件**: `packages/canvas/src/styles/tokens.css`

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

### 2.3 DESIGN.md

**文件**: `DESIGN.md`

```markdown
# VibeX 设计系统

## 颜色 Token
- primary: #xxx
- success: #xxx
- warning: #xxx
- error: #xxx

## Spacing Token
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## 组件规范
### Checkbox
- 位置: type badge 前
- 确认反馈: 绿色 ✓
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E7-AC1 | grep canvas | emoji | = 0 |
| E7-AC2 | 检查 tokens | spacing | 5 级定义完整 |
| E7-AC3 | 检查 DESIGN.md | 完整性 | 包含颜色/spacing/组件 |

## 4. DoD

- [ ] canvas 范围无 emoji
- [ ] spacing token 完整
- [ ] DESIGN.md 完整
