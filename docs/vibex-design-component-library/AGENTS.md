# AGENTS.md — vibex-design-component-library 实施指南

**项目**: vibex-design-component-library
**阶段**: 实施（Phase 1 + Phase 2）
**日期**: 2026-04-14
**基于**: architecture.md + IMPLEMENTATION_PLAN.md

---

## 角色与职责

| 角色 | 职责 |
|------|------|
| Architect | 提供架构方案、代码规范、验收清单 |
| Coder | Phase 1 + Phase 2 代码实现 |
| Reviewer | 回归检查 + 合入 |

---

## 关键文件清单

### 新建文件

| 文件 | 说明 |
|------|------|
| `scripts/generate-catalog.ts` | 入口脚本 |
| `scripts/parsers/design-md.ts` | DESIGN.md 解析器 |
| `scripts/parsers/designs-index.ts` | designs.json 解析器 |
| `src/lib/canvas-renderer/catalogs/style-catalog.ts` | StyleCatalog Zod Schema |
| `src/lib/canvas-renderer/catalogs/*.json` | 生成输出（59 个） |

### 必读文件

| 文件 | 说明 |
|------|------|
| `architecture.md` | 架构方案 |
| `IMPLEMENTATION_PLAN.md` | 详细实施步骤 |
| `analysis.md` | 根因分析 |
| `prd.md` | PRD 验收标准 |
| `/project/awesome-design-md-cn/data/designs.json` | 输入数据 |
| `/project/awesome-design-md-cn/design-md/airbnb/DESIGN.md` | DESIGN.md 示例 |

---

## 代码规范

### 原则

1. **零破坏现有代码**: `catalog.ts` 和 `registry.tsx` 不修改
2. **DESIGN.md 解析健壮**: 所有提取失败都有默认值 fallback
3. **Schema 优先验证**: 输出 JSON 前 Zod parse，失败立即报错
4. **批量模式无交互**: `--all` 完全自动化，CI 可用

### 禁止

- 禁止在 `scripts/generate-catalog.ts` 中直接修改 `catalog.ts`
- 禁止跳过 Zod 验证直接写入 JSON
- 禁止在 `--all` 模式下因为单风格失败而中断

---

## 验收标准

### Phase 1 完成标准

- [ ] `node scripts/generate-catalog.ts --style airbnb` 成功生成 `catalogs/airbnb.json`
- [ ] `node scripts/generate-catalog.ts --style linear.app` 成功生成 `catalogs/linear.app.json`
- [ ] `node scripts/generate-catalog.ts --style stripe` 成功生成 `catalogs/stripe.json`
- [ ] 每个 JSON 包含必填字段（style、displayName、tags、colorPalette、typography）
- [ ] 单风格生成 < 5s
- [ ] `git diff src/lib/canvas-renderer/catalog.ts` 无输出
- [ ] `git diff src/lib/canvas-renderer/registry.tsx` 无输出

### Phase 2 完成标准

- [ ] `--all` 生成全部 59 套 catalog
- [ ] 59 个 JSON 文件均为 valid JSON
- [ ] `pnpm build` 通过

---

## 已知限制

1. DESIGN.md 解析使用正则表达式，对格式变化敏感，Phase 1 需验证 3 个风格后确认健壮性
2. 部分风格 DESIGN.md 可能缺少某些 token（fontFamilyMono、openTypeFeatures 等），已提供 fallback
3. 本次实施仅产出静态 JSON catalog 文件，catalog 如何在运行时注入 registry（Phase 3 待定）
