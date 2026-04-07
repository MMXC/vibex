# AGENTS.md: proposals-20260401-5

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 角色约束总览

| Agent | Epic | 工时 | 约束数量 |
|-------|------|------|----------|
| dev-e1 | E1 | 3h | 4 |
| dev-e2 | E2 | 2h | 3 |
| dev-e3 | E3 | 2h | 4 |
| tester | 全部 | — | 3 |
| reviewer | 全部 | — | 3 |

---

## Dev E1: DDD 命名规范 + Tab 快捷键（3h）

**约束**:

1. **DDD 命名文档必须包含允许模式和禁止模式**
   - 允许模式 ≥ 5 个，含业务场景说明
   - 禁止模式 ≥ 5 个，含原因说明
   - 必须包含判断流程（3 步清单）
   - 必须包含 `@updated` 和 `@owner` 元数据

2. **Alt+1/2/3 快捷键必须调用 `preventDefault()`**
   - `e.preventDefault()` 必须在检测到 `e.altKey` 之后立即调用
   - 不能在条件外层调用（会阻止所有 Alt 组合键）
   - 正确顺序：`if (e.altKey) { e.preventDefault(); ... }`

3. **快捷键绑定必须在 CanvasPage useEffect 中管理**
   - 使用 `useEffect` + cleanup 函数（removeEventListener）
   - 依赖数组必须包含 `dispatch`
   - 不能在组件外部注册全局监听（避免内存泄漏）

4. **ShortcutHintPanel 必须同步更新**
   - 添加 Alt+1 → Context、Alt+2 → Flow、Alt+3 → Component 说明
   - 与其他快捷键（Ctrl+K、N、?）保持一致格式

**验收清单**:
- [ ] `docs/ddd-naming-convention.md` 存在且格式正确
- [ ] `src/pages/CanvasPage.tsx` 包含 `altKey` 和 `preventDefault`
- [ ] Playwright E2E `e2e/shortcuts.spec.ts` 全部通过

---

## Dev E2: v0 监控 + Domain CI（2h）

**约束**:

1. **v0-updates.md 必须使用标准格式**
   - 文件路径: `docs/competitive/v0-updates.md`
   - 必须包含更新日志表格（日期、功能、链接、影响、状态）
   - 必须包含周会回顾记录表格
   - 必须包含 `@updated` 和 `@owner` 元数据

2. **CI workflow 必须配置 schedule（不能仅 workflow_dispatch）**
   - `on.schedule` cron 必须配置为 `'0 0 * * 0'`（每周日 00:00 UTC）
   - 同时保留 `workflow_dispatch` 手动触发
   - 必须使用 `actions/checkout@v4`

3. **Domain CI 必须处理时间戳缺失情况**
   - 如果 `@updated` 不存在或格式错误，CI 必须 `exit 1`（失败）
   - 如果超过 30 天，输出 `::warning::` 而非 `error`
   - 30 天阈值硬编码为常量，不可配置

**验收清单**:
- [ ] `docs/competitive/v0-updates.md` 存在且格式完整
- [ ] `.github/workflows/domain-check.yml` 存在且 schedule 配置正确
- [ ] `gh workflow run domain-check --dry-run` 执行成功

---

## Dev E3: PNG/SVG 批量导出（2h）

**约束**:

1. **PNG 导出必须保留节点质量**
   - 使用 `canvas.toDataURL('image/png', 1.0)`（不可降低质量）
   - 不能使用 `toBlob` 有损压缩参数
   - 导出后图片尺寸应与画布一致

2. **批量 zip 导出必须包含所有节点**
   - 遍历 `store.getState().canvas.nodes` 获取完整列表
   - zip 文件数量必须等于节点数量（E2E 断言验证）
   - 文件命名使用 `${node.name}.${format}`（含节点名）

3. **导出面板不能破坏现有功能**
   - React/Vue/Svelte 选项必须保留
   - PNG/SVG 选项与框架选项并行排列
   - 导出全部按钮独立于格式选择

4. **导出为同步操作时需处理大画布**
   - 如果画布节点 > 50，考虑显示进度条
   - 导出过程中按钮应 disable，防止重复触发

**验收清单**:
- [ ] `ExportPanel` 包含 PNG 和 SVG 选项
- [ ] Playwright E2E `e2e/export.spec.ts --grep "zip"` 全部通过
- [ ] zip 解压后文件数量等于节点数量

---

## Tester: 全局测试约束（3 项）

**约束**:

1. **E1 快捷键测试必须覆盖 negative case**
   - 仅按 `1`、`2`、`3`（不带 Alt）不应触发切换
   - 同时按 `Alt+F4` 等其他 Alt 组合键不应触发

2. **E2 CI 测试必须在隔离环境验证**
   - 不依赖外部网络（v0-updates.md 存在性用 `test -f`）
   - YAML 语法用 `python3 -c "import yaml"` 验证
   - 手动触发用 `--dry-run` 模式

3. **E3 导出测试必须处理下载异步**
   - `waitForEvent('download')` 必须包裹在 `Promise.all` 中
   - zip 验证用 JSZip 在测试进程中读取文件
   - PNG 质量验证用文件大小下限（≥ 1KB）而非精确比较

---

## Reviewer: 代码审查约束（3 项）

**约束**:

1. **E1 快捷键实现必须符合可访问性规范**
   - 检查 `e.altKey` 判断在 `e.key` 之前（短路求值）
   - 检查 `preventDefault()` 不在顶层 if 外调用
   - 检查 useEffect cleanup 正确移除监听器

2. **E2 CI workflow 必须使用安全实践**
   - 检查 `actions/checkout@v4`（不是 v2/v3）
   - 检查无硬编码敏感信息
   - 检查 cron 表达式格式正确

3. **E3 导出代码必须处理错误边界**
   - `canvas.toDataURL()` 需 try-catch（画布跨域问题）
   - `XMLSerializer` 需 try-catch（DOM 结构问题）
   - `JSZip.generateAsync` 需处理内存溢出（超大画布）

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: proposals-20260401-5
- **执行日期**: 2026-04-01
