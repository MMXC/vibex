# VibeX Sprint 30 — PRD（产品需求文档）

**Agent**: pm
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint30
**仓库**: /root/.openclaw/vibex
**状态**: Draft

---

## 1. 执行摘要

### 背景

Sprint 1-29 已完成核心原型编辑能力。当前三个关键问题：
1. **预览割裂**：ProtoPreview 与组件树无联动，每次手动刷新浪费 3-5 秒
2. **数据风险**：localStorage 无跨设备同步，关闭浏览器 = 数据丢失
3. **质量盲区**：ShareBadge/通知系统 0 E2E 测试覆盖，每次改动盲改

### 目标

在 Sprint 30 完成以下交付：
- 组件树选中 → ProtoPreview 实时热更新（无手动刷新）
- 项目导出为 .vibex 文件 + 导入恢复完整数据
- ShareBadge + ShareToTeamModal E2E 测试全覆盖
- Sprint 28-29 Spec 补全（E04-template-crud + S29-E01-notification）
- Presence 层增强（视 Firebase RTDB 就绪状态选方案）

### 成功指标

| 指标 | 目标 |
|------|------|
| ProtoPreview 热更新延迟 | ≤ 200ms |
| 项目导出文件格式校验 | valid JSON + schema v1.0 |
| E2E 测试新增覆盖 | ShareBadge + ShareToTeamModal 覆盖率 100% |
| CI E2E 卡口 | e2e:ci exit non-zero → PR blocked |
| Spec 补全 | E04 + S29-E01 可 test -f 验证存在 |
| Presence 降级 | Firebase 未配置不影响 Canvas 正常编辑 |

---

## 2. Epic 拆分

| Epic ID | Epic 名称 | Stories | 工时 | 依赖 |
|---------|-----------|---------|------|------|
| E01 | ProtoPreview 实时联动 | S01, S02 | 8h | 无 |
| E02 | 项目导入/导出 | S03, S04, S05 | 10h | 无 |
| E03 | E2E 测试补全 | S06, S07 | 12h | 无 |
| E04 | Spec 补全 | S08, S09 | 4h | 无 |
| E05 | Presence 层增强 | S10, S11 | 4-10h | P005 阻塞于 Firebase RTDB |

**总工期**: 38h（不含 P005 方案 A）/ 44h（含 P005 方案 A）

---

### Epic E01: ProtoPreview 实时联动

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S01 | ProtoPreview 实时预览 | 选中组件节点 → ProtoPreview 200ms 内渲染 | 5h | 见 S01 验收标准 |
| S02 | Props 热更新 | 修改 props → ProtoPreview 无白屏热更新 | 3h | 见 S02 验收标准 |

### Epic E02: 项目导入/导出

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S03 | 项目导出 API + UI | GET /api/projects/:id/export → .vibex 文件下载 | 5h | 见 S03 验收标准 |
| S04 | 项目导入 API + UI | POST /api/projects/import → Dashboard 重建项目 | 3h | 见 S04 验收标准 |
| S05 | 导入文件校验 | 导入时校验 .vibex 格式，非法时显示错误提示 | 2h | 见 S05 验收标准 |

### Epic E03: E2E 测试补全

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S06 | ShareBadge E2E 测试 | 通知新增 → badge 数字 +N，E2E 可验证 | 6h | 见 S06 验收标准 |
| S07 | ShareToTeamModal E2E 测试 + CI 卡口 | 分享成功 toast + CI e2e 失败阻断 PR | 6h | 见 S07 验收标准 |

### Epic E04: Spec 补全

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S08 | E04-template-crud spec | API 字段定义 + 错误码矩阵 | 2h | 见 S08 验收标准 |
| S09 | S29-E01-notification spec | 通知触发时机 + 降级策略 | 2h | 见 S09 验收标准 |

### Epic E05: Presence 层增强

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S10 | Firebase RTDB 状态验证 | 子任务：确认 useRealtimeSync.ts 就绪 | 1h | 见 S10 验收标准 |
| S11 | Presence UI 增强 | RTDB 就绪 → 方案 A；未就绪 → 方案 B | 3-9h | 见 S11 验收标准 |

---

## 3. 验收标准（expect() 断言）

### S01: ProtoPreview 实时预览

```
// 选中组件节点，ProtoPreview 在 200ms 内渲染对应组件
expect(screen.getByTestId('proto-preview')).toBeVisible();
expect(screen.getByTestId('proto-preview-node').textContent).toBe('ComponentName');

// 延迟实测
const start = Date.now();
userEvent.click(screen.getByRole('treeitem', { name: /ComponentName/i }));
await waitFor(() => {
  expect(screen.getByTestId('proto-preview-node')).toBeVisible();
}, { timeout: 300 });
expect(Date.now() - start).toBeLessThan(200);

// 未选中时显示空白占位符
expect(screen.getByTestId('proto-preview-placeholder')).toBeVisible();
expect(screen.queryByTestId('proto-preview-node')).not.toBeInTheDocument();
```

### S02: Props 热更新

```
// 修改 props，预览面板热更新无白屏/重排
const preview = screen.getByTestId('proto-preview');
await userEvent.click(screen.getByRole('button', { name: /edit props/i }));
await userEvent.clear(screen.getByLabelText(/prop-value/i));
await userEvent.type(screen.getByLabelText(/prop-value/i), 'newValue');

// 防抖：200ms 内预览更新，无 DOM 重挂
await waitFor(() => {
  expect(screen.getByTestId('proto-preview-node')).toHaveAttribute('data-prop-value', 'newValue');
}, { timeout: 400 });

// 验证组件未卸载重挂（无白屏）
expect(screen.getByTestId('proto-preview').dataset.rebuild).toBe('false');
```

### S03: 项目导出

```
// API 导出返回有效 JSON
const res = await request(app).get('/api/projects/proj_001/export');
expect(res.status).toBe(200);
expect(res.headers['content-type']).toContain('application/json');
const body = res.body;
expect(body.version).toBe('1.0');
expect(body.project).toBeDefined();
expect(body.trees).toBeDefined();
expect(body.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

// Dashboard 导出按钮触发下载
const downloadPromise = waitForDownload();
await userEvent.click(screen.getByRole('button', { name: /export/i }));
const file = await downloadPromise();
expect(file.suggestedFilename()).toMatch(/\.vibex$/);
const content = JSON.parse(await file.text());
expect(content.version).toBe('1.0');
```

### S04: 项目导入

```
// API 导入成功
const res = await request(app)
  .post('/api/projects/import')
  .attach('file', Buffer.from(JSON.stringify(validPayload), 'utf-8'), 'test.vibex');
expect(res.status).toBe(201);
expect(res.body.id).toBeDefined();

// Dashboard 导入 Modal：拖拽 → 项目出现
await userEvent.upload(
  screen.getByTestId('import-dropzone'),
  new File([JSON.stringify(validPayload)], 'test.vibex', { type: 'application/json' })
);
await waitFor(() => {
  expect(screen.getByText('test-project')).toBeVisible();
});

// 端到端：导出 → 删除 → 导入 → 数据完整恢复
const exported = await exportProject('proj_001');
await deleteProject('proj_001');
await importProject(exported);
const restored = await getProject('proj_001');
expect(restored.trees).toEqual(exported.trees);
```

### S05: 导入文件校验

```
// 无效 JSON → 422 + 错误信息
const res = await request(app)
  .post('/api/projects/import')
  .attach('file', Buffer.from('not valid json', 'utf-8'), 'bad.vibex');
expect(res.status).toBe(422);
expect(res.body.error.code).toBe('INVALID_JSON');

// 缺少 version 字段 → 422 + INVALID_VERSION
const res2 = await request(app)
  .post('/api/projects/import')
  .attach('file', Buffer.from(JSON.stringify({ project: {} }), 'utf-8'), 'noversion.vibex');
expect(res2.status).toBe(422);
expect(res2.body.error.code).toBe('INVALID_VERSION');

// Dashboard 错误提示显示
await userEvent.upload(screen.getByTestId('import-dropzone'), invalidFile);
expect(screen.getByText(/文件格式错误/i)).toBeVisible();
```

### S06: ShareBadge E2E 测试

```
// 新增通知 → badge 数字 +N
await page.goto('/dashboard');
const badgeBefore = await page.getByTestId('share-badge').textContent();
await userEvent.click(page.getByRole('button', { name: /share/i }));
await page.getByLabelText(/team member/i).fill('alice@example.com');
await page.getByRole('button', { name: /send/i }).click();
await page.waitForResponse(/api\/notifications/);
await expect(page.getByTestId('share-badge')).toHaveText(String(parseInt(badgeBefore || '0') + 1));

// 无通知时 badge 隐藏
await expect(page.getByTestId('share-badge')).not.toBeVisible();
```

### S07: ShareToTeamModal + CI 卡口

```
// 分享成功 → toast 提示
await userEvent.click(page.getByRole('button', { name: /share to team/i }));
await page.getByLabelText(/select team/i }).selectOption('team_001');
await page.getByRole('button', { name: /confirm/i }).click();
await expect(page.getByRole('status')).toHaveText(/已通知 \d 人/);

// CI: e2e:ci exit non-zero → PR blocked
const ciResult = await github.actions.getWorkflowRun({ run_id: prRunId });
expect(ciResult.conclusion).toBe('failure');
```

### S08: E04-template-crud spec

```
// 文件存在
expect(fs.existsSync('docs/vibex-proposals-sprint28/specs/E04-template-crud.md')).toBe(true);

// 包含必要章节
const content = fs.readFileSync('docs/vibex-proposals-sprint28/specs/E04-template-crud.md', 'utf-8');
expect(content).toMatch(/API.*端点|endpoint/i);
expect(content).toMatch(/错误码|error.*code/i);
expect(content).toMatch(/字段.*定义|field.*definition/i);
```

### S09: S29-E01-notification spec

```
// 文件存在
expect(fs.existsSync('docs/vibex-proposals-sprint29/specs/E01-notification.md')).toBe(true);

// 包含必要章节
const content = fs.readFileSync('docs/vibex-proposals-sprint29/specs/E01-notification.md', 'utf-8');
expect(content).toMatch(/触发时机|trigger/i);
expect(content).toMatch(/降级|fallback|degradation/i);
```

### S10: Firebase RTDB 状态验证（子任务）

```
// 验证 useRealtimeSync.ts 存在且非空
const hookPath = 'src/hooks/useRealtimeSync.ts';
expect(fs.existsSync(hookPath)).toBe(true);
const content = fs.readFileSync(hookPath, 'utf-8');
expect(content).not.toMatch(/no-op|TODO|FIXME/);
```

### S11: Presence UI 增强

```
// 方案 B（RTDB 未就绪）：仅 UI mock，不影响 Canvas
await page.goto('/canvas');
const canvas = page.getByTestId('canvas-container');
await expect(canvas).toBeVisible();

// Firebase 未配置时静默降级
await page.goto('/canvas');
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.waitForTimeout(1000);
expect(errors.filter(e => e.includes('Firebase') || e.includes('RTDB'))).toHaveLength(0);
```

---

## 4. DoD (Definition of Done)

### 研发完成判断标准

1. **代码完成**
   - [ ] 所有 Story 的 expect() 测试用例通过
   - [ ] `npm run test` 全绿（含 Vitest unit + E2E）
   - [ ] `npm run lint` 无 error

2. **API 规范**
   - [ ] Export API: `GET /api/projects/:id/export` → 200 + valid v1.0 JSON
   - [ ] Import API: `POST /api/projects/import` → 201 或 422（含错误码）
   - [ ] 错误码覆盖: 400/403/404/422/500

3. **前端集成**
   - [ ] S01/S02: ProtoFlowCanvas.tsx 已集成 ProtoPreview 联动
   - [ ] S03/S04/S05: Dashboard 已集成导出按钮 + 导入 Modal
   - [ ] S11: Presence 层降级策略已验证

4. **测试覆盖**
   - [ ] S06/S07: `tests/e2e/share-notification.spec.ts` 存在且通过
   - [ ] S07: `.github/workflows/` CI 配置 `test:e2e:ci` exit non-zero → PR blocked

5. **文档**
   - [ ] S08: `specs/E04-template-crud.md` 包含 API 字段 + 错误码矩阵
   - [ ] S09: `specs/E01-notification.md` 包含触发时机 + 降级策略
   - [ ] `test -f specs/*.md` 全通过

6. **性能**
   - [ ] S01: ProtoPreview 热更新实测 ≤ 200ms（p95）
   - [ ] S02: props 修改后无组件卸载重挂（DOM rebuild = false）

---

## 5. 依赖关系图

```
P001 (E01-S01/S02)
  └─ ProtoFlowCanvas.tsx 修改
  └─ componentStore subscription（已有，无需新增依赖）

P002 (E02-S03/S04/S05)
  └─ Backend: /api/projects/export + /api/projects/import
  └─ Frontend: Dashboard 导出按钮 + 导入 Modal
  └─ E03-S06/S07 测试验证

P003 (E03-S06/S07)
  └─ ShareBadge + ShareToTeamModal 组件（已有代码）
  └─ Playwright E2E 测试文件
  └─ CI workflow 修改

P004 (E04-S08/S09)
  └─ 无下游依赖

P005 (E05-S10/S11)
  ├─ S10 子任务验证 Firebase RTDB 状态
  │   └─ RTDB 就绪 → S11 方案 A（Firebase presence）
  │   └─ RTDB 未就绪 → S11 方案 B（仅 UI mock）
  └─ 无阻塞 Canvas 编辑
```

---

## 6. 风险与缓解

| ID | 风险 | 可能性 | 影响 | 缓解 |
|----|------|--------|------|------|
| P001-R1 | 热更新导致 ProtoFlowCanvas 性能下降 | 低 | 中 | 200ms debounce + React.memo |
| P002-R1 | 导出大文件（>5MB）超时 | 中 | 低 | 流式下载 + 进度提示 |
| P003-R1 | E2E 测试 flaky | 中 | 中 | playwright retry 配置 |
| P005-R1 | Firebase RTDB 未落地，P005 整体阻塞 | 高 | 高 | S10 子任务先验证；方案 B 兜底 |

---

## 7. 修订历史

| 版本 | 日期 | 修改人 | 说明 |
|------|------|--------|------|
| 0.1 | 2026-05-07 | pm | 初始版本，基于 analyst analysis.md |
