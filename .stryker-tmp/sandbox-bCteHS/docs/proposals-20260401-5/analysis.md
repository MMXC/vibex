# Analysis: 2026-04-01 第五批提案综合分析

**Agent**: analyst
**日期**: 2026-04-01
**项目**: proposals-20260401-5
**数据来源**: 全部批次复盘（Batches 1-4）+ 遗留未认领项 + 新发现机会

---

## 1. 执行摘要

第五批是「收尾 + 扩展」批次。Batches 1-4 核心 Epics 全部完成，剩余 2 个未认领项 + 3 个新发现机会。

**核心结论**：
- Batches 1-4：全部完成 ✅（28 Epic + 2 零散任务）
- 遗留未认领：2 项（DDD 命名规范 + v0 监控）
- 新发现机会：3 项（Tab 快捷跳转 + Domain 文档更新 + 多格式导出）
- **总工时**: ~15h（5 个 P1 Epic）

---

## 2. 全部批次完成情况

### 2.1 完成清单

| 批次 | Epics | 状态 | 完成时间 |
|------|-------|------|----------|
| Batch 1 | E1-E7 (7 Epic) | ✅ 全部完成 | 2026-04-01 06:28 |
| Batch 2 | E1-E5 (5 Epic) | ✅ 全部完成 | 2026-04-01 10:24 |
| Batch 3 | E1-E5 (5 Epic) | ✅ 全部完成 | 2026-04-01 14:26 |
| Batch 4 | E1-E3 (3 Epic) | ✅ 全部完成 | 2026-04-01 16:55 |

**总计**: 20 Epic 完成 ✅

### 2.2 Batch 4 最新产出（from CHANGELOG）

| Epic | 内容 | 提交 |
|------|------|------|
| E1 | Canvas 崩溃修复（Rules of Hooks + defensive null checks） | `3e20a340`, `139de4c9`, `0b242699` |
| E2 | WCAG AA 颜色对比度修复 | `f5f6f9d6`, `49f58e85` |
| E3 | E2E 测试稳定性（afterEach cleanup + waitForTimeout 替换） | `291ff6ff` |

---

## 3. 遗留未认领项

### 3.1 DDD Bounded Context 命名规范

**来源**: Batch 4 分析遗漏

**问题**: 不同 Epic 对 `forbiddenNames` 有不同期望：
- Epic5 (2026-03-22): '管理' 应该保留（valid DDD term）
- Epic4 (2026-03-31): '管理' 应该过滤（generic suffix）

**JTBD**: 「作为开发者，我需要明确的 DDD bounded context 命名规范，避免团队分歧」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 文档化规范 | 在 `docs/ddd-naming-convention.md` 写清允许/禁止模式 | 2h | 无执行约束 |
| B: CI Lint 规则 | 在 `packages/eslint-plugin` 添加 DDD 命名检测 | 4h | 规则可能过严 |
| C: 工具化 | CLI 工具 `vibex validate-context-names` 检查 | 3h | 需要维护 |

**推荐方案 A**（文档化）：2h，快速产出，可后续升级为 B。

**验收标准**：
- `docs/ddd-naming-convention.md` 存在
- 包含允许模式（患者档案、订单处理）和禁止模式（xxx管理、xxx系统）
- 判断标准明确

---

### 3.2 v0 竞品监控

**来源**: Batch 2 E6 竞品分析发现

**问题**: v0.dev 是 VibeX 最强竞品，功能更新频繁。Batch 2 后无持续监控机制。

**JTBD**: 「作为产品经理，我希望持续跟踪 v0 功能更新，及时发现差异化机会」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 手动周会 | 每周例会 Review v0 更新 | 0.5h/week | 依赖人工 |
| B: RSS 监控 | 用 `rss-parser` 监控 v0 changelog | 2h | 无中文反馈 |
| C: gstack 自动化 | 每周爬取 v0 更新，生成报告 | 3h | 可能被反爬 |

**推荐方案 A**（手动周会）：0.5h/week，最简单有效。结合产品周会进行。

**验收标准**：
- 周会 agenda 包含 v0 更新回顾
- v0 新功能记录到 `docs/competitive/v0-updates.md`

---

## 4. 新发现机会

### 4.1 Canvas Tab 快捷跳转

**来源**: Batch 4 canvas-scrolltop-reset 分析发现

**问题**: 当前切换 Tab 需点击 TabBar，无键盘快捷键。用户在 Context 面板工作完后，想快速跳转到 Flow 查看结果，需要鼠标操作。

**现有快捷键**（ShortcutHintPanel）：
- `Ctrl+K` - 搜索节点
- `N` - 新建节点
- `?` - 快捷键提示

**缺失**: Tab 切换快捷键

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: Alt+1/2/3 切换 | Alt+1=Context, Alt+2=Flow, Alt+3=Component | 1h | Alt 可能被浏览器占用 |
| B: Ctrl+Tab 循环 | Ctrl+Tab 循环切换三树 | 1h | 可能与浏览器冲突 |
| C: F1/F2/F3 映射 | F1=Context, F2=Flow, F3=Component | 1h | F 键桌面常用 |

**推荐方案 A**（Alt+1/2/3）：直观映射。`Alt+1` → Context，`Alt+2` → Flow，`Alt+3` → Component。

**验收标准**：
- ShortcutHintPanel 添加 Alt+1/2/3 说明
- CanvasPage 监听 Alt+1/2/3 事件并切换 activeTree
- 测试覆盖：快捷键切换后 activeTree 状态正确

---

### 4.2 Domain 文档持续更新机制

**来源**: docs/architecture/domain.md @updated: 2026-04-01

**问题**: domain.md 标注 `@updated: 2026-04-01`，但无自动化更新机制。每次代码变更后文档可能过时。

**JTBD**: 「作为架构师，我希望 domain.md 与代码同步，不再手动维护」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: ADR 版本化 | 每个架构决策记录为 ADR，自动更新 domain.md | 3h | 需要团队遵守 |
| B: 代码注释提取 | 从 TypeScript 类型注释生成文档 | 5h | 解析复杂度高 |
| C: 手动维护 + CI 检查 | 每次 PR 检查 domain.md 更新时间 | 1h | 仅检查不更新 |

**推荐方案 C**：1h，添加 CI 检查 domain.md 更新频率（如超过 30 天 warn）。

**验收标准**：
- `domain.md` 有 `@updated` 时间戳
- CI 检查更新频率，超过 30 天 warn

---

### 4.3 多格式导出增强

**来源**: Batch 2 E4 Vue + Batch 3 E5 Svelte 完成后

**现状**：
- ✅ React 导出
- ✅ Vue 导出
- ✅ Svelte 导出
- ❌ Figma/Sketch 设计稿导出（竞品 v0 支持）
- ❌ PDF 文档导出

**JTBD**: 「作为设计师/产品经理，我希望导出 Figma 设计稿或 PDF 文档用于团队评审」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: Figma API 集成 | 通过 Figma API 生成设计稿 | 8h | API 限制 |
| B: PDF 导出 | 用 `react-pdf` 生成画布 PDF | 4h | 样式复杂 |
| C: PNG/SVG 批量 | 导出全部节点为图片 | 2h | 最简单 |

**推荐方案 C**（PNG/SVG 批量）：2h，快速产出。用户可选择导出为图片用于演示。

**验收标准**：
- 导出面板增加「导出全部节点为 PNG/SVG」选项
- 批量导出到 zip 文件
- 测试覆盖：导出文件完整性

---

## 5. 提案汇总

| ID | 提案 | 工时 | 优先级 | 来源 |
|----|------|------|--------|------|
| P1 | DDD 命名规范文档化 | 2h | P1 | 遗留 |
| P2 | v0 竞品监控（周会） | 0.5h/week | P1 | 遗留 |
| P3 | Canvas Tab 快捷键（Alt+1/2/3） | 1h | P1 | 新发现 |
| P4 | Domain 文档 CI 检查 | 1h | P2 | 新发现 |
| P5 | 多格式导出增强（PNG/SVG） | 2h | P2 | 新发现 |

---

## 6. Epic 拆分建议

| Epic | 包含 | 工时 | 优先级 |
|------|------|------|--------|
| Epic1 | DDD 命名规范 + Tab 快捷键 | 3h | P1 |
| Epic2 | v0 监控 + Domain CI 检查 | 2h | P1 |
| Epic3 | PNG/SVG 批量导出 | 2h | P2 |

**总工时**: 7h（不含 P2 持续周会）

---

## 7. 验收标准

| Epic | 验收标准 |
|------|----------|
| Epic1 | `docs/ddd-naming-convention.md` 存在且包含允许/禁止模式；Alt+1/2/3 切换 Tab 工作 |
| Epic2 | 周会议程包含 v0 更新；CI 检查 domain.md 更新时间 |
| Epic3 | 导出面板支持 PNG/SVG 批量导出到 zip |

---

## 8. 下一步

1. **确认方案**: 三个 Epic 全部确认
2. **派发开发**: 可并行派发 dev-e1, dev-e2, dev-e3
3. **P2 持续**: 周会加入 v0 回顾（每次 0.5h）