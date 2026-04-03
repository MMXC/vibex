# Implementation Plan: proposals-20260401-5

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**总工时**: 7h

---

## 1. 工时分配

| Epic | Story | 工时 | 依赖 | 执行顺序 |
|------|-------|------|------|----------|
| E1 | E1-S1: DDD 命名规范文档 | 2h | — | 可并行 |
| E1 | E1-S2: Tab 快捷键绑定 | 1h | — | 可并行 |
| E2 | E2-S1: v0 周会机制 | 0.5h | — | 可并行 |
| E2 | E2-S2: Domain CI workflow | 1.5h | — | 可并行 |
| E3 | E3-S1: 导出面板增强 | 1h | — | 可并行 |
| E3 | E3-S2: 批量 zip 导出 | 1h | E3-S1 | 串行 |
| **合计** | | **7h** | | |

**执行策略**: E1-S1, E1-S2, E2-S1, E2-S2, E3-S1 可并行派发给 5 个 dev 子任务；E3-S2 依赖 E3-S1 完成后执行。

---

## 2. Epic E1: DDD 命名规范 + Tab 快捷键

### 2.1 E1-S1: DDD 命名规范文档（2h）

**文件**: `docs/ddd-naming-convention.md`

**步骤**:
1. 创建文件 `docs/ddd-naming-convention.md`
2. 编写目的说明（参考 ADR-001 背景）
3. 编写允许模式（≥ 5 个，含示例和领域说明）
4. 编写禁止模式（≥ 5 个，含示例和原因说明）
5. 编写判断流程（3 步检查清单）
6. 添加 `@updated` 和 `@owner` 元数据
7. 验证文档结构完整性

**验收命令**:
```bash
# 文档存在性
test -f docs/ddd-naming-convention.md && echo "✅ 文档存在"

# 允许模式数量
ALLOWED=$(grep -c "^| " docs/ddd-naming-convention.md < <(sed -n '/## 允许模式/,/## 禁止模式/p' docs/ddd-naming-convention.md))
echo "允许模式数量: $ALLOWED (需 ≥ 5)"

# 禁止模式数量
FORBIDDEN=$(grep -c "^| " docs/ddd-naming-convention.md < <(sed -n '/## 禁止模式/,$p' docs/ddd-naming-convention.md))
echo "禁止模式数量: $FORBIDDEN (需 ≥ 5)"

# 元数据
grep "@updated" docs/ddd-naming-convention.md
grep "@owner" docs/ddd-naming-convention.md
```

---

### 2.2 E1-S2: Tab 快捷键绑定（1h）

**文件**: `src/pages/CanvasPage.tsx`

**步骤**:
1. 在 `CanvasPage` 组件的 `useEffect` 中添加 keydown 监听
2. 检测 `e.altKey && ['1','2','3'].includes(e.key)`
3. 调用 `e.preventDefault()` 防止浏览器默认行为
4. dispatch `setActiveTree()` 切换面板
5. 更新 `ShortcutHintPanel` 组件添加 Alt+1/2/3 说明
6. Playwright E2E 测试覆盖

**验收命令**:
```bash
# 源代码检查
grep -n "altKey" src/pages/CanvasPage.tsx && echo "✅ Alt 监听已添加"
grep -n "preventDefault" src/pages/CanvasPage.tsx && echo "✅ preventDefault 已添加"
grep -n "setActiveTree" src/pages/CanvasPage.tsx && echo "✅ setActiveTree 调用已添加"

# ShortcutHintPanel 更新
grep -n "Alt+1" src/components/ShortcutHintPanel/ && echo "✅ ShortcutHint 已更新"

# Playwright E2E
npx playwright test e2e/shortcuts.spec.ts --reporter=list
```

**关键约束**:
- `e.preventDefault()` 必须在检测到 `e.altKey` 后立即调用
- 不在 Alt 按下时禁止其他 Alt 组合键（如 Alt+F4）

---

## 3. Epic E2: v0 监控 + Domain CI 检查

### 3.1 E2-S1: v0 竞品周会机制（0.5h）

**文件**:
- `docs/meeting/agenda-template.md`（如存在则扩展）
- `docs/competitive/v0-updates.md`（新建）

**步骤**:
1. 检查 `docs/meeting/` 目录是否存在 agenda 模板
2. 如存在，在模板中添加 v0 更新回顾项
3. 如不存在，创建 `docs/meeting/agenda-template.md` 并包含 v0 项
4. 创建 `docs/competitive/v0-updates.md` 格式文档
5. 添加初始 v0 记录（当前 v0.dev 最新功能）
6. 标注 `@updated` 和 `@owner` 元数据

**验收命令**:
```bash
# v0-updates.md 存在性
test -f docs/competitive/v0-updates.md && echo "✅ v0-updates.md 存在"

# 周会议程含 v0
grep -i "v0" docs/meeting/agenda-template.md && echo "✅ 议程包含 v0 项"

# 元数据
grep "@updated" docs/competitive/v0-updates.md
grep "@owner" docs/competitive/v0-updates.md
grep "@updated" docs/meeting/agenda-template.md
```

---

### 3.2 E2-S2: Domain CI Workflow（1.5h）

**文件**: `.github/workflows/domain-check.yml`

**步骤**:
1. 创建 `.github/workflows/` 目录（如不存在）
2. 创建 `domain-check.yml` workflow 文件
3. 配置 `on.schedule` cron: `'0 0 * * 0'`（每周日 00:00 UTC）
4. 配置 `workflow_dispatch` 手动触发
5. 实现 `@updated` 时间戳提取逻辑
6. 实现 30 天阈值判断和 warning 输出
7. 本地测试 workflow 语法（`act` 或手动验证 YAML）
8. 提交并验证 CI 可执行

**验收命令**:
```bash
# workflow 文件存在
test -f .github/workflows/domain-check.yml && echo "✅ CI workflow 存在"

# cron 配置正确
grep "cron" .github/workflows/domain-check.yml && echo "✅ Cron 配置存在"

# workflow_dispatch 存在
grep "workflow_dispatch" .github/workflows/domain-check.yml && echo "✅ 手动触发配置存在"

# 检查逻辑存在
grep "30" .github/workflows/domain-check.yml && echo "✅ 30 天阈值已配置"

# YAML 语法验证
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/domain-check.yml'))" && echo "✅ YAML 语法正确"

# CI 手动触发测试（可选）
gh workflow run domain-check --ref proposals-20260401-5 --dry-run
```

**关键约束**:
- CI workflow 必须在 `schedule` 上运行（不能仅 `workflow_dispatch`）
- `@updated` 时间戳格式必须为 `YYYY-MM-DD`
- 超过 30 天必须输出 GitHub Actions `::warning::`

---

## 4. Epic E3: PNG/SVG 批量导出

### 4.1 E3-S1: 导出面板增强（1h）

**文件**: `src/components/ExportPanel/`

**步骤**:
1. 定位现有 `ExportPanel` 组件（format-select 所在位置）
2. 在 `ExportFormat` 类型中添加 `'png' | 'svg'`
3. 在 format-select 下拉选项中添加 PNG 和 SVG
4. 实现 `exportAsPNG()` 函数（canvas.toDataURL）
5. 实现 `exportAsSVG()` 函数（XMLSerializer）
6. 绑定选择事件到对应导出函数
7. Playwright E2E 测试覆盖

**验收命令**:
```bash
# PNG 选项存在
grep -n "'png'" src/components/ExportPanel/ && echo "✅ PNG 选项已添加"

# SVG 选项存在
grep -n "'svg'" src/components/ExportPanel/ && echo "✅ SVG 选项已添加"

# 导出函数存在
grep -n "exportAsPNG" src/components/ExportPanel/ && echo "✅ exportAsPNG 已定义"
grep -n "exportAsSVG" src/components/ExportPanel/ && echo "✅ exportAsSVG 已定义"

# E2E 测试
npx playwright test e2e/export.spec.ts --grep "PNG\|SVG" --reporter=list
```

**关键约束**:
- PNG 导出必须保留节点质量（`canvas.toDataURL('image/png', 1.0)`）
- 不能破坏现有 React/Vue/Svelte 导出选项

---

### 4.2 E3-S2: 批量 zip 导出（1h）

**文件**: `src/components/ExportPanel/`

**步骤**:
1. 实现 `exportAllAsZip(format)` 函数
2. 遍历 `store.getState().canvas.nodes` 获取所有节点
3. 对每个节点调用对应格式导出函数
4. 使用 JSZip 将所有文件打包
5. 触发下载（创建 `<a>` 元素 + click）
6. 在 ExportPanel 添加「导出全部」按钮
7. Playwright E2E 验证 zip 文件数量 = 节点数量

**验收命令**:
```bash
# zip 函数存在
grep -n "exportAllAsZip" src/components/ExportPanel/ && echo "✅ exportAllAsZip 已定义"

# 导出全部按钮存在
grep -n "export-all-btn" src/components/ExportPanel/ && echo "✅ 导出全部按钮已添加"

# E2E 测试（文件数量验证）
npx playwright test e2e/export.spec.ts --grep "zip" --reporter=list

# 手动验证：至少 2 个节点导出
# 1. 在 Canvas 创建 3 个节点
# 2. 打开导出面板
# 3. 选择 PNG，导出全部
# 4. 下载 zip，解压后应有 3 个 .png 文件
```

**关键约束**:
- zip 必须包含所有节点，无遗漏
- 文件命名应包含节点名称（`${node.name}.${format}`）

---

## 5. 验证总表

| Epic | Story | 验收命令 | 预期结果 |
|------|-------|----------|----------|
| E1 | E1-S1 | `test -f docs/ddd-naming-convention.md` | 0（成功） |
| E1 | E1-S1 | `grep -c "^| " docs/ddd-naming-convention.md` | ≥ 10 |
| E1 | E1-S2 | `grep "altKey" src/pages/CanvasPage.tsx` | 存在 |
| E1 | E1-S2 | `npx playwright test e2e/shortcuts.spec.ts` | 全部通过 |
| E2 | E2-S1 | `test -f docs/competitive/v0-updates.md` | 0（成功） |
| E2 | E2-S2 | `test -f .github/workflows/domain-check.yml` | 0（成功） |
| E2 | E2-S2 | `gh workflow run domain-check --dry-run` | 成功 |
| E3 | E3-S1 | `grep "'png'\|'svg'" src/components/ExportPanel/` | 存在 |
| E3 | E3-S2 | `npx playwright test e2e/export.spec.ts --grep "zip"` | 全部通过 |
| E3 | E3-S2 | zip 解压后文件数 === 节点数 | true |

---

## 6. 提交约定

| Epic | 提交信息 | 文件变更 |
|------|----------|----------|
| E1-S1 | `docs: add DDD naming convention` | `docs/ddd-naming-convention.md` |
| E1-S2 | `feat: add Alt+1/2/3 tab shortcuts` | `src/pages/CanvasPage.tsx`, `src/components/ShortcutHintPanel/` |
| E2-S1 | `docs: add v0 weekly review mechanism` | `docs/competitive/v0-updates.md`, `docs/meeting/` |
| E2-S2 | `ci: add domain-check workflow (30-day staleness)` | `.github/workflows/domain-check.yml` |
| E3-S1 | `feat: add PNG/SVG export options` | `src/components/ExportPanel/` |
| E3-S2 | `feat: add batch zip export` | `src/components/ExportPanel/`, `e2e/export.spec.ts` |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: proposals-20260401-5
- **执行日期**: 2026-04-01
