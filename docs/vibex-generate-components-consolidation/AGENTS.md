# AGENTS.md: Generate Components Consolidation

> **项目**: vibex-generate-components-consolidation  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文件定义 `vibex-generate-components-consolidation` 项目的执行规范，所有参与该项目的 Agent 必须遵守。

---

## 强制规范

### 1. 合并范围

- **保留**: `src/app/api/generate-components/route.ts` (Next.js)
- **废弃**: `src/hono/api/generate-components/index.ts` (Hono)
- **禁止**: 在废弃代码上新增功能或修改业务逻辑

### 2. 代码规范

#### 2.1 Prompt 统一
- Next.js route.ts 中的 Prompt 是**唯一真实来源**
- 合并时对比两份 Prompt，保留更完善的边界处理
- 合并后删除 Hono Prompt 或标记为参考

#### 2.2 废弃标记
```typescript
/**
 * @deprecated
 * 已废弃，请使用 src/app/api/generate-components/route.ts
 * 计划删除日期: 2026-04-30
 */
```

#### 2.3 别名导出（如需）
如需保持 API 兼容性，可导出别名：
```typescript
// 保留兼容性别名（可选）
export const fetchComponentTree = generateComponents;
```

### 3. 提交规范

```
feat(components): 合并 generate-components 实现

- 统一 Prompt 为单一版本
- 标记 Hono 实现为废弃
- 更新调用方到 Next.js 路由
- 补充测试用例
```

### 4. 测试规范

- 必须运行功能测试验证合并正确性
- 测试命令: `npm test -- --grep "generate-components"`
- 所有测试必须通过

---

## 审查清单

### 开发完成检查

- [ ] **Prompt 已统一**: Next.js route.ts 中的 Prompt 是唯一版本
- [ ] **废弃标记**: Hono index.ts 顶部有 `@deprecated` 注释
- [ ] **调用方已迁移**: 无代码调用 `hono/api/generate-components`
- [ ] **别名导出**: 如需兼容，导出别名 `fetchComponentTree = generateComponents`
- [ ] **测试通过**: `npm test -- --grep "generate-components"` 全部通过
- [ ] **无新增依赖**: 本次合并未引入任何新依赖

### 代码审查检查

- [ ] **行为一致**: 合并后 API 行为与合并前一致
- [ ] **无逻辑丢失**: 两套实现的核心逻辑均已保留
- [ ] **错误处理**: 错误处理逻辑覆盖完整
- [ ] **边界情况**: 边界情况处理已合并
- [ ] **向后兼容**: 不破坏现有调用方

### 安全检查

- [ ] **无敏感信息**: 废弃代码中的敏感信息已清理
- [ ] **认证保留**: Next.js 路由的认证逻辑完整
- [ ] **输入验证**: 统一实现保持输入验证

### 文档检查

- [ ] **代码注释**: 废弃代码有明确废弃说明
- [ ] **CHANGELOG**: 合并变更已记录
- [ ] **README**: 如需，更新相关文档

---

## 执行流程

```
1. Analyst 确认两套实现差异，输出分析报告
   └── 输出: analysis.md

2. Architect 设计合并方案，输出架构文档
   └── 输出: architecture.md, IMPLEMENTATION_PLAN.md

3. Dev 执行合并
   ├── Step 1: 确认主实现 (Next.js route.ts)
   ├── Step 2: 标记废弃 (Hono @deprecated)
   ├── Step 3: 统一 Prompt
   ├── Step 4: 迁移调用方
   ├── Step 5: 更新测试
   └── Step 6: 清理废弃代码

4. Reviewer 审查合并结果
   └── 验收: 审查清单全部通过

5. PM 确认完成
   └── 验收标准达成
```

---

## 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | Next.js route.ts 是唯一实现 | 代码审查 |
| AC2 | Hono 实现已标记废弃 | `@deprecated` 注释存在 |
| AC3 | Prompt 已统一 | Prompt 来源单一 |
| AC4 | 调用方已迁移 | 搜索无 Hono 端点调用 |
| AC5 | 功能测试通过 | `npm test` 通过 |
| AC6 | API 行为一致 | 功能测试验证 |

---

*本文档为执行规范，参与项目的所有 Agent 必须遵守*
