# Reports Index - 历史报告索引

本文档维护 VibeX Frontend 所有 Reviewer 报告和测试报告的索引。

## 索引维护规范

- **报告命名**: `<type>-<epic>-<date>.md>`
  - `type`: `review-report` | `test-report` | `dev-checklist` | `tester-checklist`
  - `epic`: Epic 编号，如 `epic1-1-1`
  - `date`: 格式 `YYYYMMDD`
- **保存路径**: `reports/`
- **更新时机**: 每个 Epic 审查/测试完成后
- **责任人**: 报告生成者负责维护索引

## 历史报告表格

### Sprint 3

| Epic | Reviewer 报告 | Tester 报告 | 日期 |
|------|---------------|-------------|------|
| 1.1.1 | - | - | - |

### Sprint 2

| Epic | Reviewer 报告 | Tester 报告 | 日期 |
|------|---------------|-------------|------|
| - | - | - | - |

### Sprint 1

| Epic | Reviewer 报告 | Tester 报告 | 日期 |
|------|---------------|-------------|------|
| - | - | - | - |

## 报告详情模板

### Reviewer 报告模板

```markdown
# Review Report - Epic <编号> (<YYYY-MM-DD>)

## 基本信息
- **Epic**: <Epic 名称>
- **Reviewer**: <reviewer>
- **Dev**: <dev>
- **日期**: <YYYY-MM-DD>

## 审查结果
- **结论**: ✅ 通过 / ❌ 驳回
- **驳回次数**: <N>

## 审查详情
<具体审查内容>

## 遗留问题
<如有>

## 下一步
<下一步操作>
```

### Tester 报告模板

```markdown
# Test Report - Epic <编号> (<YYYY-MM-DD>)

## 基本信息
- **Epic**: <Epic 名称>
- **Tester**: <tester>
- **Dev**: <dev>
- **日期**: <YYYY-MM-DD>

## 测试结果
- **结论**: ✅ 通过 / ❌ 失败
- **用例数**: <N>
- **通过数**: <N>
- **失败数**: <N>

## 测试详情
<具体测试内容>

## 遗留 Bug
<如有>

## 下一步
<下一步操作>
```

## 快速链接

- CHANGELOG: `../CHANGELOG.md`
- CHANGELOG 规范: `../CHANGELOG_CONVENTION.md`
- AGENTS 规范: `../AGENTS.md`
- 本 Sprint 所有报告: `reports/`
