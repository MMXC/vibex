# S80 QA Implementation Partition — Sprint80 产出物验证执行计划

## 项目类型
**QA 验证项目** — 不做代码实现，执行黑盒/白盒验证。

---

## Phase1 完成状态

| Stage | Status | Output |
|-------|--------|--------|
| analyze-requirements | ✅ done | `docs/vibex-proposals-sprint80-qa/analysis.md` |
| create-prd | ✅ done | `docs/vibex-proposals-sprint80-qa/prd.md` |
| design-architecture | ✅ done | `docs/vibex-proposals-sprint80-qa/architecture.md` |
| coord-decision | pending | — |

---

## 验证执行计划

### E1: 通知偏好设置管理面板

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run notificationStore.preferences.test.ts --reporter=verbose
```

**手动验证项**:
1. 打开 DDSToolbar → 点击铃铛 → 查看 NotificationPanel
2. 在 NotificationPanel 中点击设置入口 → NotificationPreferencesPanel 打开
3. 开关各频道开关 → 刷新页面 → 验证持久化
4. 点击重置 → 验证恢复默认值

**阻塞条件**: vitest 任意失败 或 手动验证 3+ 项失败

---

### E2: 模板分类/标签过滤测试

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run templateStore.category.test.ts --reporter=verbose
npx vitest run CategoryFilter --reporter=verbose
```

**期望结果**: 19/19 + CategoryFilter 相关测试全通过

**阻塞条件**: 任意测试失败

---

### E3: Merge History Enrichment

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run canvasHistoryStore.e3-merge-history.test.ts --reporter=verbose
```

**手动验证项**:
1. 打开 MergeHistoryPanel → 查看 Timeline 渲染
2. 点击 Timeline Item → 展开详情，验证 mergedNodeIds/conflictCount/authorIds 显示
3. conflictCount > 0 时验证 ⚠️ 徽章显示
4. 测试 Markdown 导出 → 验证输出包含 enriched fields

**阻塞条件**: vitest 失败 或 手动验证 2+ 项失败

---

### E4: 画布设置中心

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run SettingsModal.test.tsx --reporter=verbose
```

**手动验证项**:
1. 点击 DDSToolbar ⚙️ 按钮 → SettingsModal 打开
2. 切换 4 个 Tab → 验证各 Tab 内容渲染
3. 在 Tab1 修改设置 → 切换 Tab2 → 切回 Tab1 → 验证 Tab1 值保持
4. 刷新页面 → 验证 lastOpenedTab 保持

**阻塞条件**: vitest 失败 或 Tab 切换状态泄漏

---

### E5: 协作者在线状态指示器

**验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run presenceStore.e5.test.ts --reporter=verbose
npx vitest run OnlinePresenceIndicator.test.tsx --reporter=verbose
```

**期望结果**: 11/11 + 7/7 = 18/18

**手动验证项**:
1. DDSCanvasPage 右上方绿点/灰点渲染
2. 定位验证: top: 60px, right: 16px
3. 模拟时间推进 → 验证 5 分钟阈值切换

**阻塞条件**: vitest 失败

---

## 执行顺序

1. **并行运行所有 vitest**（E1/E2/E3/E4/E5）
2. **并行手动验证**（E1/E3/E4/E5 手动项）
3. **汇总结果** → 写入 `verification-report.md`
4. **判定**:
   - 全部通过 → coord-decision → coord-completed
   - 存在 P0 失败 → 创建 `sprint80-fix` 修复任务

---

## 产出物

- `docs/vibex-proposals-sprint80-qa/verification-report.md` — 详细验证报告
- 报告结构:
  - 每个 Epic 的 vitest 结果（截图/输出）
  - 每个 Epic 的手动验证结果
  - P0/P1/P2 问题列表
  - 最终判定：通过 / 需修复
