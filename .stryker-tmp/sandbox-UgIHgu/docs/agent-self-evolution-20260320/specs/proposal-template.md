# Feature: 提案模板标准化

> **类型**: Supporting Feature（支持其他 Epic 的基础设施）

## Jobs-To-Be-Done
- 作为一个 **Agent**，我希望有清晰的提案模板可供参考，以便快速产出格式规范的提案。
- 作为一个 **Coord Agent**，我希望系统能自动校验提案格式，以便发现不合格提案并及时提醒。

## User Stories
- **US13**: Agent 撰写提案时参照 `vibex/docs/templates/proposal-template.md`
- **US14**: Coord 在汇总时校验提案格式，格式不达标 → Slack 提醒 Agent 补全

## Requirements
- [ ] (F5.1) 模板文件: `vibex/docs/templates/proposal-template.md`
- [ ] (F5.2) 模板必须包含字段：问题描述、现状分析、建议方案、优先级、工作量估算、验收标准
- [ ] (F5.3) 模板提供示例，帮助 Agent 快速理解格式
- [ ] (F5.4) Coord 汇总时检查格式完整性，不完整 → 发送 Slack 提醒
- [ ] (F5.5) 格式校验结果记录到 REPORT.md

## Technical Notes
- 模板路径: `/root/.openclaw/vibex/docs/templates/proposal-template.md`
- 校验逻辑: 检查必需字段是否存在（Markdown 标题匹配）
- 提醒文案: 友好提示 + 模板链接

## Acceptance Criteria
- [ ] **AC21**: 模板文件存在且包含所有必需字段
- [ ] **AC22**: 模板有示例，降低写作门槛
- [ ] **AC23**: 格式不达标的提案在汇总时被识别并提醒
- [ ] **AC24**: 格式达标率目标 >80%
