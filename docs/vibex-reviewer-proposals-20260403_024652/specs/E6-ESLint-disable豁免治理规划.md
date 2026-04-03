# SPEC: E6 — ESLint disable 豁免治理（规划，Sprint 4）

**项目**: vibex-reviewer-proposals-20260403_024652
**Epic**: E6: ESLint disable 豁免治理（规划，Sprint 4）
**版本**: v1.0
**日期**: 2026-04-03
**状态**: 规划中

---

## 1. Epic 概述

### 1.1 目标
系统性治理 eslint-disable 滥用，建立豁免记录和定期复查机制。

### 1.2 背景问题
- 代码库中有 16+ 处 eslint-disable 注释
- 涵盖 `@typescript-eslint/no-explicit-any`、`react-hooks/rules-of-hooks` 等规则
- 部分注释理由充分（性能优化），但缺乏统一记录和定期复查机制
- 长期积累会削弱 ESLint 作为质量门禁的有效性

### 1.3 预期收益
- 所有 eslint-disable 有明确记录和理由
- 定期复查机制防止豁免滥用
- ESLint 质量门禁真正有效

---

## 2. Stories

### E6-S1: 现有 eslint-disable 分类与记录（规划）

**功能点**:
1. **全量扫描**
   ```bash
   grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx" > eslint-disable-inventory.txt
   ```

2. **分类评估**
   - ✅ 合理保留（如 render 阶段 DOM 查询性能优化）
   - ❌ 需修复（如 `as any` 在非测试文件中）
   - ⚠️ 待定（需进一步评估）

3. **创建 `ESLINT_DISABLES.md`**
   ```markdown
   # ESLint Disable 豁免记录

   ## 豁免清单

   | 文件 | 行号 | 规则 | 理由 | 评估 | 复查日期 |
   |------|------|------|------|------|---------|
   | src/utils/dom.ts | 15 | no-explicit-any | 性能优化，避免每次渲染重新查询 DOM | ✅ 合理 | 2026-Q2 |
   ```

4. **复查机制**
   - 每 Sprint 审查一次所有豁免
   - 过期豁免需要重新评估
   - 新增豁免必须经过 Reviewer 批准

**验收标准**:
```javascript
expect(fs.existsSync('vibex-fronted/ESLINT_DISABLES.md')).toBe(true);
const doc = fs.readFileSync('vibex-fronted/ESLINT_DISABLES.md', 'utf8');
expect(doc).toContain('豁免清单');
expect(doc).toContain('复查机制');
expect(doc).toContain('✅ 合理');
expect(doc).toContain('❌ 需修复');
```

**工时**: 8h（规划）
**依赖**: Sprint 3 完成
**优先级**: P2（规划）

---

## 3. DoD Checklist（规划）

- [ ] `ESLINT_DISABLES.md` 已创建
- [ ] 所有现有 eslint-disable 已有分类记录
- [ ] 复查机制已定义
- [ ] 定期复查已列入团队流程
