# Spec: E1.S1 — 评审模板标准化

## 功能概述

定义Design/Architecture/Security/Performance四套标准评审模板，每套模板包含统一字段结构，确保评审结论结构化、可汇总。

## 模板结构（通用）

每套模板包含以下字段：

```typescript
interface ReviewTemplate {
  proposalId: string;
  reviewer: ReviewerType;         // 'design' | 'architecture' | 'security' | 'performance'
  reviewTime: Date;
  conclusion: ReviewConclusion;   // 'approved' | 'rejected' | 'conditional' | 'timeout'
  checklist: {
    [checkItem: string]: {
      status: 'pass' | 'fail' | 'na';
      note?: string;
    };
  };
  suggestions: Suggestion[];      // 改进建议列表
  riskLevel: 'low' | 'medium' | 'high';
}
```

---

## E1.S1.F1.1 — Design Review 模板

### 检查项（Design Checklist）

| 检查项 | 说明 | 验收标准 |
|--------|------|---------|
| `brand_consistency` | 视觉风格是否符合VibeX品牌规范 | `expect(checklist.brand_consistency.status).toBe('pass')` |
| `interaction_pattern` | 交互模式是否与现有组件一致 | `expect(checklist.interaction_pattern.status).toBe('pass')` |
| `accessibility` | WCAG 2.1 AA合规性 | `expect(checklist.accessibility.status).toBe('pass')` |
| `responsive_design` | 响应式布局是否覆盖目标设备 | `expect(checklist.responsive_design.status).toBeOneOf(['pass', 'na'])` |
| `visual_hierarchy` | 信息层次是否清晰 | `expect(checklist.visual_hierarchy.status).toBe('pass')` |

### 示例

```json
{
  "proposalId": "P-001",
  "reviewer": "design",
  "reviewTime": "2026-04-14T15:00:00+08:00",
  "conclusion": "conditional",
  "checklist": {
    "brand_consistency": { "status": "pass" },
    "interaction_pattern": { "status": "fail", "note": "按钮hover状态与规范不一致" },
    "accessibility": { "status": "pass" },
    "responsive_design": { "status": "pass" },
    "visual_hierarchy": { "status": "pass" }
  },
  "suggestions": [
    { "item": "interaction_pattern", "suggestion": "将按钮hover背景色从#E0E0E0改为#F5F5F5" }
  ],
  "riskLevel": "low"
}
```

### 验收标准

```typescript
describe('Design Review Template', () => {
  it('should contain all required checklist fields', () => {
    const template = generateDesignTemplate('P-001');
    expect(template.checklist).toContainAllKeys([
      'brand_consistency', 'interaction_pattern', 'accessibility',
      'responsive_design', 'visual_hierarchy'
    ]);
  });

  it('should have conclusion from valid set', () => {
    const template = generateDesignTemplate('P-001');
    expect(template.conclusion).toBeOneOf(['approved', 'rejected', 'conditional', 'timeout']);
  });

  it('should require suggestions when conclusion is not approved', () => {
    const template = generateDesignTemplate('P-001');
    if (template.conclusion !== 'approved') {
      expect(template.suggestions.length).toBeGreaterThan(0);
    }
  });
});
```

---

## E1.S1.F1.2 — Architecture Review 模板

### 检查项（Architecture Checklist）

| 检查项 | 说明 | 验收标准 |
|--------|------|---------|
| `arch_boundary` | 是否遵守现有架构边界 | `expect(checklist.arch_boundary.status).toBe('pass')` |
| `tech_stack_compliance` | 技术栈是否符合约束 | `expect(checklist.tech_stack_compliance.status).toBe('pass')` |
| `dependency_analysis` | 依赖关系是否清晰，无循环依赖 | `expect(checklist.dependency_analysis.status).toBe('pass')` |
| `api_contract` | API契约变更是否向后兼容 | `expect(checklist.api_contract.status).toBeOneOf(['pass', 'na'])` |
| `migration_path` | 数据迁移路径是否定义 | `expect(checklist.migration_path.status).toBeOneOf(['pass', 'na'])` |

---

## E1.S1.F1.3 — Security Review 模板

### 检查项（Security Checklist）

| 检查项 | 说明 | 验收标准 |
|--------|------|---------|
| `ai_behavior_boundary` | AI行为边界是否定义（超时/循环限制） | `expect(checklist.ai_behavior_boundary.status).toBe('pass')`（P-002必填） |
| `data_privacy` | 数据泄露风险是否评估 | `expect(checklist.data_privacy.status).toBe('pass')` |
| `permission_model` | 权限模型是否最小化 | `expect(checklist.permission_model.status).toBe('pass')` |
| `input_validation` | 输入是否经过校验 | `expect(checklist.input_validation.status).toBe('pass')` |
| `third_party_risk` | 第三方依赖安全评估 | `expect(checklist.third_party_risk.status).toBeOneOf(['pass', 'na'])` |

---

## E1.S1.F1.4 — Performance Review 模板

### 检查项（Performance Checklist）

| 检查项 | 说明 | 验收标准 |
|--------|------|---------|
| `bundle_impact` | Bundle大小增量是否可接受（<5KB gzip） | `expect(checklist.bundle_impact.status).toBe('pass')`（Bundle提案必填） |
| `render_performance` | 渲染性能影响（FPS降级<10%） | `expect(checklist.render_performance.status).toBe('pass')` |
| `user_perception_impact` | 用户感知影响是否最小化 | `expect(checklist.user_perception_impact.status).toBe('pass')` |
| `lazy_loading` | 非首屏资源是否懒加载 | `expect(checklist.lazy_loading.status).toBeOneOf(['pass', 'na'])` |

---

## 实现约束

- 模板以JSON Schema定义
- 每套模板独立文件：`specs/templates/{reviewer}-template.schema.json`
- 评审执行时，Reviewer skill输出需符合对应Schema
- Schema校验失败时，评审结论记为`invalid`，不进入汇总流程
