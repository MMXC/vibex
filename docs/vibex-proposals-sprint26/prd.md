# VibeX Sprint 26 PRD

**Agent**: PM
**日期**: 2026-05-05
**项目**: vibex-proposals-sprint26
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 完成 Sprint 1-25，已交付 OnboardingModal.tsx（5步引导框架）、模板库（Sprint 23 E5）、跨 Canvas diff（Sprint 25 E2）、Dashboard 搜索过滤（Sprint 25 E4）、Teams API（Sprint 13-14）等能力。Analyst Sprint 26 审查识别出 5 个待处理项，涵盖新用户激活断点、协作版本历史、多项目管理效率、移动端适配、性能优化。

### 目标

Sprint 26 落地以下改进：
- S26-E1: Onboarding 完成跳转到画布时预填充模板内容，解决新用户激活断点
- S26-E2: 跨项目 Canvas 版本历史，支持时间线回溯与恢复
- S26-E3: Dashboard 项目批量操作（归档/删除/导出）
- S26-E4: 移动端渐进适配，Canvas 编辑器移动端只读模式
- S26-E5: 大型项目（>100 nodes）属性面板性能优化

### 成功指标

| 指标 | 目标 |
|------|------|
| E1: Onboarding 激活率 | 新用户完成 Onboarding 后 24h 回访率 > 40% |
| E2: 版本历史 | `/api/v1/projects/:id/versions` 返回 ≥ 2 条记录，支持预览和恢复 |
| E3: 批量操作 | 批量删除/归档/导出功能可用，E2E 测试覆盖 |
| E4: 移动端 | Canvas 移动端只读模式标识可见，响应式布局无溢出 |
| E5: 性能 | 节点数 100-500 项目属性面板响应 < 200ms，LCP < 2.5s |
| 全部 | `pnpm run build` → 0 errors |

---

## 2. Epic 拆分

### S26-E1: Onboarding → 画布预填充（P001）

**问题**: Sprint 25 E1 Onboarding 完成 Step 5 后跳转到空画布，用户面对空白画布无法理解下一步操作，激活率低。

**用户故事**:
> 身为新注册用户（New User），我希望在完成 Onboarding 后进入的画布已经预置了推荐模板内容，这样我能立即看到 VibeX 的价值，降低认知负担，不需要手动添加第一个节点。

#### Stories

| Story ID | 描述 | 工时 | 优先级 | 验收标准 |
|----------|------|------|--------|----------|
| S26-S1.1 | Onboarding Step 5 跳转画布前触发模板 auto-fill | 1h | P0 | 完成 Onboarding Step 5 → 跳转到 `/canvas/{projectId}` → `canvas_nodes` 表中该 projectId 有 ≥ 3 个节点 JSON |
| S26-S1.2 | 画布页面首次加载展示引导气泡 | 0.5h | P0 | `expect(page.locator('[data-testid="canvas-first-hint"]')).toBeVisible()` 可见，3s 后自动消失 |
| S26-S1.3 | 场景化模板推荐（基于 Onboarding Step 2 选择） | 1h | P1 | Step 2 选择「新功能开发」→ 跳转后画布填充「功能规格」模板节点；选择「Bug修复」→ 填充「Bug Report」模板节点 |
| S26-S1.4 | 引导气泡消失后不再重复出现（同 projectId） | 0.5h | P1 | `expect(localStorage.getItem('canvas-first-hint-dismissed')).toBe('true')` 在首次消失后被设置；刷新页面不重复显示气泡 |

**验收标准（可测试断言）**:
```
// E1-S1: 画布预填充
expect(await page.goto(`/canvas/${projectId}`)).toHaveNodes(count => count >= 3);

// E1-S2: 引导气泡显示
const hint = page.locator('[data-testid="canvas-first-hint"]');
await expect(hint).toBeVisible({ timeout: 3000 });
await page.waitForTimeout(3500);
await expect(hint).toBeHidden();

// E1-S3: 场景推荐
const nodes = await db.query(`SELECT template_type FROM canvas_nodes WHERE project_id = ?`, [projectId]);
expect(nodes.results[0].template_type).toMatch(/^(feature_spec|bug_report|api_design)$/);

// E1-S4: 气泡不再重复
await page.reload();
await expect(page.locator('[data-testid="canvas-first-hint"]')).not.toBeVisible();
```

**DoD**:
- [ ] Onboarding 完成 → 跳转画布 → 画布有 ≥ 3 个预填充节点
- [ ] 引导气泡首次可见，3s 后自动消失
- [ ] 刷新页面引导气泡不再出现
- [ ] `pnpm test:e2e` 中 Onboarding E2E 通过
- [ ] `pnpm run build` → 0 errors

---

### S26-E2: 跨项目 Canvas 版本历史（P002）

**问题**: Sprint 25 E2 的跨 Canvas diff 仅支持两个项目同一时刻对比，实际协作场景中用户需要查看同一项目的时间线历史版本。

**用户故事**:
> 身为 Canvas 项目协作者（Collaborator），我希望能够查看同一项目在不同时间点的历史快照，这样我可以在误操作后恢复内容，或审查协作过程中的变更历史。

#### Stories

| Story ID | 描述 | 工时 | 优先级 | 验收标准 |
|----------|------|------|--------|----------|
| S26-S2.1 | D1 数据库 `project_versions` 表迁移 | 1h | P0 | 迁移脚本执行成功；`SELECT * FROM project_versions WHERE project_id = ?` 返回正确字段（id, project_id, snapshot_json, created_at, created_by） |
| S26-S2.2 | Canvas 保存时自动生成版本快照（最多 50 个） | 2h | P0 | 创建项目 → 修改节点 → 保存 → `project_versions` 表新增 1 条记录；超过 50 个版本后自动删除最早的 1 条 |
| S26-S2.3 | 版本历史面板 UI（时间线 + 快照预览） | 2h | P1 | `expect(page.locator('[data-testid="version-history-panel"]')).toBeVisible()`；列表展示最近 20 个版本快照，每个含时间戳和修改者名称 |
| S26-S2.4 | 版本恢复功能（含二次确认） | 1h | P1 | 点击历史版本 → 预览画布 → 点击「恢复到该版本」→ 弹出确认弹窗 → 确认后画布内容恢复 |
| S26-S2.5 | 版本历史 API 端点 | 0.5h | P0 | `GET /api/v1/projects/:id/versions` 返回 200，body 含 `{ versions: [{ id, snapshot_json, created_at, created_by }] }` |
| S26-S2.6 | 批量删除版本历史（清理） | 0.5h | P2 | 管理员可清空指定项目的所有历史版本；`DELETE /api/v1/projects/:id/versions` 返回 200，清空后版本列表为空 |

**验收标准（可测试断言）**:
```
// E2-S1: D1 迁移
const result = await db.exec("SELECT id, project_id, snapshot_json, created_at, created_by FROM project_versions LIMIT 1");
expect(result.results.length).toBeGreaterThanOrEqual(0);

// E2-S2: 自动快照
const before = await db.query('SELECT COUNT(*) as c FROM project_versions WHERE project_id = ?', [projectId]);
await saveCanvas(projectId, { nodes: [...newNodes] });
const after = await db.query('SELECT COUNT(*) as c FROM project_versions WHERE project_id = ?', [projectId]);
expect(after.c).toBe(before.c + 1);

// E2-S3: 版本历史面板
const panel = page.locator('[data-testid="version-history-panel"]');
await expect(panel).toBeVisible();
const versions = panel.locator('[data-testid="version-history-item"]');
await expect(versions).toHaveCount(versionCount <= 20 ? versionCount : 20);

// E2-S4: 恢复确认
await page.locator('[data-testid="version-history-item"]').first().click();
await expect(page.locator('[data-testid="version-restore-confirm"]')).toBeVisible();
await page.locator('[data-testid="version-restore-confirm"] button[type="submit"]').click();
await expect(page.locator('[data-testid="version-restore-success"]')).toBeVisible();

// E2-S5: API 端点
const res = await request(app).get(`/api/v1/projects/${projectId}/versions`);
expect(res.status).toBe(200);
expect(res.body.versions).toBeInstanceOf(Array);
expect(res.body.versions[0]).toHaveProperty('id');
expect(res.body.versions[0]).toHaveProperty('snapshot_json');
expect(res.body.versions[0]).toHaveProperty('created_at');

// E2-S6: 清理 API
const clearRes = await request(app).delete(`/api/v1/projects/${projectId}/versions`);
expect(clearRes.status).toBe(200);
const listRes = await request(app).get(`/api/v1/projects/${projectId}/versions`);
expect(listRes.body.versions).toHaveLength(0);
```

**DoD**:
- [ ] D1 `project_versions` 表迁移成功
- [ ] Canvas 保存自动生成快照，超过 50 个版本自动清理最旧版本
- [ ] 版本历史面板展示最近 20 个版本
- [ ] 可预览历史快照并恢复到任意版本（含二次确认）
- [ ] API 端点 `/api/v1/projects/:id/versions` 返回正确格式
- [ ] `pnpm run build` → 0 errors

---

### S26-E3: Dashboard 项目批量操作（P003）

**问题**: Sprint 25 E4 交付了 Dashboard 搜索过滤，但多项目管理（>20个项目）时无法批量操作，只能逐个处理。

**用户故事**:
> 身为项目管理员（Project Admin），我希望能够批量选择多个项目进行归档/删除/导出操作，这样在管理大量历史项目时可以提高效率，避免逐个操作的重复劳动。

#### Stories

| Story ID | 描述 | 工时 | 优先级 | 验收标准 |
|----------|------|------|--------|----------|
| S26-S3.1 | Dashboard 项目卡片增加 checkbox 多选 | 1h | P0 | 每个项目卡片有 checkbox `data-testid="project-checkbox-{id}"`；选中状态 `expect(checkbox).toBeChecked()` |
| S26-S3.2 | 底部批量操作栏（归档/删除/导出） | 1h | P0 | 选择 ≥ 1 个项目后，底部显示 `data-testid="bulk-action-bar"`；含归档、删除、导出 JSON 三个按钮 |
| S26-S3.3 | 批量删除二次确认弹窗 | 0.5h | P0 | 点击批量删除 → 弹出确认弹窗，显示将被删除的项目数量；确认后删除成功 |
| S26-S3.4 | 批量导出 JSON（含所有选中项目元数据） | 0.5h | P1 | 点击导出 → 下载包含所有选中项目元数据的 JSON 文件；JSON 格式 `[{ id, name, created_at, updated_at }]` |
| S26-S3.5 | 全选/取消全选快捷操作 | 0.5h | P2 | 列表顶部有全选 checkbox；点击全选后所有卡片被选中；批量操作栏显示已选项目数量 |

**验收标准（可测试断言）**:
```
// E3-S1: 多选 checkbox
const checkboxes = page.locator('[data-testid^="project-checkbox-"]');
await expect(checkboxes.first()).toBeVisible();
await checkboxes.nth(0).check();
await expect(checkboxes.nth(0)).toBeChecked();

// E3-S2: 批量操作栏
await checkboxes.nth(0).check();
const actionBar = page.locator('[data-testid="bulk-action-bar"]');
await expect(actionBar).toBeVisible();
await expect(actionBar.locator('button:has-text("归档")')).toBeVisible();
await expect(actionBar.locator('button:has-text("删除")')).toBeVisible();
await expect(actionBar.locator('button:has-text("导出")')).toBeVisible();

// E3-S3: 批量删除确认
await actionBar.locator('button:has-text("删除")').click();
const confirmModal = page.locator('[data-testid="bulk-delete-confirm"]');
await expect(confirmModal).toBeVisible();
await expect(confirmModal.locator('text=/\\d+ 个项目/')).toBeVisible();
await confirmModal.locator('button[type="submit"]').click();
await expect(page.locator('[data-testid="bulk-delete-success"]')).toBeVisible();

// E3-S4: 批量导出
await checkboxes.nth(0).check();
await checkboxes.nth(1).check();
const downloadPromise = page.waitForEvent('download');
await actionBar.locator('button:has-text("导出")').click();
const download = await downloadPromise;
const json = JSON.parse(await download.path().then(p => readFileSync(p, 'utf8')));
expect(json).toHaveLength(2);
expect(json[0]).toHaveProperty('id');
expect(json[0]).toHaveProperty('name');
```

**DoD**:
- [ ] 项目卡片 checkbox 多选可用
- [ ] 批量操作栏显示归档/删除/导出
- [ ] 批量删除有二次确认弹窗
- [ ] 批量导出生成正确格式的 JSON 文件
- [ ] `pnpm test:e2e` 批量操作 E2E 通过
- [ ] `pnpm run build` → 0 errors

---

### S26-E4: 移动端渐进适配（P004）

**问题**: VibeX Canvas 编辑器从未做过移动端适配，在手机（<768px）和平板（768-1024px）上显示为桌面压缩版，无法正常使用。

**用户故事**:
> 身为移动端用户（Mobile User），我希望在使用手机或平板访问 VibeX 时能看到适合小屏幕的布局和明确的功能提示，这样我至少可以浏览我的项目内容而不必切换到电脑。

#### Stories

| Story ID | 描述 | 工时 | 优先级 | 验收标准 |
|----------|------|------|--------|----------|
| S26-S4.1 | 响应式 CSS 断点（<768px / 768-1024px） | 2h | P1 | 视口宽度 < 768px：导航栏变为汉堡菜单，侧边栏收起；视口宽度 768-1024px：侧边栏可折叠，工具栏自适应 |
| S26-S4.2 | Canvas 移动端只读模式 | 1h | P1 | 移动端（<768px）Canvas 编辑器显示只读状态，`expect(page.locator('[data-testid="canvas-readonly-mode"]')).toBeVisible()` |
| S26-S4.3 | 移动端写保护提示 banner | 0.5h | P1 | 移动端 Canvas 顶部显示 `data-testid="mobile-write-disabled-banner"`，文字包含「桌面端编辑」 |
| S26-S4.4 | 移动端 E2E 测试覆盖 | 1h | P1 | `pnpm test:e2e --project=mobile` 在 375px / 768px 两个视口下均通过 |
| S26-S4.5 | viewport meta 标签优化 | 0.5h | P2 | `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`；确保 Playwright mobile emulation 测试环境与真机一致 |

**验收标准（可测试断言）**:
```
// E4-S1: 响应式断点 (< 768px)
await page.setViewportSize({ width: 375, height: 812 });
await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
await expect(page.locator('[data-testid="sidebar"]')).toBeHidden();

// E4-S2: 平板布局 (768-1024px)
await page.setViewportSize({ width: 768, height: 1024 });
const sidebar = page.locator('[data-testid="sidebar"]');
await expect(sidebar).toBeVisible();
// 侧边栏可折叠
await page.locator('[data-testid="sidebar-collapse"]').click();
await expect(sidebar).toBeHidden();

// E4-S3: 只读模式
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`/canvas/${projectId}`);
await expect(page.locator('[data-testid="canvas-readonly-mode"]')).toBeVisible();
await expect(page.locator('[data-testid="mobile-write-disabled-banner"]')).toBeVisible();
await expect(page.locator('button:has-text("编辑")')).not.toBeVisible();

// E4-S4: 移动端 E2E
// 在 playwright.config.ts 中配置 mobile 项目：
// viewport: { width: 375, height: 812 }
// viewport: { width: 768, height: 1024 }
// E2E 测试通过率 100%
```

**DoD**:
- [ ] <768px 响应式布局可用（汉堡菜单、侧边栏收起）
- [ ] 768-1024px 平板布局可用（侧边栏可折叠）
- [ ] Canvas 移动端只读模式标识可见
- [ ] 移动端写保护 banner 文字正确
- [ ] Playwright 移动端 E2E 测试在 375px / 768px 视口通过
- [ ] `pnpm run build` → 0 errors

---

### S26-E5: 大型项目属性面板性能优化（P005）

**问题**: 当 Canvas 项目节点数 > 100 时，属性面板 React re-render 风暴导致交互卡顿，用户操作延迟明显。

**用户故事**:
> 身为大型 API 规格项目所有者（Large Project Owner），我希望在使用超过 100 个节点的项目时，属性面板依然保持流畅响应，这样我可以高效管理复杂的项目结构而不需要等待页面渲染。

#### Stories

| Story ID | 描述 | 工时 | 优先级 | 验收标准 |
|----------|------|------|--------|----------|
| S26-S5.1 | 属性面板引入 `react-window` 虚拟化列表 | 2h | P0 | 安装 `react-window`；属性面板列表 DOM 节点数 < 500（即使节点数据 > 100 个） |
| S26-S5.2 | 属性面板组件 `React.memo` + `useMemo` 优化 | 1h | P0 | `ChapterPanel.tsx` 和 `PropertyPanel.tsx` 使用 memo；`expect(memoizedComponent.type.toString()).toBe('React.memo(...)')` |
| S26-S5.3 | 大型项目（> 200 nodes）加载进度指示器 | 0.5h | P1 | 加载 > 200 nodes 项目时，显示 `data-testid="loading-progress"`；进度条实时反映加载百分比 |
| S26-S5.4 | Lighthouse 性能指标验证 | 1h | P1 | Lighthouse 移动端审计：LCP < 2.5s，Fid < 100ms，CLS < 0.1；节点数 100-500 项目属性面板交互响应 < 200ms |
| S26-S5.5 | 性能预算 CI 集成 | 1h | P2 | `pnpm run perf-budget` 在 CI 中运行；节点数 > 200 项目的 TTI 超出预算时 CI 失败 |

**验收标准（可测试断言）**:
```
// E5-S1: 虚拟化列表
const domNodes = await page.evaluate(() => document.querySelectorAll('.property-panel-list > *').length);
expect(domNodes).toBeLessThan(500);

// E5-S2: React.memo 验证
const isMemoized = await page.evaluate(() => {
  // ChapterPanel 和 PropertyPanel 被 React.memo 包装
  const panel = document.querySelector('[data-testid="chapter-panel"]');
  return panel !== null;
});
expect(isMemoized).toBe(true);

// E5-S3: 进度指示器
await page.goto(`/canvas/${largeProjectId}`); // > 200 nodes
const progress = page.locator('[data-testid="loading-progress"]');
await expect(progress).toBeVisible({ timeout: 5000 });
await page.waitForURL(url => !url.includes('loading'), { timeout: 15000 });
await expect(progress).not.toBeVisible();

// E5-S4: 性能指标
// Lighthouse CLI:
// lighthouse http://localhost:3000/canvas/${projectId} --preset=mobile --quiet --output=json | jq '.audits["largest-contentful-paint"].numericValue'
// expect lcp < 2500
// Interaction timing:
// const start = Date.now();
// await page.locator('[data-testid="chapter-item"]').first().click();
// expect(Date.now() - start).toBeLessThan(200);

// E5-S5: 性能预算 CI
// pnpm run perf-budget
// exit code 0 = 通过，exit code 1 = 超预算
```

**DoD**:
- [ ] `react-window` 集成后属性面板 DOM 节点数 < 500
- [ ] `ChapterPanel` 和 `PropertyPanel` 使用 memo 包装
- [ ] > 200 nodes 项目加载时显示进度指示器
- [ ] Lighthouse 移动端性能指标达标（LCP < 2.5s）
- [ ] `pnpm test:e2e` 大型项目 E2E 通过
- [ ] `pnpm run build` → 0 errors

---

## 3. 优先级矩阵

### RICE 评分

| Epic | Reach（触达） | Impact（影响） | Confidence（信心） | Effort（工时） | RICE | 优先级 |
|------|-------------|--------------|-----------------|--------------|------|--------|
| S26-E1 Onboarding 画布预填充 | 100 新用户/月 | 3（高） | 90% | 3h | 9000 | P0 |
| S26-E2 版本历史 | 50 协作用户/月 | 3（高） | 80% | 6.5h | 1846 | P0 |
| S26-E3 Dashboard 批量操作 | 30 管理员/月 | 2（中） | 95% | 3h | 1900 | P1 |
| S26-E5 性能优化 | 20 大型项目/月 | 3（高） | 85% | 4.5h | 755 | P1 |
| S26-E4 移动端适配 | 60 移动用户/月 | 1（低） | 90% | 4h | 1350 | P1 |

### MoSCoW 分类

| 类别 | Epic | 说明 |
|------|------|------|
| Must | S26-E1, S26-E2 | 激活率和协作核心功能 |
| Should | S26-E3, S26-E5 | 效率提升和体验保障 |
| Could | S26-E4 | 移动端体验 |

---

## 4. 依赖关系图

```
S26-E1 (Onboarding 预填充)
├── 前置依赖: Sprint 25 E1 Onboarding 模板 auto-fill（已完成）
└── 依赖文件: OnboardingModal.tsx, canvasNodesStore.ts, 模板库 API

S26-E2 (版本历史)
├── 前置依赖: Sprint 25 E2 跨 Canvas diff（已完成）
├── 需要: D1 数据库写权限
└── 依赖文件: D1 schema, /api/v1/projects/:id/versions API, canvas-diff/

S26-E3 (Dashboard 批量操作)
├── 前置依赖: Sprint 25 E4 Dashboard 搜索过滤（已完成）
└── 依赖文件: dashboard/page.tsx, DashboardCard.tsx

S26-E4 (移动端适配)
├── 前置依赖: 无
└── 依赖文件: 所有 *.module.css, CanvasEditor.tsx

S26-E5 (性能优化)
├── 前置依赖: 无（独立优化）
└── 依赖文件: ChapterPanel.tsx, PropertyPanel.tsx, package.json

跨 Epic 依赖:
- S26-E2 依赖 D1 数据库迁移 → 需要 DevOps 权限
- S26-E5 的性能测试结果 → S26-E4 移动端 E2E 通过前提
```

---

## 5. 验收标准汇总

| Epic | 核心验收标准 | 测试方式 |
|------|------------|---------|
| E1 | 画布预填充 ≥ 3 节点；引导气泡 3s 后消失；刷新不重复 | E2E + API |
| E2 | 版本历史 API 返回正确格式；可预览和恢复；超过 50 个版本自动清理 | API + E2E |
| E3 | 多选 checkbox；批量操作栏显示；删除二次确认；导出 JSON 格式正确 | E2E |
| E4 | <768px 响应式布局；只读模式标识；移动端写保护 banner；E2E 通过 | E2E (mobile) |
| E5 | DOM 节点 < 500；memo 包装；进度指示器；LCP < 2.5s | E2E + Lighthouse |

---

## 6. Definition of Done

### 每个 Epic 的 DoD
- [ ] 所有 Story 验收标准 100% 通过
- [ ] `pnpm run build` → 0 errors
- [ ] `pnpm test:e2e` → 全通过（含移动端视口）
- [ ] `pnpm test:api` → 全通过（版本历史 API）
- [ ] 相关文件变更已记录在 CHANGELOG

### Sprint 26 总 DoD
- [ ] 5 个 Epic 全部完成
- [ ] PRD 文档已更新，标注最终状态为 Released
- [ ] 产品功能演示视频（loom/gif）已录制
- [ ] 下一 Sprint backlog 已初步梳理

---

## 7. 页面集成标注

| 页面 | 涉及 Epic | 路由 | data-testid 前缀 |
|------|---------|------|-----------------|
| Onboarding 模态框 | E1 | 全局覆盖层 | `onboarding-*` |
| Canvas 编辑器 | E1, E2, E4, E5 | `/canvas/{id}` | `canvas-*` |
| Dashboard | E3 | `/dashboard` | `project-*`, `bulk-*` |
| 版本历史面板 | E2 | Canvas 内嵌面板 | `version-*` |
| 移动端视图 | E4 | 所有页面 | `mobile-*` |
| 属性面板 | E5 | Canvas 内嵌面板 | `chapter-panel`, `property-*` |

---

## 8. 技术债务

| 债务项 | 来源 Sprint | 风险 | 建议处理 |
|--------|-----------|------|---------|
| `ChapterPanel.tsx` 无 memo | Sprint 4 | 性能恶化 | Sprint 26 E5 解决 |
| 无移动端测试覆盖 | Sprint 1 | 用户体验 | Sprint 26 E4 解决 |
| D1 无 `project_versions` 表 | Sprint 25 | 功能缺失 | Sprint 26 E2 解决 |
| Canvas 无版本快照 | Sprint 25 | 协作受限 | Sprint 26 E2 解决 |
| Dashboard 无多选状态 | Sprint 25 | 效率低下 | Sprint 26 E3 解决 |

---

*PM Agent | VibeX Sprint 26 PRD | 2026-05-05*
