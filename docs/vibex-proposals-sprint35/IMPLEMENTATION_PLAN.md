# VibeX Sprint 35 — 实施计划

**Agent**: ARCHITECT | **日期**: 2026-05-11 | **项目**: vibex-proposals-sprint35
**状态**: 待开始

---

## Unit Index

| Epic | Units | Status | 依赖 |
|------|-------|--------|------|
| S35-P001: Undo/Redo 收尾 | U1-U6 | 🔄 待开始 | S34 Middleware 已完成 |
| S35-P002: 性能基线实测 | U1-U5 | 🔄 待开始 | S34 CI 已建立 |
| S35-P003: 协作调研 | U1-U4 | ✅ 已完成 | S33 已完成 |
| S35-P004: 模板市场调研 | U1-U4 | ✅ 已完成 | 当前模板 CRUD 已完成 |

**并行策略**: S35-P001 / S35-P002 / S35-P003 / S35-P004 无依赖关系，可并行执行。
**总工期**: 3.0 人天（S35-P003 1.5d 最长）

---

## S35-P001: Sprint 34 遗留项收尾

**工作量**: 0.5d | **优先级**: P0

### 子任务

| ID | 描述 | 验收标准 |
|----|------|----------|
| U1 | DDSCanvasPage 导入 canvasHistoryStore | `expect(canvasHistoryStore).toBeDefined()` — 已完成 |
| U2 | undoCallback 调用链 | `useCanvasHistoryStore.getState().undo()` 已连接 — 已完成 |
| U3 | redoCallback 调用链 | `useCanvasHistoryStore.getState().redo()` 已连接 — 已完成 |
| U4 | localStorage 持久化调用补充 | 在 DDSCanvasPage useEffect 中调用 `saveHistoryToStorage` |
| U5 | Ctrl+Z / Ctrl+Shift+Z 快捷键验证 | E2E: `page.keyboard.press('Control+z')` → undo-called |
| U6 | 53 个 Canvas 单元测试全通过 | CI: `npm run test -- --testPathPattern=canvas` → exit 0 |

### U4 详细说明

**文件**: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`

**变更点**: 在第 210-215 行的 Middleware 初始化 useEffect 后，追加 localStorage 持久化逻辑。

```typescript
// 在现有 useEffect 后追加（或合并到同一 useEffect）
const historyState = useCanvasHistoryStore();
useEffect(() => {
  // 项目 ID 变化时加载历史（从 localStorage metadata 恢复）
  const projectId = useDDSCanvasStore.getState().projectId;
  if (projectId) {
    const meta = loadHistoryFromStorage(projectId);
    // 注意：Command 对象不可恢复，meta 仅用于 UX 提示（如"有 5 条撤销历史"）
    // 实际 history 从 empty 开始，用户需要重新操作
  }
}, [useDDSCanvasStore.getState().projectId]);

useEffect(() => {
  // 监听 history 变更，debounced 保存到 localStorage
  const timeout = setTimeout(() => {
    const store = useDDSCanvasStore.getState();
    if (store.projectId) {
      saveHistoryToStorage(store.projectId);
    }
  }, 500);
  return () => clearTimeout(timeout);
}, [historyState.past.length, historyState.future.length]);
```

**关键约束**:
- `saveHistoryToStorage` 只保存 metadata，不保存 `execute`/`rollback` 闭包
- 刷新后 Command 对象不可恢复，history 从 empty 重新开始
- 500ms debounce 避免频繁写入

### 测试策略

```typescript
// 单元测试: DDSCanvasPage undo/redo 连接
it('undoCallback should call canvasHistoryStore.undo()', () => {
  const undoSpy = vi.spyOn(useCanvasHistoryStore.getState(), 'undo');
  fireEvent.click(screen.getByTestId('undo-btn'));
  expect(undoSpy).toHaveBeenCalled();
});
```

```typescript
// E2E: sprint34-p001.spec.ts
it('should persist history metadata in localStorage', async ({ page }) => {
  await page.goto('/dds-canvas?project=p001');
  await page.click('[data-testid="add-card-btn"]');
  await page.reload();
  const meta = await page.evaluate(() => {
    return localStorage.getItem('vibex-dds-history-p001');
  });
  expect(meta).not.toBeNull();
  // Command 对象不恢复，所以 history UI 显示 empty（这是设计决策）
});
```

---

## S35-P002: Sprint 34 性能基线实测 + 阈值建立

**工作量**: 0.5d | **优先级**: P1

### 子任务

| ID | 描述 | 验收标准 |
|----|------|----------|
| U1 | 主包大小基线测量 | `performance-baseline.md` 包含 `main-bundle: <N> KB` |
| U2 | Lighthouse 基线指标测量 | FCP / LCP / TTI / CLS 基线值写入 `performance-baseline.md` |
| U3 | Bundle Report CI 在 main 分支运行 | CI run 在 main 分支成功，baseline 记录已写入 |
| U4 | PR 对比基线，超阈值则 CI 失败 | PR 中包体积增加 >5% → CI exit 1 |
| U5 | Lighthouse CI 配置确认 | `lighthouserc.js` 使用 warn 级别，3 runs 中位数 |

### U1 + U3 详细说明

**文件**: `.github/workflows/bundle-report.yml`

**main 分支 baseline 记录**（新增 job）：

```yaml
  baseline-record:
    name: Record Baseline
    runs-on: ubuntu-latest
    # 仅在 main 分支 push 时运行
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm build
        env:
          ANALYZE: 'true'
          NEXT_OUTPUT_MODE: standalone
        working-directory: vibex-fronted
      - name: Extract bundle size
        id: bundle
        run: |
          SIZE=$(grep -oP 'Route \(app\):.*?size: \K[0-9]+(?= kB)' vibex-fronted/.next/analyze/bundle.html | head -1 || echo "0")
          echo "size=$SIZE" >> $GITHUB_OUTPUT
      - name: Update baseline
        run: |
          echo "# Performance Baseline (updated $(date '+%Y-%m-%d'))" > performance-baseline.md
          echo "" >> performance-baseline.md
          echo "| Metric | Value |" >> performance-baseline.md
          echo "|--------|-------|" >> performance-baseline.md
          echo "| main-bundle | ${{ steps.bundle.outputs.size }} KB |" >> performance-baseline.md
          echo "| recorded-at | $(date -u '+%Y-%m-%dT%H:%M:%SZ') |" >> performance-baseline.md
        working-directory: vibex-fronted
      - name: Commit baseline
        run: |
          git config --local user.email "ci@vibex.ai"
          git config --local user.name "CI Bot"
          git add performance-baseline.md
          git diff --cached --exit-code || git commit -m "ci: update performance baseline [skip ci]"
          git push
```

### U4 详细说明

**PR 对比基线**（修改现有 PR workflow）：

在现有 `bundle-report.yml` 的 PR job 中，增加对比逻辑：

```yaml
- name: Compare with baseline
  run: |
    BASELINE=$(grep -oP 'main-bundle.*?\|\K[0-9]+(?= KB)' performance-baseline.md 2>/dev/null || echo "0")
    CURRENT=${{ env.BUNDLE_SIZE_KB }}
    PERCENT=$(python3 -c "print(round(($CURRENT - $BASELINE) / $BASELINE * 100, 1))")
    echo "Baseline: ${BASELINE} KB, Current: ${CURRENT} KB, Delta: ${PERCENT}%"
    if (( $(echo "$PERCENT > 5" | bc -l) )); then
      echo "ERROR: Bundle size increased by ${PERCENT}% (threshold: 5%)"
      exit 1
    fi
```

---

## S35-P003: 多人协作能力增强调研

**工作量**: 1.5d | **优先级**: P1

### 子任务

| ID | 描述 | 验收标准 |
|----|------|----------|
| U1 | 竞品对比分析 | 文档包含 Figma / Miro / Notion 对比表 |
| U2 | 技术风险识别 | 识别 Firebase RTDB 扩展性风险 + WebSocket vs. RTC 选型 |
| U3 | 可选方案（≥2 个）| 文档包含方案 A + 方案 B，每个含 Pros/Cons |
| U4 | 推荐方案 + 工时估算 | 文档包含推荐方案 + 初步工时估计（人天） |

### 输出文件

`docs/vibex-proposals-sprint35/collaboration-research.md`

### 调研提纲

1. **竞品对比表**
   | 功能 | Figma | Miro | Notion |
   |------|-------|------|--------|
   | 多人实时光标 | ✅ | ✅ | ✅ |
   | Presence 显示 | ✅ | ✅ | ❌ |
   | 冲突解决 | ✅ | ✅ | ❌ |
   | 延迟 | <50ms | 50-100ms | 200-500ms |

2. **方案 A：Firebase RTDB + Presence 增强**
   - Pros: 已集成，降级方案完善
   - Cons: 免费层 100 并发上限
   - 工时估算: 5-7 人天

3. **方案 B：自建 WebSocket + Yjs CRDT**
   - Pros: 无并发上限，冲突解决更精确
   - Cons: 需要 WebSocket 服务器，CRDT 实现复杂
   - 工时估算: 10-15 人天

4. **推荐**: 方案 A（Firebase RTDB）作为 Sprint 36 MVP，降低风险

---

## S35-P004: 模板市场功能调研

**工作量**: 0.5d | **优先级**: P2

### 子任务

| ID | 描述 | 验收标准 |
|----|------|----------|
| U1 | 用户故事（≥3 个）| 文档包含 As a [role] I want to [goal] So that [benefit] |
| U2 | API 设计草稿 | 包含 `/api/templates/marketplace` 端点设计 |
| U3 | 技术方案选项（自建 vs. 第三方）| 文档包含自建方案 + 第三方集成方案 Pros/Cons |
| U4 | 安全考量 | 包含模板代码沙箱隔离方案说明 |

### 输出文件

`docs/vibex-proposals-sprint35/template-market-research.md`

### 调研提纲

1. **用户故事**
   - As a 前端工程师，我想要发现和复用高质量模板 So that 减少从零设计的时间
   - As a 团队 lead，我想要分享团队最佳实践模板 So that 团队成员可以快速上手
   - As a 独立开发者，我想要上传自己的模板到市场 So that 获得反馈和社区认可

2. **API 设计**
   ```typescript
   // 列表/搜索
   GET /api/templates/marketplace?category=&search=&page=&limit=
   // Response: { templates: MarketplaceTemplate[], total: number }

   // 上传
   POST /api/templates/marketplace
   // Body: { name, description, category, tags, content (VibexExportSchema) }

   // 详情
   GET /api/templates/marketplace/:id

   // 评分
   POST /api/templates/marketplace/:id/rate
   // Body: { rating: 1 | 2 | 3 | 4 | 5 }
   ```

3. **方案 A：自建**
   - Pros: 完全可控，可定制评分/推荐算法
   - Cons: 需要数据库、CDN、存储成本
   - 工时: 4-6 人天

4. **方案 B：GitHub Gist 集成**
   - Pros: 无存储成本，利用现有 GitHub 账号体系
   - Cons: 缺少评分/推荐功能，用户体验受限
   - 工时: 2-3 人天

5. **安全**: 模板内容（VibexExportSchema JSON）需要在浏览器沙箱中执行，禁止 `eval()` 或 `new Function()` 解析用户模板代码

---

## 执行顺序建议

```
Day 0.5（并行）:
  - S35-P001: 补充 localStorage 调用 + 写测试 → 2h
  - S35-P002: 修改 bundle-report.yml + 触发 main CI → 1h
  - S35-P003: 开始竞品调研 + 技术分析 → 4h（调研，非编码）
  - S35-P004: 开始用户故事 + API 设计 → 1h

Day 1.0:
  - S35-P003: 方案对比 + 推荐 → 4h
  - S35-P004: 技术方案 + 安全分析 → 3h
  - S35-P002: Lighthouse CI 测量 + performance-baseline.md 更新 → 1h

Day 1.5:
  - S35-P001: 测试全部通过 + CHANGELOG 更新 → 2h
  - S35-P003: 文档定稿 → 1h
  - S35-P004: 文档定稿 → 1h
  - Sprint 35 变更日志编写 → 1h
```

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| S35-P001 localStorage 频繁写入 | 低 | 已 debounced 500ms |
| S35-P002 Lighthouse CI flaky | 低 | warn 级别 + 3 runs 中位数 |
| S35-P003 调研发现需要大改架构 | 中 | 仅调研不实施，Sprint 36 再决策 |
| S35-P004 调研发现安全方案复杂 | 低 | MVP 先做"只读市场"，不执行模板代码 |

---

*本文档由 Architect Agent 生成。*
*所有技术方案均基于 S34 架构延伸，无破坏性变更。*