# VibeX Sprint 35 — 开发约束

**Agent**: ARCHITECT | **日期**: 2026-05-11 | **项目**: vibex-proposals-sprint35

---

## 1. 文件归属

| 文件 | Owner | 归属 Epic |
|------|-------|-----------|
| `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` | coder | S35-P001 |
| `vibex-fronted/src/__tests__/dds/DDSCanvasPage.test.tsx` | coder | S35-P001 |
| `.github/workflows/bundle-report.yml` | coder | S35-P002 |
| `vibex-fronted/performance-baseline.md` | coder | S35-P002 |
| `docs/vibex-proposals-sprint35/collaboration-research.md` | coder | S35-P003 |
| `docs/vibex-proposals-sprint35/template-market-research.md` | coder | S35-P004 |
| `docs/vibex-proposals-sprint35/performance-baseline.md` | coder | S35-P002 |

---

## 2. S35-P001 约束

### 2.1 TypeScript 约定

- `strict: true`，无 `any` 逃逸
- 导出所有公共接口：`export type` / `export interface`
- `'use client'` 标注所有客户端组件

### 2.2 S35-P001 — Undo/Redo 收尾约束

**补充 localStorage 持久化调用**（不修改现有 undo/redo 连接）：

```typescript
// 在 DDSCanvasPage.tsx 中追加
// 第 1 条：监听 projectId 变化，尝试从 localStorage 加载 metadata
useEffect(() => {
  const projectId = useDDSCanvasStore.getState().projectId;
  if (projectId) {
    const meta = loadHistoryFromStorage(projectId);
    // meta.pastMeta / meta.futureMeta 可用于 UX 提示
    // 例如：显示"检测到 X 条历史记录"（但实际 history 从 empty 开始）
  }
}, [useDDSCanvasStore.getState().projectId]);

// 第 2 条：history 变更时 debounced 保存
const historyState = useCanvasHistoryStore();
useEffect(() => {
  const timeout = setTimeout(() => {
    const store = useDDSCanvasStore.getState();
    if (store.projectId) {
      saveHistoryToStorage(store.projectId);
    }
  }, 500);
  return () => clearTimeout(timeout);
}, [historyState.past.length, historyState.future.length]);
```

**禁止行为**：
- ❌ 不要在 undoCallback/redoCallback 中添加新逻辑（已连接）
- ❌ 不要修改 `canvasHistoryMiddleware.ts` 的包装逻辑（S34 已完成）
- ❌ 不要修改 `canvasHistoryStore.ts` 的 Command 接口
- ❌ 不要在 `saveHistoryToStorage` 中尝试序列化 `execute`/`rollback` 闭包

**localStorage 约束**：
- `saveHistoryToStorage` 只保存 metadata（id/timestamp/description）
- `loadHistoryFromStorage` 返回 `{ pastMeta, futureMeta }`，不返回 Command 对象
- 刷新后 Command 对象不可恢复，history 从 empty 开始（这是设计决策，不是 bug）

### 2.3 测试约束

- 53 个 Canvas 单元测试必须全部通过
- 新增 2 个单元测试：undoCallback 连接、redoCallback 连接
- 新增 1 个 E2E 场景：刷新页面后 localStorage metadata 保留

---

## 3. S35-P002 约束

### 3.1 CI Workflow 约束

**bundle-report.yml 增强**：

```yaml
# main 分支：记录 baseline（新增 job）
baseline-record:
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  # ... build steps ...
  - name: Update baseline
    run: |
      # 写入 performance-baseline.md（注意路径是 vibex-fronted/）
      echo "# Performance Baseline" > performance-baseline.md
      echo "| Metric | Value |" >> performance-baseline.md
      echo "|--------|-------|" >> performance-baseline.md
      echo "| main-bundle | ${SIZE} KB |" >> performance-baseline.md
    working-directory: vibex-fronted

# PR 分支：对比 +5% 阈值
bundle-report:
  # existing PR job
  - name: Compare baseline
    run: |
      BASELINE=$(grep -oP 'main-bundle.*?\|\K[0-9]+' performance-baseline.md 2>/dev/null || echo "0")
      CURRENT=${{ env.BUNDLE_SIZE_KB }}
      PERCENT=$(python3 -c "print(round(($CURRENT - $BASELINE) / $BASELINE * 100, 1))" 2>/dev/null || echo "0")
      if (( $(echo "$PERCENT > 5" | bc -l) )); then
        echo "ERROR: Bundle increased by ${PERCENT}% (> 5%)"
        exit 1
      fi
```

**禁止行为**：
- ❌ 不要在 main 分支添加 CI 失败条件（baseline 记录应该总是成功）
- ❌ 不要删除现有的 PR comment 功能（treyhunner/artifact-comment）

### 3.2 Lighthouse CI 约束

- `lighthouserc.js` 配置保持 warn 级别（不阻断 PR）
- `numberOfRuns: 3`（3 次中位数策略）
- 不需要 LHCI server（target: temporary）

---

## 4. S35-P003 约束（调研）

### 4.1 调研文档约束

`collaboration-research.md` 必须包含：
1. 竞品对比表（Figma / Miro / Notion）
2. Firebase RTDB 扩展性分析（100 并发限制 + writes/s 估算）
3. WebSocket vs WebRTC 选型分析
4. 至少 2 个可选方案，每个含：Pros / Cons / 依赖项 / 工时估算
5. 推荐方案 + 理由

**禁止行为**：
- ❌ 不要写任何代码（S35-P003 是调研阶段）
- ❌ 不要修改任何现有文件
- ❌ 不要创建任何新组件或 store

### 4.2 技术约束

- 延续 S33 IntentionBubble + ConflictBubble 架构
- Firebase RTDB 已使用 REST API（无 SDK）— 调研方案必须延续此设计
- 降级策略：Firebase 未配置时使用 Zustand mock

---

## 5. S35-P004 约束（调研）

### 5.1 调研文档约束

`template-market-research.md` 必须包含：
1. 至少 3 个用户故事（As a [role] I want to [goal] So that [benefit]）
2. API 设计草稿（至少 4 个端点：list/create/detail/rate）
3. 自建 vs 第三方方案对比（含 Pros / Cons / 工时）
4. 模板代码沙箱隔离安全方案

**禁止行为**：
- ❌ 不要写任何代码
- ❌ 不要修改任何现有文件
- ❌ 不要创建任何新组件

---

## 6. 通用约束

### 6.1 代码规范

- 所有新增代码必须通过 ESLint + Prettier
- 所有新增测试必须通过（单元测试 + E2E）
- 禁止硬编码魔法数字（MAX_HISTORY=50 已定义为常量）

### 6.2 changelog 约束

完成后更新 `CHANGELOG.md`，移除 ⚠️ U4-P001 标注：

```markdown
- ~~⚠️ U4-P001 在 DDSCanvasPage 中的调用待后续 sprint 补充~~ → ✅ 已完成
```

### 6.3 性能约束

- S35-P001 补充代码：< 30 行，bundle 影响 0 KB
- S35-P002 CI：+2-3 分钟 build 时间（可接受）
- 禁止在 render cycle 中直接调用 localStorage（必须 debounced）

---

*本文档由 Architect Agent 生成。*
*违反上述约束的 PR 将被 reviewer 驳回。*