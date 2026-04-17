# Feature List — vibex-sprint6-ai-coding-integration

**项目**: vibex-sprint6-ai-coding-integration
**阶段**: Planning (create-prd)
**日期**: 2026-04-18
**上游**: analysis.md (2026-04-18)

---

## 1. Feature List 表格

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F-A.1 | Figma OAuth + API 集成 | 完成 Figma API 后端集成，输入 URL 拉取组件列表 | Analyst: A1 | 3h |
| F-A.2 | FigmaImport UI 完善 | 显示组件预览，点击导入到 prototypeStore | Analyst: A2 | 1h |
| F-A.3 | Image Import UI 完善 | 拖拽上传图片，预览 AI 识别结果 | Analyst: A3 | 2h |
| F-A.4 | 导入结果 → prototypeStore | 识别的组件转换为 ProtoNode，添加到画布 | Analyst: A4 | 2h |
| F-B.1 | CodingAgent 服务层 | Component[] → LLM → GeneratedCode[]（MVP: 纯 LLM 输出） | Analyst: B1 | 3h |
| F-B.2 | ProtoAttrPanel AI 代码 Tab | Tab 显示 AI 生成的代码，可复制 | Analyst: B2 | 2h |
| F-B.3 | 用户反馈回路 | 用户标记"采纳"/"重新生成" → CodingAgent 重新生成 | Analyst: B3 | 3h |
| F-B.4 | AI 生成结果存储 | 存入 prototype-snapshots，带 AI 元数据 | Analyst: B4 | 1h |
| F-C.1 | prototypeVersionStore | 版本历史独立 store，与 prototypeStore 解耦 | Analyst: C1 | 2h |
| F-C.2 | 版本快照创建 API | 点击保存 → 生成 snapshot（POST API） | Analyst: C2 | 1h |
| F-C.3 | 版本列表 + 恢复 | version-history 页面显示 proto 版本，支持恢复 | Analyst: C3 | 2h |
| F-C.4 | jsondiffpatch diff 可视化 | 两版本对比，红色=删除/绿色=新增 | Analyst: C4 | 2h |
| F-D.1 | Delivery Center 导出 AI 代码 | Delivery 可导出 AI 生成的代码 | Analyst: D1 | 2h |
| F-D.2 | Sprint1-6 回归测试 | 全量回归测试，确保无破坏性变更 | Analyst: D2 | 1h |
| F-D.3 | changelog 更新 | 全项目 changelog 补档 | Analyst: D3 | 1h |

---

## 2. Epic/Story 映射

| Epic | Story | 功能 | 优先级 |
|------|-------|------|--------|
| E1 | A1+A2+A3+A4 | Figma/设计稿导入完善 | P0 |
| E2 | B1+B2+B3+B4 | AI Coding Agent 反馈回路 | P1 |
| E3 | C1+C2+C3+C4 | 画布版本 diff + 对比 | P1 |
| E4 | D1+D2+D3 | 打磨与集成 | P0 |

---

## 3. MVP 方案决策

| 功能 | MVP 方案 | 理由 |
|------|---------|------|
| AI Coding Agent | 纯 LLM 输出（无 tool calling） | MVP 降低复杂度，function calling schema 复杂 |
| 代码执行 | 只生成代码字符串，不执行 | 沙箱安全性高风险，MVP 规避 |
| Figma 导入 | Figma URL → 组件列表 | Figma Plugin 需额外开发，暂缓 |
| AI 反馈 | 采纳/重新生成 | inline 编辑暂缓 |
| 版本 diff 存储 | jsondiffpatch delta（节省空间） | 完整 JSON 便于调试但占空间 |

---

## 4. 已知 GAP 处理

| GAP | 描述 | 处理方式 |
|-----|------|---------|
| Figma API OAuth 未完成 | 后端集成约 50% | F-A.1 完成 Figma API 集成 |
| prototype-snapshots API 有问题 | 已知问题待修 | F-C.2 包含 API 修复 |
| AI Coding function calling 复杂 | schema 设计不确定性高 | 方案A：MVP 纯 LLM 输出 |
| 代码执行沙箱安全性 | 高风险 | MVP 不执行代码，只生成字符串 |
