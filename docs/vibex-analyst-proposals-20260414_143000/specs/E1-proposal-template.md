# Spec: E1 - 提案提交标准化模板

## E1.1 提案提交模板

**文件**: `docs/templates/proposal-submission-template.md`

### 强制字段

```markdown
# 提案: [提案名称]

## 执行决策
- **决策**: 待评审
- **执行项目**: [team-tasks 项目 ID 或 "无"]
- **执行日期**: [YYYY-MM-DD 或 "待定"]

## 背景
[描述提出此提案的原因和场景]

## 目标
[量化目标，使用 "提高 X% / 降低 Y / 实现 Z 功能" 格式]

## 约束
- 技术约束: [如：必须兼容现有 API]
- 时间约束: [如：Sprint 结束前完成]
- 资源约束: [如：仅 1 人可投入]

## 成功指标
| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| [指标1] | [值] | [测量方法] |

## 影响范围
- 影响用户: [如：所有注册用户]
- 影响页面: [如：/auth, /dashboard]
- 影响接口: [如：/api/v1/auth/*]

## 时间线
- 提案日期: YYYY-MM-DD
- 预期启动: [YYYY-MM-DD]
- 预期完成: [YYYY-MM-DD]

## 提案者
- 角色: [如：PM / Dev / Architect / Analyst]
- 联系人: [@username]
```

### 字段完整性检查

```typescript
const requiredFields = [
  '执行决策',
  '背景',
  '目标',
  '约束',
  '成功指标',
  '影响范围',
  '时间线',
  '提案者'
];

function validateProposal(doc: string): boolean {
  return requiredFields.every(field => doc.includes(field));
}
```

---

## E1.2 提案 ID 格式

**格式**: `proposal-YYYYMMDD-NNN`
- `YYYYMMDD`: 提案日期
- `NNN`: 当日提案序号（001, 002, ...）

**示例**: `proposal-20260414-001`

---

## E1.3 INDEX.md 条目格式

```markdown
| proposal-YYYYMMDD-NNN | [标题] | [状态] | [日期] | [Analyst] |
```

状态枚举: `pending` | `in-progress` | `done` | `rejected` | `blocked`
