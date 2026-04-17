# 需求分析报告 — vibex-sprint6-ai-coding-integration / analyze-requirements

**项目**: vibex-sprint6-ai-coding-integration
**角色**: Analyst
**日期**: 2026-04-18
**主题**: AI Coding集成 + 打磨
**状态**: ✅ Recommended

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration
- **执行日期**: 2026-04-18
- **备注**: Sprint6 是最后一期，集成收口 + AI Coding 能力增强

---

## 0. 核心定位

Sprint6 包含两组不同性质的功能：

1. **Figma/设计稿导入**（Sprint3 E4 的延续和扩展）
2. **AI Coding Agent 反馈回路**（全新能力）
3. **画布变更 diff + 版本对比**（版本历史扩展）

---

## 1. Research 结果

### 1.1 已有资产大盘点

| 资产 | 行数 | Sprint6 价值 |
|------|------|------------|
| `figma-import.ts` | 175 | ⚠️ 仅有 Figma URL 解析，无实际导入 |
| `image-import.ts` | 111 | ✅ AI vision 管道已实现（base64 → LLM → ImportedComponent） |
| `FigmaImport.tsx` | 189 | ✅ UI 存在，待完善 |
| `llm-provider.ts` | 1208 | ⭐ 完整 LLM 基础设施（OpenAI/Anthropic/MiniMax/Doubao + function calling）|
| `agent.ts`（前端 API） | 101 | ⚠️ Agent CRUD 已有，但无 coding agent 集成 |
| `VersionDiff.tsx` | 190 | ✅ 使用 jsondiffpatch，已有 diff 可视化 |
| `version-history/page.tsx` | 162 | ✅ 版本历史 UI 存在，连接 useConfirmationStore |
| `prototype-snapshots` API | ~200 | ✅ 已有 GET/POST 端点，GET list + POST create |

### 1.2 关键发现

**Figma 导入现状**：`figma-import.ts` 的 FigmaImport 组件只是解析 Figma URL 获取文件节点，**没有实际从 Figma 拉取组件**。OAuth 授权流程存在（`getFigmaAuthUrl()`），但后端 Figma API 集成未完成。

**Image 导入已实现**：`image-import.ts` 已有完整的 AI vision pipeline：
```typescript
file → base64 → LLM → ImportedComponent[]
```
这意味着"设计稿导入"在技术上已经存在，只需完善 UI 和后端集成。

**版本 diff 已存在**：`VersionDiff.tsx` 使用 `jsondiffpatch`，但它依赖 `useConfirmationStore`（需求确认 store），不是 prototypeStore。需要扩展或新建 `prototypeVersionStore` 来支持画布版本 diff。

**LLM Provider 完整**：`llm-provider.ts` 支持 function calling，这正是 AI coding agent 的核心能力——LLM 可以调用工具（编辑文件、运行命令）。

### 1.3 Git History 分析

| Commit | 描述 | Sprint6 关联 |
|--------|------|------------|
| `cba53745` | snapshot diff comparison | ✅ VersionDiff 可复用 |
| `11a87f53` | add snapshot diff comparison | ✅ 已有 diff 机制 |
| `f1205745` | version history panel E2E | ✅ 现有测试可扩展 |
| `7db16fba` | vibex-build-fixes 含 Snapshot/API issues | ⚠️ prototype-snapshots API 有问题待修 |
| `d795e72e` | Sprint3 E4 AI 草图导入 | ✅ image-import.ts 来自此处 |

---

## 2. 技术可行性评估

### 2.1 Figma/设计稿导入

**两种导入路径**：

| 路径 | 现状 | Sprint6 工作 |
|------|------|------------|
| Figma URL → 组件 | `FigmaImport.tsx` UI 存在，但 `fetchFigmaFile()` 未实现 | 完成 Figma API 后端集成 |
| 设计图片 → 组件 | `image-import.ts` 管道已实现 | 完善 UI + 接入 prototypeStore |

**可行方案**：

```typescript
// Figma 导入
async function importFromFigma(fileKey: string, nodeId: string) {
  const figmaData = await fetchFigmaFile(fileKey, nodeId);
  const components = figmaDataToComponents(figmaData);
  prototypeStore.getState().importComponents(components);
}

// 图片导入（已实现）
async function importFromImage(file: File) {
  const result = await importFromImage(file); // image-import.ts
  prototypeStore.getState().importComponents(result.components);
}
```

**可行性**: ✅ 可行，基础设施已存在。Figma API 集成工作量约 3h。

### 2.2 AI Coding Agent 反馈回路

**核心概念**：AI Coding Agent 在生成代码后，将结果反馈到画布，让设计师看到 AI 生成的代码与原型组件的对应关系。

**已有能力**：
- LLMProvider 支持 function calling ✅
- Agent CRUD API ✅
- prototype-snapshots API 可存储 AI 生成结果 ✅

**需要新增**：

```typescript
// 新文件: src/services/ai-coding/CodingAgent.ts
class CodingAgent {
  async generateCode(components: ProtoNode[]): Promise<GeneratedCode[]> {
    // 1. 将 ProtoNode 序列化为 prompt
    // 2. 调用 LLMProvider（使用 function calling）
    // 3. AI 生成代码片段
    // 4. 存储到 prototype-snapshots
    // 5. 在 ProtoAttrPanel 显示 AI 生成的代码
  }
  
  async receiveFeedback(code: string, userNote: string): Promise<void> {
    // 接收用户对生成代码的反馈
    // 反馈 → 改进 prompt → 重新生成
  }
}
```

**反馈回路设计**：

```
ProtoEditor (设计师)
  ↓ 选择组件
CodingAgent.generateCode()
  ↓ 调用 llm-provider.ts + function calling
AI Coding (Claude/OpenAI)
  ↓ 生成代码
ProtoAttrPanel (AI 代码 tab)
  ↓ 用户反馈（采纳/修改）
CodingAgent.receiveFeedback()
  ↓ 重新生成
ProtoAttrPanel (更新)
```

**可行性**: ⚠️ 可行但复杂。核心挑战：
1. Function calling 需要定义工具 schema（编辑文件、读文件、运行命令）
2. 需要代码执行沙箱（安全隔离）
3. UI 集成需要新增"AI 代码 Tab"到 ProtoAttrPanel

### 2.3 画布变更 diff

**现有机制**：`VersionDiff.tsx` 使用 `jsondiffpatch` 对两个 JSON 对象做 diff。

**需要扩展**：

```typescript
// 方案A: 复用 VersionDiff
// prototypeStore 已有 getExportData() → PrototypeExportV2
const old = snapshotService.getSnapshot(oldId);
const current = prototypeStore.getState().getExportData();
const diff = diffpatcher.diff(old, current);

// 方案B: 新建 protoVersionStore
// 独立的版本历史 store，专用于 prototype canvas
```

**可行性**: ✅ 可行，jsondiffpatch 已存在。

### 2.4 版本对比

**已有**：`version-history/page.tsx` 显示版本列表 + 对比视图。

**需要新增**：
- 从 prototypeStore 获取版本历史（而非 useConfirmationStore）
- 版本快照创建 API（POST /api/v1/prototype-snapshots）
- 版本恢复功能

---

## 3. 需求分析与 Epic 拆分

### Epic A: Figma/设计稿导入完善

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| A1 | Figma OAuth + API 后端集成 | 3h | 输入 Figma URL → 拉取组件列表 |
| A2 | FigmaImport UI 完善 | 1h | 显示组件预览，点击导入到 prototypeStore |
| A3 | Image Import UI 完善 | 2h | 支持拖拽上传图片，预览识别结果 |
| A4 | 导入结果 → prototypeStore | 2h | 识别的组件转换为 ProtoNode，添加到画布 |

**Epic A 工时小计: 8h**

### Epic B: AI Coding Agent

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| B1 | CodingAgent 服务层 | 3h | Component[] → LLM → GeneratedCode[] |
| B2 | ProtoAttrPanel AI 代码 Tab | 2h | Tab 显示 AI 生成的代码，可复制 |
| B3 | 用户反馈回路 | 3h | 用户可标记"采纳"/"修改" → 重新生成 |
| B4 | AI 生成结果存储 | 1h | 存入 prototype-snapshots，带 AI 元数据 |

**Epic B 工时小计: 9h**

### Epic C: 画布版本 diff + 对比

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| C1 | prototypeVersionStore | 2h | 版本历史独立 store，与 prototypeStore 解耦 |
| C2 | 版本快照创建（POST API）| 1h | 点击保存 → 生成 snapshot |
| C3 | 版本列表 + 恢复 | 2h | version-history 页面显示 proto 版本，支持恢复 |
| C4 | jsondiffpatch diff 可视化 | 2h | 两个 proto 版本对比，红色=删除/绿色=新增 |

**Epic C 工时小计: 7h**

### Epic D: 打磨与集成

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| D1 | Delivery Center 接入 AI 生成代码 | 2h | Delivery 可导出 AI 生成的代码 |
| D2 | Sprint1-6 产出物健康检查 | 1h | 全量回归测试，确保无破坏性变更 |
| D3 | 文档与 CHANGELOG 更新 | 1h | 全项目 changelog 补档 |

**Epic D 工时小计: 4h**

### 总工时汇总

| Epic | 工时 |
|------|------|
| A: Figma/设计稿导入 | 8h |
| B: AI Coding Agent | 9h |
| C: 版本 diff + 对比 | 7h |
| D: 打磨与集成 | 4h |
| **Total** | **28h** |

---

## 4. 风险矩阵

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| AI Coding Agent function calling schema 设计复杂 | 高 | 高 | MVP 用纯 LLM 输出（无 tool calling） |
| 代码执行沙箱安全性 | 高 | 低 | MVP 只生成代码字符串，不执行 |
| Figma API OAuth 后端未完成 | 中 | 中 | 有 authUrl 基础设施，完成度约 50% |
| prototype-snapshots API 已知问题 | 中 | 中 | Epic C 包含 API 修复 |
| 版本 diff 大文件性能 | 低 | 中 | jsondiffpatch 本身优化，支持增量 diff |

---

## 5. 关键设计决策

| 模糊项 | 方案A（推荐） | 方案B |
|--------|------------|--------|
| AI Coding 执行方式 | MVP: LLM 生成代码字符串 | 完整: function calling + 沙箱执行 |
| Figma 导入方式 | Figma URL → 组件列表 | Figma Plugin（需额外开发）|
| 版本 diff 存储 | jsondiffpatch delta（节省空间）| 完整 JSON snapshot（便于调试）|
| AI 反馈形式 | 简单：采纳/重新生成 | 完整：inline 编辑 + 差异对比 |

---

## 6. 验收标准具体性

| 功能 | 验收标准 | 可测试性 |
|------|---------|---------|
| A1 | 输入 Figma URL → 组件列表加载成功 | ✅ API mock 测试 |
| A4 | 导入图片 → ProtoNode 出现在画布上 | ✅ Playwright E2E |
| B2 | ProtoAttrPanel 显示 AI 代码 Tab | ✅ 单元测试 |
| B3 | 点击"重新生成" → 代码更新 | ✅ E2E 测试 |
| C2 | 快照创建后可在 version-history 页面看到 | ✅ E2E 测试 |
| C4 | 版本对比：新增节点绿色，删除红色 | ✅ Visual regression |

---

## 7. 总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 5/5 | llm-provider (1208L) + image-import (111L) + VersionDiff (190L) 均有基础设施 |
| 复用资产价值 | ✅ 5/5 | 大量已有代码可直接复用 |
| 架构一致性 | ✅ 5/5 | 与 prototypeStore / llm-provider / snapshot API 集成 |
| 工时合理性 | ✅ 5/5 | 28h，最后一期收口工作量合理 |
| 风险可控性 | ⚠️ 4/5 | AI Coding function calling 和沙箱安全有不确定性 |

**综合**: ✅ Recommended — Sprint6 复用资产丰厚，AI Coding 能力从已有 LLM 基础设施延伸，工时合理。

---

*产出时间: 2026-04-18 03:07 GMT+8*
