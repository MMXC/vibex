# 架构文档：Agent 提案执行追踪与质量基线体系

**文档版本**: v1.0  
**日期**: 2026-03-29 晚间  
**作者**: Architect Agent  
**状态**: Ready for Coord Decision  
**基于**: `prd.md` (v1.0) + `analysis.md` (晚间场)

---

## 一、架构概述

### 1.1 问题域

本项目是**过程改进工具集**，非产品功能开发。13 条提案按领域划分为三个子系统：

```
agent-proposals-20260329-evening
├── 子系统 A: 提案追踪闭环（proposal_tracker.py + EXECUTION_TRACKER）
├── 子系统 B: 质量基线体系（Sprint 基线 + Epic 规模 + Review Gate）
└── 子系统 C: Canvas 技术债务（canvasStore 重构 + E2E + 性能基线）
```

### 1.2 架构决策

| # | ADR | 决策 | 理由 |
|---|-----|------|------|
| **ADR-01** | 追踪数据存储为 JSON + Markdown 双格式 | JSON 供程序解析，Markdown 供人类阅读 | task_manager 已用 JSON，本项目复用 |
| **ADR-02** | proposal_tracker.py 用 Python 实现 | task_manager.py 已用 Python，保持一致性 | 复用 task_state.py / topological_sort.py |
| **ADR-03** | canvasStore 采用 slice pattern，不迁移框架 | 保持 Zustand，仅拆分模块 | 避免重构风险（PRD OQ3）|
| **ADR-04** | E2E 测试使用 Playwright（已有配置）| 不引入新测试框架 | 复用 `vibex-fronted/playwright/` 配置 |
| **ADR-05** | Review Gate 存储为 Markdown 模板文件 | 不建数据库，用文件版本控制 | 复用 proposals/ 目录结构 |

---

## 二、子系统 A：提案追踪闭环

### 2.1 系统架构

```
scripts/
├── proposal_tracker.py          # 主入口脚本
├── task_state.py               # 任务状态读取（已有，复用）
└── proposal_tracker_config.py  # 配置（扫描目录、输出路径）

proposals/
├── EXECUTION_TRACKER.json      # 机器可读追踪数据（自动生成）
├── EXECUTION_TRACKER.md        # 人类可读追踪报告（自动生成）
└── {YYYYMMDD}/                # 每日提案目录（已有）
    ├── summary.md             # 提案汇总（已有）
    └── [proposal_files]       # 各提案详情（已有）
```

### 2.2 proposal_tracker.py 核心逻辑

```python
# scripts/proposal_tracker.py — 执行流程

class ProposalTracker:
    """提案执行状态追踪器"""

    def __init__(self, project_root: Path, output_dir: Path):
        self.project_root = project_root
        self.output_dir = output_dir
        self.task_manager = TaskState(project_root / "scripts" / "task_manager.py")

    def scan_proposals(self) -> list[Proposal]:
        """扫描 proposals/ 下所有日期目录"""
        proposals_dir = self.project_root / "proposals"
        proposals = []
        for date_dir in sorted(proposals_dir.glob("????????")):
            if date_dir.is_dir():
                summary = date_dir / "summary.md"
                if summary.exists():
                    proposals.extend(self._parse_summary(summary, date_dir))
        return proposals

    def enrich_with_task_status(self, proposals: list[Proposal]) -> list[Proposal]:
        """查询 task_manager 获取每个提案的任务状态"""
        for p in proposals:
            task_id = p.get("task_id")
            if task_id:
                status = self.task_manager.get_status(task_id)
                p["task_status"] = status
                p["task_updated"] = self.task_manager.get_updated(task_id)
        return proposals

    def generate_outputs(self, proposals: list[Proposal]) -> None:
        """生成 JSON + Markdown 双格式输出"""
        tracker_json = self._build_json(proposals)
        tracker_md = self._build_markdown(proposals)

        json_path = self.output_dir / "EXECUTION_TRACKER.json"
        md_path = self.output_dir / "EXECUTION_TRACKER.md"

        json_path.write_text(json.dumps(tracker_json, indent=2, ensure_ascii=False))
        md_path.write_text(tracker_md, encoding="utf-8")

        print(f"✅ Tracker updated: {len(proposals)} proposals")
        print(f"   JSON: {json_path}")
        print(f"   MD:   {md_path}")

    def _parse_summary(self, summary_path: Path, date_dir: Path) -> list[Proposal]:
        """解析 summary.md，提取提案元数据"""
        content = summary_path.read_text(encoding="utf-8")
        proposals = []
        # 匹配 ## P{id} 或 ## {id} 格式的提案标题
        for match in re.finditer(r"^##\s+(P?\d+(?:-\d+)?)\s+(.+)$", content, re.MULTILINE):
            id_, title = match.group(1), match.group(2).strip()
            proposals.append({
                "id": f"{date_dir.name}/{id_}",
                "title": title,
                "date": date_dir.name,
                "task_id": self._extract_task_id(content[match.start():match.start()+500]),
                "status": "unknown",
            })
        return proposals
```

### 2.3 依赖关系

```
proposal_tracker.py
├── scripts/task_state.py（已有，复用）
├── scripts/topological_sort.py（已有，复用）
└── proposals/{date}/summary.md（输入）
    └── EXECUTION_TRACKER.json + EXECUTION_TRACKER.md（输出）
```

### 2.4 cronjob 接入

```bash
# /etc/cron.d/proposal-tracker
# 每天早上 09:00 自动运行
0 9 * * * root cd /root/.openclaw/vibex && python3 scripts/proposal_tracker.py >> /var/log/proposal_tracker.log 2>&1
```

---

## 三、子系统 B：质量基线体系

### 3.1 文档架构

```
docs/
├── agent-proposals-20260329-evening/
│   ├── SPRINT_BASELINE.md     # Sprint 速度基线
│   ├── REVIEW_GATES.md        # 四阶段 Review Gate 定义
│   └── SPRINT_RETRO_TEMPLATE.md  # Sprint 回顾模板
└── templates/
    ├── phase-file-template.md  # Phase 文件格式标准（升级版）
    └── review-report-template.md  # Code Review 报告模板
```

### 3.2 SPRINT_BASELINE.md 结构

```markdown
# Sprint 速度基线 — VibeX 项目

## 基线建立方法
- 数据来源: task_manager 历史记录（completed 项目）
- 校准数量: 10+ 项目
- 更新频率: 每 5 个项目完成时更新

## 速度基线表

| 类型 | 任务复杂度 | 速度基线 | 历史案例 |
|------|-----------|---------|---------|
| Bug Fix | 单文件/单函数 | 1-2h | canvas-design-404 (0.5h) |
| UI 优化 | 3-5 文件，样式+逻辑 | 2-4h | ErrorBoundary 去重 (3h) |
| Feature 小 | 5-10 文件，单 Epic | 0.5-1d | F1.1 expand-both (4h) |
| Feature 中 | 10-20 文件，多 Epic | 2-3d | confirmationStore 重构 (2d) |
| Feature 大 | 20+ 文件，跨域 | 5-7d | canvas-feature-gap (5d) |

## 工时估算公式
estimated_hours = base_hours × complexity_factor × (1 + rework_rate)

其中:
- complexity_factor: [0.8, 1.0, 1.2, 1.5, 2.0] 对应 5 种类型
- rework_rate: 团队平均返工率（当前约 0.15）
```

### 3.3 Review Gate 架构

```
四阶段 Gate 流转:

Gate 1: Analysis Review
  Analyst ──→ PM
  输入: analysis.md
  核查: 问题陈述 / 影响范围 / 数据支撑
  触发: phase1 开始时

Gate 2: PRD Review
  PM ──→ Architect
  输入: prd.md
  核查: Story 数量 / expect() 格式 / 依赖图
  触发: PM 完成 PRD

Gate 3: Architecture Review
  Architect ──→ Coord
  输入: architecture.md + IMPLEMENTATION_PLAN.md + AGENTS.md
  核查: 技术选型 / 风险缓解 / Epic 规模（3-8 功能点）
  触发: Architect 完成架构设计

Gate 4: Code Review
  Dev ──→ Reviewer ──→ Coord
  输入: PR / 变更 diff
  核查: P0/P1 违规 / 测试覆盖 / 安全
  触发: Dev 提交 PR

Gate 拦截率监控:
- 每次 Gate 拦截 → 记录到 EXECUTION_TRACKER.json
- 拦截率 = 被拦截 Epic 数 / 总 Epic 数
- 目标: 拦截率 > 0（说明 Gate 真实有效）
```

### 3.4 Epic 规模检查机制

```python
# scripts/epic_scale_check.py — Epic 规模自动检查

def check_epic_scale(prd_path: Path) -> dict:
    """检查 prd.md 中 Epic 规模是否符合标准"""
    content = prd_path.read_text(encoding="utf-8")

    epics = re.findall(r"^### Epic \d+:", content, re.MULTILINE)
    epic_summaries = re.findall(
        r"^### Epic \d+:.*?\n(.*?)(?=^### Epic|\Z)",
        content,
        re.MULTILINE | re.DOTALL
    )

    results = []
    for i, summary in enumerate(epic_summaries):
        feature_count = len(re.findall(r"^\| E\d+\.\d+", summary, re.MULTILINE))
        status = categorize(feature_count)
        results.append({
            "epic": i + 1,
            "features": feature_count,
            "status": status,  # "pass" | "warn" | "reject"
        })

    return {
        "prd": prd_path.name,
        "epics": results,
        "average_size": sum(r["features"] for r in results) / len(results),
        "all_pass": all(r["status"] in ("pass", "warn") for r in results),
    }
```

---

## 四、子系统 C：Canvas 技术债务

### 4.1 canvasStore 状态分层架构

**当前状态**（canvasStore.ts 混合）:
```
canvasStore.ts (单文件 ~1159 行)
├── 布局状态: expandMode, maximize, left/center/right panel
├── 数据状态: boundedContexts, flowNodes, componentNodes
├── 选择状态: selectedBcId, selectedFlowId, selectedComponentId
└── 渲染状态: overlay layers (5 层 SVG)
```

**目标状态**（slice pattern + 目录结构）:
```
src/lib/canvas/
├── stores/
│   ├── canvasLayoutStore.ts    # 布局状态（expandMode, maximize, grid columns）
│   ├── canvasDataStore.ts     # 数据状态（boundedContexts, flows, components）
│   ├── canvasSelectionStore.ts # 选择状态（selected BC/flow/component）
│   └── canvasOverlayStore.ts  # 渲染状态（overlay visibility, z-index）
├── __tests__/
│   ├── canvasLayoutStore.test.ts
│   ├── canvasDataStore.test.ts
│   ├── canvasSelectionStore.test.ts
│   └── canvasOverlayStore.test.ts
└── index.ts                   # 统一导出（向后兼容）
```

**状态分层设计**:

```typescript
// canvasLayoutStore.ts
interface CanvasLayoutState {
  expandMode: CanvasExpandMode;        // 'normal' | 'expand-both' | 'maximize'
  maximize: boolean;
  gridColumns: number;                  // normal=2, expand-both=3, maximize=1
  panelVisibility: { left: boolean; center: boolean; right: boolean };
}

// canvasDataStore.ts
interface CanvasDataState {
  boundedContexts: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
  drafts: { bc: BoundedContextDraft[]; flow: BusinessFlowDraft[] };
}

// canvasSelectionStore.ts
interface CanvasSelectionState {
  selectedBcId: string | null;
  selectedFlowId: string | null;
  selectedComponentId: string | null;
  selectedTreeType: TreeType;
}

// canvasOverlayStore.ts
interface CanvasOverlayState {
  overlays: {
    boundedGroup: boolean;      // z-index: 10
    overlapHighlight: boolean;  // z-index: 20
    boundedEdge: boolean;        // z-index: 30
    flowEdge: boolean;          // z-index: 40
    flowNodeMarker: boolean;    // z-index: 50-60
  };
  overlayPointerEvents: 'none' | 'auto';  // 全部为 'none'
}

// 跨 store 协调（共享 selector）
// 使用 Zustand shallow equality + derived state
const useCrossStoreSelector = () => ({
  layout: useCanvasLayoutStore(),
  data: useCanvasDataStore(),
  selection: useCanvasSelectionStore(),
  overlay: useCanvasOverlayStore(),
});
```

**向后兼容策略**:
```typescript
// canvasStore.ts — 保留现有 API，作为统一入口
export const useCanvasStore = () => {
  const layout = useCanvasLayoutStore();
  const data = useCanvasDataStore();
  const selection = useCanvasSelectionStore();
  const overlay = useCanvasOverlayStore();

  // 合并所有 slice 到单一 hook（向后兼容）
  return {
    // 布局
    expandMode: layout.expandMode,
    maximize: layout.maximize,
    // 数据
    boundedContexts: data.boundedContexts,
    flowNodes: data.flowNodes,
    componentNodes: data.componentNodes,
    // 选择
    selectedBcId: selection.selectedBcId,
    selectedFlowId: selection.selectedFlowId,
    selectedComponentId: selection.selectedComponentId,
    // 覆盖层
    ...overlay.overlays,
  };
};
```

### 4.2 Canvas E2E 测试架构

```
vibex-fronted/playwright/
├── canvas-phase2.spec.ts        # canvas-phase2 专项测试（新建）
├── canvas-performance.spec.ts   # 性能基线测试（新建）
└── [已有测试文件]
    ├── canvas-expand.spec.ts
    └── ...
```

**canvas-phase2.spec.ts 测试用例**:

```typescript
// 来自 PRD E3.2 验收标准
describe('Canvas Phase2 E2E', () => {

  test('全屏展开 expand-both 模式三栏等宽', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="expand-both-btn"]');

    const columns = page.locator('.canvas-column');
    await expect(columns).toHaveCount(3);

    // 验证等宽
    const widths = await columns.evaluateAll(els =>
      els.map(el => el.getBoundingClientRect().width)
    );
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(5);
  });

  test('SVG overlay 层 pointer-events: none 不阻挡节点交互', async ({ page }) => {
    await page.goto('/canvas');

    const overlayLayers = ['boundedGroup', 'overlapHighlight', 'boundedEdge', 'flowEdge', 'flowNodeMarker'];
    for (const layer of overlayLayers) {
      const overlay = page.locator(`[data-testid="svg-overlay-${layer}"]`);
      if (await overlay.count() > 0) {
        await expect(overlay).toHaveCSS('pointer-events', 'none');
      }
    }

    // 验证节点仍可点击
    const bcNode = page.locator('[data-testid="bc-node"]').first();
    await bcNode.click();
    await expect(bcNode).toHaveAttribute('data-selected', 'true');
  });

  test('关系可视化 BC 连线正确渲染', async ({ page }) => {
    await page.goto('/canvas');
    const bcEdges = page.locator('[data-testid="bc-edge"]');
    await expect(bcEdges.first()).toBeVisible();
    const count = await bcEdges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('全屏 maximize 模式工具栏隐藏', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="maximize-btn"]');
    const toolbar = page.locator('[data-testid="canvas-toolbar"]');
    await expect(toolbar).toBeHidden();
  });

  test('ESC 快捷键退出全屏', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="maximize-btn"]');
    await page.keyboard.press('Escape');
    const toolbar = page.locator('[data-testid="canvas-toolbar"]');
    await expect(toolbar).toBeVisible();
  });
});
```

### 4.3 Canvas 性能基线测试架构

```typescript
// playwright/canvas-performance.spec.ts
describe('Canvas Performance Baseline', () => {

  test('20 BC 节点渲染 < 100ms', async ({ page }) => {
    // 使用 page.evaluate 注入测试数据 + 测量时间
    await page.goto('/canvas');
    await page.evaluate(() => {
      // 注入 20 个 BC 节点数据
      window.__TEST_INJECT_BC_COUNT__(20);
    });

    const start = Date.now();
    await page.reload();
    await page.waitForSelector('[data-testid="bc-node"]', { state: 'visible' });

    const renderTime = Date.now() - start;
    expect(renderTime).toBeLessThan(100);
  });

  test('50 BC 节点 FPS ≥ 30（无帧丢失）', async ({ page }) => {
    await page.goto('/canvas');
    await page.evaluate(() => {
      window.__TEST_INJECT_BC_COUNT__(50);
    });
    await page.reload();

    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        let lastTime = performance.now();
        const measure = () => {
          frames++;
          const now = performance.now();
          if (now - lastTime >= 1000) {
            resolve(frames);
          } else {
            requestAnimationFrame(measure);
          }
        };
        requestAnimationFrame(measure);
      });
    });

    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('100 BC 节点无崩溃', async ({ page }) => {
    await page.goto('/canvas');
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => window.__TEST_INJECT_BC_COUNT__(100));
    await page.reload();
    await page.waitForTimeout(3000);

    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  });
});
```

---

## 五、模块间依赖关系总图

```
┌─────────────────────────────────────────────────────────────────┐
│                    proposal_tracker.py                           │
│  扫描 proposals/ → task_manager 查询 → EXECUTION_TRACKER.json  │
└──────────┬──────────────────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     │  产出物    │
     ├───────────┼────────────────┬──────────────────┬────────────┐
     │ SPRINT_   │ REVIEW_       │ AGENTS.md        │ Epic      │
     │ BASELINE  │ GATES.md      │ Dev自主认领规范   │ scale_    │
     │           │               │                  │ check.py  │
     └───────────┴────────────────┴──────────────────┴────────────┘
           │              │                    │
     ┌─────┴─────┐  ┌─────┴──────┐        ┌─────┴──────┐
     │ Sprint    │  │ 四阶段     │        │ phase2    │
     │ 回顾机制  │  │ Review Gate│        │ Gate 3    │
     │           │  │            │        │ 规模检查  │
     └───────────┘  └────────────┘        └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Canvas E2E + canvasStore                       │
│  canvasLayoutStore + canvasDataStore + canvasSelectionStore     │
│  + canvasOverlayStore ──→ canvas-phase2 E2E + 性能基线         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、技术选型 Trade-off 分析

### 6.1 proposal_tracker.py 实现方案

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **纯 Python** | 复用现有 task_state.py | 需解析 Markdown | ✅ 选用 |
| 独立数据库 | 查询快 | 引入新依赖 | ❌ 驳回 |
| task_manager 内置 | 无新文件 | 职责混合 | ❌ 驳回 |

### 6.2 canvasStore 状态分层方案

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **Zustand slice pattern** | 向后兼容，风险低 | 需拆分文件 | ✅ 选用 |
| 迁移到 Jotai/Recoil | 现代化 | 重构成本高，无明显收益 | ❌ 驳回 |
| 保持单文件 | 无迁移成本 | 文件持续膨胀 | ❌ 驳回 |

### 6.3 E2E 测试框架

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **Playwright（已有）** | 无需新安装，配置已有 | — | ✅ 选用 |
| Cypress | 流行 | 需重装，配置不同 | ❌ 驳回 |
| Lighthouse | 专注性能 | 无交互测试能力 | ❌ 驳回 |

---

## 七、风险与缓解

| 风险 ID | 风险描述 | 影响 | 概率 | 缓解措施 |
|---------|---------|------|------|---------|
| **R1** | proposal_tracker.py 依赖 task_manager JSON 格式稳定性 | tracker 数据不准确 | 中 | E1.1 实现时添加格式校验，格式变更触发告警 |
| **R2** | canvasStore 拆分时破坏向后兼容 | 现有 useCanvasStore() 调用失效 | 低 | 保留统一导出层（ADR-03），逐文件迁移 |
| **R3** | E2E 测试在 CI 环境 flaky | 测试不稳定 | 中 | Playwright retry 配置 + 独立测试文件隔离 |
| **R4** | Epic 规模检查增加 phase1 负担 | PM 抱怨流程变慢 | 中 | 检查脚本自动化，Gate 3 集成到 task_manager |

---

## 八、Open Questions 状态

| OQ | 问题 | 架构决策 | 负责人 |
|----|------|---------|--------|
| **OQ1** | proposal_tracker.py 扫描频率？ | cronjob 每日一次（早 9:00）| Architect |
| **OQ2** | dedup 压测数据来源？ | 使用匿名化合成数据 | Reviewer |
| **OQ3** | canvasStore 迁移框架选择？ | **ADR-03: Zustand slice pattern** | Architect |
| **OQ4** | SVG 性能测试框架？ | **ADR-04: Playwright + performance API** | Architect |

---

## 九、检查清单

- [x] 提案追踪子系统架构（proposal_tracker.py）
- [x] 质量基线体系架构（SPRINT_BASELINE + REVIEW_GATES）
- [x] Canvas 技术债务架构（canvasStore 分层 + E2E + 性能基线）
- [x] Trade-off 分析（3 项关键决策）
- [x] 风险矩阵（4 项风险 + 缓解措施）
- [x] Open Questions 决策
- [x] 模块间依赖关系图
- [x] 向后兼容策略（canvasStore 统一导出层）

---

*架构设计完成 | Architect Agent | 2026-03-29 21:20 GMT+8*
