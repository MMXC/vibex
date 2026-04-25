# Feature List — vibex-sprint6-qa / plan

**项目**: vibex-sprint6-qa
**角色**: PM
**日期**: 2026-04-25
**上游**: analysis.md

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | FigmaImport 四态验证 | 验证 FigmaImport 组件四态（理想态/空状态/加载态/错误态）符合 specs/E1-import-ui.md | E1 specs 完整性 | 1h |
| F1.2 | ImageImport 四态验证 | 验证 ImageImport 组件四态符合 specs/E1-import-ui.md | E1 specs 完整性 | 1h |
| F1.3 | 导入确认 Dialog 四态验证 | 验证 ImportConfirmDialog 四态符合 specs/E1-import-ui.md | E1 specs 完整性 | 0.5h |
| F2.1 | CodingAgent 服务层验证 | 验证 CodingAgent.generateCode() 返回 GeneratedCode[] 格式 | E2 Stub 风险（mockAgentCall） | 1.5h |
| F2.2 | ProtoAttrPanel AI Tab 四态验证 | 验证 ProtoAttrPanel AI 代码 Tab 四态符合 specs/E2-ai-coding.md | E2 UI 完整性 | 1h |
| F2.3 | E2 Stub 升级决策验证 | 验证 PRD 要求的方案 A（OpenClaw ACP）或方案 B（HTTP 后端）已选择并实现 | E2 Stub P0 风险 | 0.5h |
| F3.1 | prototypeVersionStore 验证 | 验证 prototypeVersionStore 存在且行为符合 specs/E3-version-history.md | E3 store 存在性 | 1h |
| F3.2 | version-history 页面四态验证 | 验证 version-history 页面四态符合 specs/E3-version-history.md | E3 UI 完整性 | 1h |
| F4.1 | VersionDiff 组件四态验证 | 验证 VersionDiff 组件四态符合 specs/E4-version-diff.md | E4 规格完整性 | 1h |
| F4.2 | jsondiffpatch diff 计算验证 | 验证 added/removed/modified 分类正确 | E4 diff 逻辑 | 1h |
| F5.1 | 全量 Specs 覆盖率验证 | 验证每个 Spec 文件至少有一个 QA 验证点 | QA 覆盖完整性 | 0.5h |
| F5.2 | DoD 逐条核查 | 逐条验证 PRD DoD 章节的所有条目 | DoD 执行保障 | 0.5h |
| F5.3 | PRD 格式自检 | 验证 PRD 包含执行摘要/Epic表格/验收标准/DoD/情绪地图 | PRD 格式规范 | 0.5h |

---

## Epic 映射

| Epic | 功能点 | 优先级 | 工时合计 |
|------|--------|--------|---------|
| E1: 设计稿导入验证 | F1.1 + F1.2 + F1.3 | P0 | 2.5h |
| E2: AI Coding Agent 验证 | F2.1 + F2.2 + F2.3 | P0 | 3.0h |
| E3: 版本历史验证 | F3.1 + F3.2 | P1 | 2.0h |
| E4: 版本 Diff 验证 | F4.1 + F4.2 | P1 | 2.0h |
| E5: 质量保障 | F5.1 + F5.2 + F5.3 | P2 | 1.5h |

**总工时: 11h**

---

## 依赖关系

```
F1.1 + F1.2 + F1.3 (E1 验证)
    ↓
F2.1 + F2.2 (E2 验证) ← F2.3 (E2 Stub 决策) 独立
    ↓
F3.1 + F3.2 (E3 验证)
    ↓
F4.1 + F4.2 (E4 验证)
    ↓
F5.1 + F5.2 + F5.3 (E5 质量保障)
```

---

## 关键风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| E2 Stub 未升级为真实实现 | F2.1 验证失败 | F2.3 单独跟踪 |
| Specs 文件缺失 | F1.1-F4.2 验证无据 | F5.1 覆盖率检查前置 |
