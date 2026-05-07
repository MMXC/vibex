# Epic1-Onboarding → 画布预填充 实现方案

## 背景

Sprint 26 E1 Onboarding → 画布预填充（P001），解决新用户完成 Onboarding 后面对空白画布无法理解下一步操作的问题。

**4 个 Story**：
- S1.1: Onboarding Step 5 跳转画布前触发模板 auto-fill（1h，依赖 S1.3）
- S1.2: 画布页面首次加载展示引导气泡（0.5h）
- S1.3: 场景化模板推荐（基于 Step 2 选择，1h）
- S1.4: 引导气泡消失后不再重复出现（0.5h，依赖 S1.2）

**已有基础**（已实现）：
- S1.3: ClarifyStep + filterByScenario + SCENARIO_OPTIONS ✅
- S1.4: onboardingStore complete() → localStorage 完成标记 ✅
- ChapterPanel auto-fill (autoFilledRef guard) ✅
- PENDING_TEMPLATE_REQ_KEY 在 PreviewStep.tsx + DDSCanvasPage.tsx 已实现 ✅
- CanvasOnboardingOverlay 多步骤引导 ✅

**缺口分析**（需要实现）：

### S1.1 缺口：PreviewStep complete 后没有跳转 + createProject
- PreviewStep handleNext() 只调用 complete()，没有创建项目
- 没有根据场景类型+模板生成画布节点的逻辑
- DDSCanvasPage 有 templateRequirement 自动填充，但缺少节点生成

### S1.2 缺口：缺少引导气泡组件
- PRD 要求 `[data-testid="canvas-first-hint"]`，3s 后自动消失
- CanvasOnboardingOverlay 是多步骤引导，不是气泡
- 需要一个新组件作为首次加载引导气泡

---

## 实现方案

### S1.1 实现：PreviewStep → 完成 Onboarding → 创建项目 + 跳转画布

#### 改动 1: PreviewStep.tsx — 完成 Onboarding 后创建项目并跳转

**修改 handleNext 逻辑**：
1. 调用 projectApi.createProject() 创建项目（传入 templateRequirement）
2. 跳转 `/canvas/${projectId}`（通过 router.push）
3. 清理 localStorage 中的 PENDING_TEMPLATE_REQ_KEY（成功创建后）

**数据流**：
```
用户完成 Step 5
  → handleNext()
    → projectApi.createProject({ name, scenario, templateId })
      → 后端返回 { id, ... }
    → router.push(`/canvas/${projectId}`)
      → CanvasPage 加载
        → DDSCanvasPage / ChapterPanel 读取 PENDING_TEMPLATE_REQ_KEY
        → 自动填充 requirement 内容
```

#### 改动 2: 扩展 projectApi.createProject 支持模板参数

当前 createProject(project: ProjectCreate) 只接收 name/userId。
需要扩展为可选的 template/templateRequirement。

**方案**：在 ProjectCreate 中增加可选字段 `templateRequirement?: string`。

#### 改动 3: DDSCanvasPage — 读取 templateRequirement 并自动生成节点

当前 DDSCanvasPage 将 templateRequirement 传给 ChapterPanel 做 auto-fill（仅填充 requirement 章节内容）。
需要扩展为：模板节点生成（创建 canvas_nodes）。

**方案**：
- DDSCanvasPage 挂载时，如果 templateRequirement 存在，调用 API 生成 context nodes
- 不需要生成 flow/component nodes（S1.1 只是 auto-fill，不是全流程）

### S1.2 实现：首次加载引导气泡 CanvasFirstHint

**新组件**：`CanvasFirstHint.tsx`
- `[data-testid="canvas-first-hint"]`
- 首次加载显示，3s 后自动消失（setTimeout 3000）
- 使用 guidanceStore 状态控制
- 气泡内容：提示画布的基本操作（与 S1.4 共用同一个状态）

**位置**：CanvasPage 内嵌入，固定在画布区域左上角

### S1.4 实现：引导气泡消失后不再重复出现

**机制**：
- guidanceStore 中已有 `canvasOnboardingDismissed` 字段
- CanvasOnboardingOverlay 已使用此字段
- CanvasFirstHint 也应使用相同字段
- 在 guidanceStore 中增加 `canvasFirstHintDismissed`（或复用 `canvasOnboardingDismissed`）

**S1.4 依赖 S1.2**：先有引导气泡，再处理消失后不再显示

---

## 实施步骤

### Phase A: S1.2 + S1.4（引导气泡）
1. 新增 `CanvasFirstHint` 组件
2. 集成到 CanvasPage
3. guidanceStore 增加 canvasFirstHintDismissed

### Phase B: S1.1（模板 auto-fill）
4. 扩展 projectApi.createProject（可选 templateRequirement）
5. 修改 PreviewStep.tsx — createProject + router.push
6. 扩展 DDSCanvasPage — 读取 templateRequirement + 生成 context nodes

### Phase C: 验证
7. 运行 pnpm run build
8. 运行测试：pnpm test

---

## 文件变更

| 文件 | 变更类型 | 描述 |
|------|----------|------|
| `components/onboarding/steps/PreviewStep.tsx` | 修改 | handleNext 创建项目并跳转 |
| `services/api/modules/project.ts` | 修改 | createProject 支持 templateRequirement |
| `app/api/v1/projects/route.ts` | 修改 | API 接收 templateRequirement |
| `components/guidance/CanvasFirstHint.tsx` | 新增 | 首次加载引导气泡 |
| `components/guidance/index.ts` | 修改 | 导出 CanvasFirstHint |
| `stores/guidanceStore.ts` | 修改 | 增加 canvasFirstHintDismissed 字段 |
| `components/dds/DDSCanvasPage.tsx` | 修改 | 读取 templateRequirement 生成节点 |
| `stores/onboarding/onboardingStore.ts` | 修改 | complete() 时触发项目创建（可选） |

---

## 验收标准

### S1.1
- [ ] 完成 Onboarding Step 5 → 点击"开始使用" → 创建项目 → 跳转 `/canvas/{projectId}`
- [ ] 跳转后画布至少有 3 个预填充节点
- [ ] 模板 requirement 内容已填充到 requirement 章节
- [ ] `pnpm run build` → 0 errors

### S1.2
- [ ] 首次加载画布显示 `[data-testid="canvas-first-hint"]`
- [ ] 3s 后气泡自动消失

### S1.3（已实现）
- [ ] Step 2 选择场景 → Step 5 模板列表已过滤（参考 ClarifyStep + filterByScenario）
- [ ] `pnpm test` → 相关测试通过

### S1.4（已实现）
- [ ] onboardingStore complete() → localStorage 写入完成标记
- [ ] guidanceStore canvasOnboardingDismissed 正确设置
- [ ] 刷新页面气泡不重复显示

---

## 回滚计划

如果 S1.1 的 router.push 导致循环依赖或 SSR 问题：
- PreviewStep 使用 `window.location.href` 替代 router.push
- 或使用 `window.location.assign()`

如果 S1.2 的 CanvasFirstHint 与 CanvasOnboardingOverlay 冲突：
- S1.2/S1.4 只显示 CanvasFirstHint（简单气泡）
- CanvasOnboardingOverlay 保持多步骤引导（不冲突）