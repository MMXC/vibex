# 需求分析报告 — vibex-sprint5-delivery-integration / analyze-requirements

**项目**: vibex-sprint5-delivery-integration
**角色**: Analyst
**日期**: 2026-04-18
**主题**: 交付产物整合 + PRD融合
**状态**: ✅ Recommended

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration
- **执行日期**: 2026-04-18
- **前置**: Sprint3 ✅ / Sprint4 进行中（analyze-requirements ✅）

---

## 0. 核心定位

Sprint5 是**集成收口**项目，不是新功能构建。它把 Sprint1-4 的产出物（原型画布 + 详设画布）与已有交付基础设施打通，形成端到端交付闭环。

---

## 1. Research 结果

### 1.1 已有交付资产盘点

**关键发现**: 已存在完整的交付中心代码，共 1912 行，分 8 个文件：

| 文件 | 行数 | 职责 | Sprint5 价值 |
|------|------|------|------------|
| `deliveryStore.ts` | 344 | 交付状态管理 | ⚠️ 使用 mock data，需接入真实 store |
| `DeliveryTabs.tsx` | 35 | 章节/流程/组件/PRD Tab 切换 | ✅ 可直接复用 |
| `ComponentTab.tsx` | 137 | 组件清单导出 | ⚠️ 使用 mock，需接入 prototypeStore |
| `PRDTab.tsx` | 137 | PRD 导出 | ⚠️ 硬编码内容，需接项目数据 |
| `FlowTab.tsx` | 136 | 流程导出 | ⚠️ 使用 mock，需接 DDSCanvasStore |
| `ContextTab.tsx` | 138 | 上下文导出 | ⚠️ 使用 mock，需接 DDSCanvasStore |
| `canvas/delivery/page.tsx` | 152 | 交付中心页面路由 `/canvas/delivery` | ✅ 可直接复用 |
| `app/export/page.tsx` | 833 | 代码生成导出（React/Vue/HTML/RN） | ✅ 可直接复用 |

**重大发现**: deliveryStore 的 `loadMockData()` 是唯一的数据源入口。Sprint5 只需修改这一个函数，将 mock 替换为真实数据拉取，不需要重写 8 个文件。

### 1.2 双向跳转现状

**当前状态**:
- Prototype Canvas（`/prototype/editor`）: 只有 back 按钮到 `/prototype`
- DDS Canvas（`/design/dds-canvas`）: 无跳转链接
- Delivery Center（`/canvas/delivery`）: 无任何跳转链接
- 三者完全孤立

**需要新增**:
- ProtoEditor → DDS Canvas（从组件卡片跳转查看对应的 BoundedContext）
- DDS Canvas → ProtoEditor（从 BoundedContext 跳转查看对应的原型页面）
- ProtoEditor/DDS Canvas → Delivery Center（导出入口）

### 1.3 导出器现状

| 导出器 | 状态 | Sprint5 价值 |
|--------|------|------------|
| OpenAPIGenerator（719行） | ✅ Sprint4 构建 | 直接复用 |
| DDL Generator | ❌ 不存在 | Sprint5 需新增 |
| Component Spec JSON | ⚠️ getExportData 存在 | 需扩展支持完整规格 |
| PRD Generator | ⚠️ PRDTab 硬编码 | 需接项目数据 |
| 代码生成器（export/page.tsx） | ✅ 存在 | 直接复用 |

### 1.4 Git History 分析

| Commit | 描述 | Sprint5 关联 |
|--------|------|------------|
| `ef90882a` | YAML export/import with round-trip validation | ✅ delivery export 可复用相同 round-trip 模式 |
| `5fc4c178` | Epic6 localStorage + IndexedDB dual-track + export/import | ✅ deliveryStore 可用相同持久化模式 |
| `d795e72e` | Epic4 AI 草图导入 | ⚠️ AI 导入 → 组件清单自动生成 → Delivery 可展示 |
| Sprint4 analyze | OpenAPIGenerator 可用 | ✅ Sprint4 产出物直接复用 |

---

## 2. 技术可行性评估

### 2.1 数据层集成（关键路径）

```typescript
// 修改 deliveryStore.ts: loadMockData()
// 替换为真实数据拉取

loadMockData: () => {
  // 原型画布组件数据
  const prototypeData = prototypeStore.getState().getExportData();
  // 详设画布数据
  const ddsData = ddsCanvasStore.getState();
  
  set({
    // contexts: ddsData.chapters.context.cards.map(c => toBoundedContext(c)),
    // flows: ddsData.chapters.flow.cards.map(c => toBusinessFlow(c)),
    // components: prototypeData.nodes.map(n => toComponent(n)),
    // prd: generatePRD(prototypeData, ddsData),
  });
}
```

**可行性**: ✅ 直接可行，prototypeStore 和 DDSCanvasStore 均已导出完整数据。

### 2.2 双向跳转

```typescript
// Prototype Canvas → DDS Canvas
// 在 ProtoNode 上点击右键 → "查看上下文" → router.push('/design/dds-canvas?projectId=...&highlight=bc-123')

// DDS Canvas → Prototype Canvas  
// 在 BoundedContextCard 上点击 → "查看原型" → router.push('/prototype/editor?projectId=...&highlight=page-...')

// ProtoEditor/DDS Canvas → Delivery Center
// Toolbar 增加 "导出" 按钮 → router.push('/canvas/delivery')
```

**可行性**: ✅ Next.js router，无额外依赖。

### 2.3 DDL 生成器（新增）

```typescript
// 新文件: src/lib/delivery/DDLExporter.ts
export function exportToDDL(schema: DDSCard[]): string {
  return schema
    .filter(card => card.type === 'bounded-context')
    .map(card => `
CREATE TABLE ${card.name.toLowerCase().replace(/\s+/g, '_')} (
  id UUID PRIMARY KEY,
  ${card.fields.map(f => `${f.name} ${f.type}`).join(',\n  ')}
);

${card.relations?.map(r => `ALTER TABLE ${card.name} ADD CONSTRAINT fk_${r.targetId}`).join(';\n')}
`).join('\n');
}
```

**可行性**: ⚠️ 可行，但需要明确 DDL 粒度（表级？字段级？）和 SQL 方言（PostgreSQL/MySQL）。

### 2.4 OpenAPI 导出集成

Sprint4 的 `APICanvasExporter.ts`（分析阶段定义）生成 OpenAPI JSON/YAML。Sprint5 只需在 Delivery Center 的 ComponentTab 或新 Tab 中调用：

```typescript
// DeliveryTabs 增加 'api' tab
// APIExporterTab 调用 APICanvasExporter.exportToOpenAPI()
// 显示 APIEndpointCard 列表，支持导出为 JSON/YAML
```

**可行性**: ✅ Sprint4 完成后直接复用。

---

## 3. 需求分析与 Epic 拆分

### Epic A: 数据层集成

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| A1 | deliveryStore.loadMockData → 真实数据 | 2h | 切换后 DeliveryCenter 显示真实 canvas 数据 |
| A2 | prototypeStore 组件 → Component 接口转换 | 1h | ProtoNode → Component 类型正确映射 |
| A3 | DDSCanvasStore → Context/Flow 接口转换 | 1h | BoundedContextCard → BoundedContext 映射 |
| A4 | PRD 自动生成 | 3h | 从 prototype nodes + DDS cards 生成 PRD 大纲 |

**Epic A 工时小计: 7h**

### Epic B: 双向跳转

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| B1 | ProtoEditor → DDS Canvas 跳转 | 1h | 节点右键菜单 "查看上下文" |
| B2 | DDS Canvas → ProtoEditor 跳转 | 1h | BoundedContext 卡片 "查看原型" |
| B3 | Toolbar 增加导出入口 | 1h | DDSToolbar + ProtoEditor toolbar 均显示导出按钮 |
| B4 | Delivery Center → Canvas 跳转返回 | 1h | Delivery Center 有 "返回编辑" 按钮 |

**Epic B 工时小计: 4h**

### Epic C: 交付导出器

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| C1 | DDL 生成器（新增） | 3h | BoundedContextCard → SQL DDL 转换 |
| C2 | ComponentTab 接入 prototypeStore | 2h | 组件列表显示真实 ProtoNode |
| C3 | OpenAPI Tab 集成（Sprint4 产出物） | 2h | 列表 APIEndpointCards，支持 JSON/YAML 导出 |
| C4 | DeliveryTabs 增加 'api' Tab | 1h | DeliveryTabs 包含 5 个 tab |
| C5 | 批量导出 ZIP | 2h | 组件规格 + OpenAPI + DDL 打包下载 |

**Epic C 工时小计: 10h**

### Epic D: PRD 融合

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| D1 | PRD Tab 接入项目数据 | 3h | PRD 内容从 prototype + DDS 实时生成 |
| D2 | PRD Markdown 导出 | 1h | 支持导出为 markdown 文件 |
| D3 | PRD 预览编辑器 | 2h | PRDTab 内嵌预览/编辑 |

**Epic D 工时小计: 6h**

### Epic E: 状态与错误处理

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| E1 | 空数据引导（Delivery Center 无数据时） | 1h | 显示引导文案指向编辑页面 |
| E2 | 导出失败 toast | 1h | 错误信息友好提示 |
| E3 | 加载骨架屏 | 1h | 数据加载时显示骨架屏 |

**Epic E 工时小计: 3h**

### 总工时汇总

| Epic | 工时 |
|------|------|
| A: 数据层集成 | 7h |
| B: 双向跳转 | 4h |
| C: 交付导出器 | 10h |
| D: PRD 融合 | 6h |
| E: 状态与错误处理 | 3h |
| **Total** | **30h** |

---

## 4. 风险矩阵

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| DDSCanvasStore 无 getExportData | 高 | 中 | 参照 prototypeStore 实现，或在 deliveryStore 直接访问 chapters |
| DDL 粒度不明确 | 中 | 高 | PRD 阶段明确表/字段粒度，采用 MVP 方案A（表级 DDL） |
| PRD 内容自动生成质量 | 中 | 高 | MVP 只做结构化输出（页面列表+组件+API），人工补充文案 |
| Sprint4 延迟影响 C3 | 中 | 中 | C3 设计为可选降级，Sprint4 未完成时跳过 API Tab |
| deliveryStore 膨胀 | 低 | 中 | 新 epic 完成后考虑 store 拆分 |
| Cross-canvas 跳转数据丢失 | 中 | 低 | URL 参数传递 projectId，数据从 store 重拉 |

---

## 5. 关键设计决策（待确认）

| 模糊项 | 方案A（推荐） | 方案B |
|--------|------------|--------|
| DDL 粒度 | 表级 DDL（每个 BoundedContext → 一个表） | 字段级 DDL（需要从 Context 提取字段 schema） |
| PRD 生成方式 | 半自动（结构化输出 + 人工补充文案） | AI 生成（调用 llm-provider） |
| 批量导出格式 | ZIP（含 JSON+YAML+DDL+Markdown） | 分 Tab 独立导出 |
| Cross-canvas 跳转存储 | URL 参数（projectId + highlight ID） | Clipboard 复制（快速但不持久） |

---

## 6. 验收标准具体性

| 功能 | 验收标准 | 可测试性 |
|------|---------|---------|
| A1 | Delivery Center 显示真实 ProtoNode 数据 | ✅ 浏览器截图验证 |
| A4 | PRD 大纲包含页面列表 + 组件清单 + API 端点 | ✅ E2E 测试 |
| B1 | ProtoEditor 节点右键有 "查看上下文" 菜单 | ✅ Playwright click 测试 |
| C1 | 导出 DDL 可被 `psql` 解析 | ✅ 命令行验证 |
| C5 | 下载 ZIP 包含 4 个文件（spec.json/openapi.yaml/ddl.sql/prd.md） | ✅ 解压验证 |
| D2 | PRD Markdown 包含正确的 h1/h2 层级 | ✅ 正则验证 |

---

## 7. 总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 5/5 | 复用 1912 行已有交付代码，数据层集成简单 |
| 复用资产价值 | ✅ 5/5 | 8 个文件/1912 行代码可直接复用 |
| 架构一致性 | ✅ 5/5 | 复用 prototypeStore + DDSCanvasStore 数据模型 |
| 工时合理性 | ✅ 5/5 | 30h，合理的集成收口工作量 |
| 风险可控性 | ⚠️ 4/5 | DDL 粒度和 PRD 生成有不确定性 |

**综合**: ✅ Recommended — Sprint5 是集成收口项目，复用资产丰厚，工时合理，风险可控。

---

*产出时间: 2026-04-18 02:49 GMT+8*
