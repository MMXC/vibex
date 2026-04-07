# PRD: ThemeWrapper 时序修复

## 功能
F1: 修复 ThemeWrapper 渲染时机 - homepageData 未就绪时不渲染 ThemeProvider

## 验收标准
| ID | 功能 | 验收标准 |
|----|------|---------|
| F1 | 条件渲染 | homepageData=null 时 children 原样渲染，不提供主题上下文 |
| F1 | merge 策略生效 | API dark → Consumer 显示 mode='dark' |
| F1 | 测试通过 | 30/30 tests passed (homepageAPI/ThemeWrapper/theme-binding) |

## DoD
- npm test 通过 100%
- 3 个失败测试全部修复
