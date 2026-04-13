# vibex-design-component-library — PRD

**项目**: vibex-design-component-library
**任务**: create-prd
**日期**: 2026-04-14
**作者**: PM Agent
**状态**: ✅ 完成
**基于**: analysis.md + planning.md

---

## 1. 执行摘要

### 背景

VibeX 的 json-render 预览系统目前只有一套通用组件，没有风格差异化能力。用户无法根据设计风格（airbnb/linear/stripe 等）预览组件在不同设计语言下的表现。`awesome-design-md-cn` 已包含 59 套风格（designs.json + DESIGN.md），需要转换为 json-render catalog 物料库。

### 目标

Phase 1（P0）：构建 generate-catalog 脚本，输出 3 个示例 catalog JSON，2d 交付。
Phase 2（P1）：批量生成 59 套 catalog，1d 交付。

### 成功指标

- [ ] `scripts/generate-catalog.ts` 可执行，接受 `--style` 参数
- [ ] `catalogs/airbnb.json`、`catalogs/linear.app.json`、`catalogs/stripe.json` 存在且 valid JSON
- [ ] 每个 catalog 包含：`style`、`displayName`、`tags`、`colorPalette`、`typography`、`catalog`（10 组件）
- [ ] `pnpm build` 通过
- [ ] 脚本执行时间 < 5s（单风格）
- [ ] 现有 `catalog.ts` 和 `registry.tsx` 未被修改

---

## 2. Epic 拆分

### Epic 1 — 工具链构建（Phase 1，P0）

**目标**: 脚本可执行 + 3 个示例 catalog 验证

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S1.1 | StyleCatalog Schema | TypeScript 接口定义，含版本字段、catalog.components 结构 | 0.25d | 见 3.1 |
| S1.2 | generate-catalog 脚本 | 读取 designs.json + DESIGN.md，解析 token，输出 JSON | 1d | 见 3.2 |
| S1.3 | 3 个示例 catalog 输出 | airbnb / linear.app / stripe catalog JSON 验证 | 0.5d | 见 3.3 |
| S1.4 | 回归防护 | 输出 JSON 解析检查，script < 5s，不修改现有文件 | 0.25d | 见 3.4 |

### Epic 2 — 规模化（Phase 2，P1）

**目标**: 批量生成 + 风格特征组件

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S2.1 | 批量生成脚本 | `generate-catalog --all` 覆盖 59 套风格 | 0.5d | 见 3.5 |
| S2.2 | 风格特征组件 Schema | 每个风格 2-3 个特征组件的 catalog 定义 | 0.5d | 见 3.6 |

---

## 3. 验收标准（expect() 断言）

### S1.1 — StyleCatalog Schema

| 页面集成 | 否（TypeScript 接口层） |
|----------|-------------------------|

**Given** `src/lib/canvas-renderer/catalogs/style-catalog.ts` 定义 StyleCatalog 接口
**When** TypeScript 编译
**Then** `expect(tsc --noEmit).toHaveExitCode(0)`

**接口必须包含字段**：
```typescript
expect(StyleCatalog).toMatchObject({
  version: expect.any(String),
  style: expect.any(String),
  displayName: expect.any(String),
  tags: expect.arrayContaining(expect.any(String)),
  colorPalette: expect.any(Object),
  typography: {
    fontFamily: expect.any(String),
    headingWeight: expect.any(Number),
    bodyWeight: expect.any(Number),
  },
  catalog: {
    components: expect.any(Object),
  },
  styleMetadata: expect.any(Object),
});
```

---

### S1.2 — generate-catalog 脚本

| 页面集成 | 否（Node.js 脚本层） |
|----------|----------------------|

**Test 1 — 脚本存在且可执行**
**Given** `scripts/generate-catalog.ts` 存在
**When** `node scripts/generate-catalog.ts --help` 或 `--style airbnb` 执行
**Then** `expect(exitCode).toBe(0)`

**Test 2 — 读取 designs.json**
**Given** designs.json 存在于 `/project/awesome-design-md-cn/data/`
**When** 脚本执行 `--style airbnb`
**Then** 脚本读取 designs.json 并找到 airbnb 记录，包含 tagsZh/styleKeywords/useCases

**Test 3 — 读取 DESIGN.md**
**Given** `design-md/airbnb/DESIGN.md` 存在
**When** 脚本执行 `--style airbnb`
**Then** 脚本读取文件，提取 Color Palette 和 Typography 章节

**Test 4 — 输出 catalog JSON**
**Given** designs.json 和 DESIGN.md 内容完整
**When** 脚本执行 `--style airbnb`
**Then** `expect(fs.existsSync('catalogs/airbnb.json')).toBe(true)`

**Test 5 — colorPalette 非空**
**Given** DESIGN.md 包含 Color Palette 章节
**When** 脚本解析输出
**Then** `expect(Object.keys(colorPalette).length).toBeGreaterThan(0)`

---

### S1.3 — 3 个示例 catalog 输出

| 页面集成 | 否（JSON 文件层） |
|----------|------------------|

**airbnb catalog 验证**
**Given** `catalogs/airbnb.json` 已生成
**When** JSON.parse() 解析文件
**Then**
- `expect(JSON.parse(content).style).toBe('airbnb')`
- `expect(JSON.parse(content).displayName).toBeTruthy()`
- `expect(JSON.parse(content).tags).toContain('民宿')`（来自 tagsZh）
- `expect(JSON.parse(content).colorPalette).toMatchObject(expect.any(Object))`
- `expect(Object.keys(JSON.parse(content).catalog.components)).toHaveLength(10)`

**linear.app catalog 验证**
**Given** `catalogs/linear.app.json` 已生成
**When** JSON.parse() 解析文件
**Then**
- `expect(JSON.parse(content).style).toBe('linear.app')`
- `expect(JSON.parse(content).catalog.components).toHaveLength(10)`

**stripe catalog 验证**
**Given** `catalogs/stripe.json` 已生成
**When** JSON.parse() 解析文件
**Then**
- `expect(JSON.parse(content).style).toBe('stripe')`
- `expect(JSON.parse(content).catalog.components).toHaveLength(10)`

**组件数量一致性**
**Given** 现有 `catalog.ts` 定义 10 个基础组件
**When** 每个生成的 catalog 解析
**Then** `expect(Object.keys(catalog.components)).toHaveLength(10)`

---

### S1.4 — 回归防护

| 页面集成 | 否（构建验证层） |
|----------|-----------------|

**Test 1 — JSON 解析验证**
**Given** `catalogs/` 目录存在
**When** 运行回归验证脚本（读取所有 catalog JSON）
**Then** `expect(allCatalogs.every(c => typeof c === 'object')).toBe(true)`

**Test 2 — 脚本执行时间**
**Given** `generate-catalog --style airbnb` 执行
**When** 计时
**Then** `expect(execTime).toBeLessThan(5000)`（< 5s）

**Test 3 — 现有文件未被修改**
**Given** 修改前后 `catalog.ts` 和 `registry.tsx` 文件内容
**When** diff 对比
**Then** `expect(isModified).toBe(false)`

**Test 4 — TypeScript 编译**
**Given** 脚本添加了 TypeScript 类型
**When** `pnpm build` 执行
**Then** `expect(exitCode).toBe(0)`

---

### S2.1 — 批量生成脚本

| 页面集成 | 否（Node.js 脚本层） |
|----------|----------------------|

**Test 1 — --all 参数**
**Given** `designs.json` 含 59 条记录
**When** `generate-catalog --all` 执行
**Then** `expect(fs.readdirSync('catalogs/').length).toBeGreaterThanOrEqual(59)`

**Test 2 — 所有风格均生成**
**Given** designs.json 含 airbnb/stripe/linear.app
**When** `--all` 执行
**Then** `['airbnb', 'stripe', 'linear.app'].forEach(s => expect(fs.existsSync(\`catalogs/\${s}.json\`)).toBe(true))`

**Test 3 — 失败优雅处理**
**Given** 某个 DESIGN.md 格式异常导致解析失败
**When** `--all` 执行
**Then** 跳过该风格，继续处理其余，不中断整个批次

---

### S2.2 — 风格特征组件 Schema

| 页面集成 | 否（Schema 定义层） |
|----------|---------------------|

**Given** `catalogs/airbnb.json` 的 styleComponents 字段
**When** 读取 JSON
**Then**
- `expect(styleComponents).toBeInstanceOf(Array)`
- `expect(styleComponents.length).toBeGreaterThanOrEqual(2)`
- `expect(styleComponents[0]).toMatchObject({
    name: expect.any(String),
    catalogType: expect.stringMatching(/^(Page|Form|Card|Button)$/),
    description: expect.any(String),
    styleOverrides: expect.any(Object),
    tokens: expect.any(Object),
  })`

---

## 4. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | StyleCatalog Schema | TypeScript 接口定义 | tsc --noEmit 通过 | 否 |
| F1.2 | generate-catalog 脚本 | designs.json + DESIGN.md → JSON | 脚本可执行 + 输出 valid JSON | 否 |
| F1.3 | 示例 catalog 输出 | airbnb/linear.app/stripe 三个 JSON | tags 非空 + 10 组件 + colorPalette | 否 |
| F1.4 | 回归防护 | JSON 解析 + 时间 + 文件修改检查 | 全部通过 | 否 |
| F2.1 | 批量生成脚本 | --all 生成 59 套 catalog | ≥ 59 个 JSON 文件 | 否 |
| F2.2 | 风格特征组件 | 每个风格 2-3 个特征组件 schema | 字段完整 | 否 |

---

## 5. DoD (Definition of Done)

### Epic 1 Stories

**S1.1 完成标准**：
- [ ] `src/lib/canvas-renderer/catalogs/style-catalog.ts` 存在
- [ ] 接口包含 version、style、displayName、tags、colorPalette、typography、catalog、styleMetadata
- [ ] `pnpm tsc --noEmit` 通过

**S1.2 完成标准**：
- [ ] `scripts/generate-catalog.ts` 存在且可执行
- [ ] 支持 `--style <name>` 参数
- [ ] 读取 designs.json 提取标签字段
- [ ] 读取 DESIGN.md 提取 color palette 和 typography
- [ ] 输出 `catalogs/{style}.json`

**S1.3 完成标准**：
- [ ] `catalogs/airbnb.json`、`catalogs/linear.app.json`、`catalogs/stripe.json` 均存在
- [ ] 每个文件 valid JSON
- [ ] tags 包含原始 tagsZh + styleKeywords 合并
- [ ] catalog.components 含 10 个组件
- [ ] colorPalette 非空

**S1.4 完成标准**：
- [ ] 所有生成的 catalog JSON 可被 JSON.parse 解析
- [ ] 单风格脚本执行 < 5s
- [ ] `catalog.ts` 和 `registry.tsx` 未被修改

### Epic 2 Stories

**S2.1 完成标准**：
- [ ] `scripts/generate-catalog.ts` 支持 `--all` 参数
- [ ] `--all` 执行后生成 ≥ 59 个 JSON 文件
- [ ] 跳过解析失败的风格，不中断批次

**S2.2 完成标准**：
- [ ] 每个生成的 catalog 含 `styleComponents` 字段
- [ ] 每个风格 2-3 个特征组件
- [ ] 字段结构正确（name/catalogType/description/styleOverrides/tokens）

---

## 6. 驳回校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点模糊，无法写 expect() → 已细化到文件存在 + JSON 解析 + 字段断言
- [x] 涉及页面但未标注【需页面集成】→ 全部标注（无页面集成，均为脚本/Schema 层）
- [x] 已执行 Planning（Feature List + Epic/Story）

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-design-component-library
- **执行日期**: 2026-04-14
- **Phase 1**: 工具链构建（2d）：S1.1–S1.4
- **Phase 2**: 规模化（1d）：S2.1–S2.2

---

*PM Agent — 2026-04-14*
