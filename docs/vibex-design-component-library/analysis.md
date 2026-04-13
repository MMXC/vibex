# vibex-design-component-library — 需求分析报告

**项目**: vibex-design-component-library
**任务**: analyze-requirements
**日期**: 2026-04-14
**作者**: Analyst Agent
**状态**: ✅ 完成

---

## 1. 业务场景分析

### 1.1 问题背景

VibeX 的 json-render 预览系统目前只有一套通用组件（Button/Card/Page 等），没有风格差异化能力。用户无法根据设计风格（airbnb/linear/stripe 等）预览组件在不同设计语言下的表现。

**核心需求**：设计一套工具链，将 `awesome-design-md-cn` 的 59 套设计风格转换为 json-render catalog 物料库，供 AI 在生成组件时选择和匹配。

### 1.2 资产盘点

**已有资产**（已验证存在）：

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| designs.json | `/project/awesome-design-md-cn/data/designs.json` | ✅ 59 条 | 含 tagsZh/styleKeywords/useCases/bestFor/avoidFor/positioningZh |
| DESIGN.md | `/project/awesome-design-md-cn/design-md/{style}/DESIGN.md` | ✅ 59 份 | 含 color palette/typography/component specs |
| 现有 catalog | `vibex-fronted/src/lib/canvas-renderer/catalog.ts` | ✅ 10 组件 | Button/Card/Badge/StatCard/Page/Form/DataTable/DetailView/Modal/Empty |
| 现有 registry | `vibex-fronted/src/lib/canvas-renderer/registry.tsx` | ✅ 完整 | Tailwind 实现 |

**注意**：`{style}` 路径中，`linear` 应为 `linear.app`，`stripe` 存在。

### 1.3 标签体系分析

designs.json 中每条记录有 5 个标签字段：

| 字段 | 示例（airbnb） | 用途 |
|------|----------------|------|
| `tagsZh` | `["民宿", "旅行"]` | 直接可用的关键词 |
| `styleKeywords` | `["民宿", "旅行", "温馨", "友好", "旅行感"]` | 风格描述词 |
| `useCases` | `["品牌官网", "活动专题页"]` | 适用场景 |
| `bestFor` | `["品牌官网", "活动专题页"]` | 推荐使用场景 |
| `avoidFor` | `["复杂运维后台"]` | 禁用场景 |
| `positioningZh` | 定位语 | 品牌定位描述 |

**标签聚合池规模**：59 styles × ~5 tags = ~295 个独特标签可供匹配。

---

## 2. Research 结果

### 2.1 Git History

`src/lib/canvas-renderer/` 和 `src/components/canvas/json-render/` 的 git log 为空（无 commit 历史），说明这部分是近期新增或独立分支开发，无历史包袱。

### 2.2 来自 learnings

**无直接命中**。learnings 中无设计系统、catalog 自动化生成、标签匹配相关经验。

**历史教训参考**（来自 json-render 相关文档）：
- `vibex-json-render-fix/analysis.md`：API transformation layer 不应静默返回空数据
- `canvas-jsonrender-preview/analysis.md`：catalog 组件应有 slots 声明（已在本项目前置任务中分析）

### 2.3 关键风险

**`docs/vibex-json-render-fix/analysis.md`（2026-04-11）** 警示：历史修复未持续跟进导致问题复现。本次工具链设计应增加回归防护（脚本输出验证）。

---

## 3. 技术方案选项

### 方案 A — Node.js 脚本 + 静态 JSON 输出（推荐）

**思路**：用 Node.js 脚本读取 designs.json + DESIGN.md，解析 Markdown 提取 token，生成 TypeScript/JSON catalog 文件。

**脚本架构**：

```
scripts/generate-catalog.ts
    │
    ├── input: designs.json
    │       └── 提取 tags, styleKeywords, useCases, bestFor, avoidFor, positioningZh
    │
    ├── input: design-md/{style}/DESIGN.md
    │       └── 解析 ## Color Palette → tokens
    │       └── 解析 ## Typography Rules → font tokens
    │       └── 解析 ## Component Specifications → component schemas
    │
    └── output: vibex-fronted/src/lib/canvas-renderer/catalogs/{style}.json
            └── catalog schema + tags + styleMetadata
```

**catalog JSON Schema 草案**：

```typescript
interface StyleCatalog {
  // === json-render Catalog 基础结构 ===
  version: "1.0";
  style: string;                    // e.g. "airbnb"
  displayName: string;               // e.g. "爱彼迎"

  // === 标签嵌入 ===
  tags: string[];                   // 聚合自 tagsZh + styleKeywords
  styleKeywords: string[];           // 原始 styleKeywords
  useCases: string[];                // 原始 useCases
  bestFor: string[];                 // 原始 bestFor
  avoidFor: string[];               // 原始 avoidFor
  positioningZh: string;            // 原始 positioningZh
  category: string;                  // 原始 category

  // === 设计 token ===
  styleMetadata: {
    colorPalette: Record<string, string>;   // e.g. { brandRed: "#ff385c", nearBlack: "#222222" }
    typography: {
      fontFamily: string;
      headingWeight: number;
      bodyWeight: number;
    };
    spacing: Record<string, string>;        // borderRadius, shadow layers
  };

  // === json-render catalog 组件定义 ===
  catalog: {
    components: Record<string, {
      type: string;                           // "Page" | "Form" | etc.
      props: Record<string, unknown>;           // Zod-compatible schema shape
      slots?: string[];
      description: string;
    }>;
  };

  // === 风格特征组件（每个风格 2-3 个）===
  styleComponents: Array<{
    name: string;                             // e.g. "AirbnbCategoryCard"
    catalogType: string;                      // e.g. "Card"
    description: string;
    styleOverrides: Record<string, string>;   // Tailwind classes specific to this style
    tokens: Record<string, string>;           // css variables / design tokens
  }>;
}
```

**脚本依赖**：
- `gray-matter`：解析 DESIGN.md frontmatter（无则跳过）
- `marked` 或 `remark`：Markdown AST 解析（提取 color/typography/component sections）
- `json5`：生成 human-readable JSON

**优点**：
- 实现成本低，Node.js 原生
- 静态 JSON 文件，运行时零依赖
- 可版本化，每次运行生成可 diff 的产物

**缺点**：
- DESIGN.md 是自然语言文档，解析脆弱（依赖固定 Markdown 结构）
- 风格组件的 token 提取需要手工映射（无法全自动）

**工期**：1d（脚本）+ 0.5d（3 个示例输出）
**风险**：低（静态输出，不影响现有系统）

---

### 方案 B — Python 脚本 + DESIGN.md 语义解析

**思路**：用 Python 脚本，利用 LLM 或规则解析 DESIGN.md，提取更精确的组件定义和 token。

```python
# scripts/generate_catalog.py
def parse_design_md(style: str) -> StyleCatalog:
    design_md = read(f"design-md/{style}/DESIGN.md")
    
    # Section-based parsing
    color_section = extract_section(design_md, "Color Palette")
    color_palette = parse_color_tokens(color_section)
    
    type_section = extract_section(design_md, "Typography Rules")
    typography = parse_typography(type_section)
    
    component_section = extract_section(design_md, "Component Specifications")
    components = parse_component_specs(component_section)
    
    return StyleCatalog(...)
```

**优点**：
- Python Markdown 解析库（`mistune`/`markdown-it`）比 Node.js 更成熟
- 可结合规则引擎提取 token

**缺点**：
- Python 依赖引入额外的运行时环境
- VibeX 是 TypeScript 项目，Python 脚本与前端工具链隔离

**工期**：1.5d
**风险**：中（跨语言工具链维护成本）

---

### 方案 C — AI 辅助生成（高级方案）

**思路**：设计 prompt，让 AI 直接从 DESIGN.md 批量生成 catalog JSON，减少手工 token 映射工作量。

```typescript
// scripts/generate-catalog-ai.ts
async function generateCatalogAI(style: string, designMd: string): Promise<StyleCatalog> {
  const prompt = `
    你是一个设计系统工程师。请从以下 DESIGN.md 提取信息，生成 json-render catalog。
    
    设计风格: ${style}
    设计文档: ${designMd}
    
    输出格式（JSON）:
    {
      "style": "${style}",
      "colorPalette": {...},
      "typography": {...},
      "catalog": { "components": {...} },
      "styleComponents": [...]
    }
  `;
  return callLLM(prompt);
}
```

**优点**：
- 自动化程度最高，能从自然语言提取组件定义
- 可以批量处理 59 套风格

**缺点**：
- 依赖 LLM API，调用成本不可控
- 59 套风格 × 1 次 LLM 调用 = 成本高
- 输出质量不稳定，需要验证脚本

**工期**：2d（prompt 工程 + 验证脚本）
**风险**：高（LLM 输出不确定性）

---

## 4. 可行性评估

| 维度 | 方案 A（Node.js） | 方案 B（Python） | 方案 C（AI 辅助） |
|------|-------------------|-----------------|------------------|
| 技术难度 | ⭐ 低 | ⭐ 中 | ⭐ 高 |
| 工期 | 1.5d | 1.5d | 2d |
| 风险 | 低 | 中 | 高 |
| 输出稳定性 | 高 | 高 | 中 |
| 工具链一致性 | 高（TS 项目内） | 中（跨语言） | 高（TS 项目内） |
| 自动化程度 | 中（规则解析） | 中（规则解析） | 高（AI 提取） |

**推荐**：方案 A。技术可行、风险最低、与现有 TypeScript 项目完全集成。

---

## 5. JTBD（Jobs-To-Be-Done）

**JTBD-1**：用户说"我要一个像 Airbnb 风格的品牌落地页" → AI 匹配 airbnb catalog → 加载 `catalogs/airbnb.json` → 渲染组件预览

**JTBD-2**：用户说"我要一个适合 SaaS 后台的设计风格" → AI 从标签池匹配 bestFor 包含 SaaS 的风格 → 返回 linear.app → 加载 catalog → 渲染

**JTBD-3**：用户说"我不想要卡通化风格" → AI 过滤 avoidFor 包含"卡通化"的所有风格 → 排除 lovable/zapier 等

**JTBD-4**：Dev 要新增一套设计风格（如 notion） → 运行脚本 → 自动生成 `catalogs/notion.json` → 无需手工编写 schema

**JTBD-5**：AI 生成组件时 → 根据用户选择的风格 → 从对应 catalog 加载 styleMetadata → 覆盖组件默认 Tailwind 类 → 渲染风格化预览

---

## 6. 初步风险识别

### 风险 1 — DESIGN.md 结构不一致（中）
59 套 DESIGN.md 的 Markdown 结构基本一致，但 token 格式有差异（如 airbnb 用 `--palette-*` CSS 变量，stripe 用 `color-*`）。脚本需要兼容多种 token 命名约定。

**缓解**：脚本分层解析，fallback 到通用正则提取。输出 JSON 后人工 review 前 3 个示例。

### 风险 2 — 风格组件映射的主观性（高）
从 DESIGN.md 提取"每个风格 2-3 个特征组件"需要理解设计意图，这是高度主观的任务。完全自动化容易生成无意义的组件（如从"温馨"提取"暖色调按钮"）。

**缓解**：Phase 1 脚本仅生成 token + 通用组件，不生成风格特征组件。风格特征组件作为 Phase 2 手工产出。

### 风险 3 — catalog JSON 运行时加载（中）
59 套 catalog 全部加载到内存不现实。需支持按需加载（lazy load）。

**缓解**：catalog 静态文件存于 `catalogs/` 目录，运行时根据用户选择加载对应 JSON 文件。

### 风险 4 — AI 标签匹配的准确性（高）
用户输入 → 标签匹配 → catalog 选择 → 组件预览的全链路中，AI 匹配环节的质量决定用户体验。

**缓解**：Phase 1 不实现 AI 标签匹配，仅产出 catalog 文件。标签匹配作为 Phase 3 单独设计。

### 风险 5 — json-render Schema 版本兼容（中）
catalog 中的组件 props schema 需要与 `@json-render/core` 版本匹配。若 json-render 升级导致 schema API 变化，所有已生成的 catalog 可能失效。

**缓解**：catalog 生成脚本增加 schema 版本字段，运行时校验版本兼容性。

---

## 7. 验收标准

### 7.1 脚本开发（Phase 1）
- [ ] `scripts/generate-catalog.ts` 存在且可执行
- [ ] 脚本接受 `style` 参数（如 `airbnb`）
- [ ] 脚本读取 `designs.json` 提取标签字段
- [ ] 脚本读取 `design-md/{style}/DESIGN.md` 提取 color palette 和 typography tokens
- [ ] 脚本输出 `vibex-fronted/src/lib/canvas-renderer/catalogs/{style}.json`
- [ ] `pnpm build` 通过（TypeScript 类型检查）

### 7.2 示例输出验证（Phase 1）
- [ ] `catalogs/airbnb.json` 存在且 valid JSON
- [ ] `catalogs/linear.app.json` 存在且 valid JSON（注意目录名是 `linear.app` 不是 `linear`）
- [ ] `catalogs/stripe.json` 存在且 valid JSON
- [ ] 每个 catalog 包含：`style`, `displayName`, `tags`, `styleKeywords`, `colorPalette`, `typography`, `catalog`（含 10 个基础组件）
- [ ] 每个 catalog 的 `catalog.components` 数量与现有 `catalog.ts` 一致（10 个）
- [ ] 每个 catalog 的 `styleMetadata.colorPalette` 非空（至少含 brand/accent color）

### 7.3 Catalog Schema 验证
- [ ] catalog JSON 符合 `StyleCatalog` 接口定义
- [ ] `catalog.catalog.components` 中每个组件有 `type`、`description`
- [ ] `catalog.tags` 包含原始 `tagsZh` + `styleKeywords` 的合并结果

### 7.4 回归防护（Phase 1）
- [ ] 运行 `generate-catalog airbnb` 后，`catalogs/airbnb.json` 可被 `JSON.parse()` 成功解析
- [ ] 脚本执行时间 < 5s（单风格）
- [ ] 现有 `catalog.ts` 和 `registry.tsx` 未被修改

### 7.5 Phase 2/3（Future）
- [ ] `scripts/generate-catalog --all` 批量生成 59 套 catalog
- [ ] 风格特征组件（每个风格 2-3 个）的 schema 定义
- [ ] AI 标签匹配流程设计文档

---

## 8. 执行决策

```markdown
## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-design-component-library (Phase 1: 脚本 + 3 示例输出)
- **执行日期**: 2026-04-14
- **备注**: Phase 1 聚焦工具链，不含 AI 标签匹配（Phase 3）。风格特征组件手工产出，脚本仅处理 token + 基础组件
```

---

*Analyst Agent — 2026-04-14*
