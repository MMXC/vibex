# Reviewer Proposals — vibex 2026-04-07 Cycle

**分析日期**: 2026-04-05  
**提案周期**: 2026-04-07  
**状态**: Draft → 待评审

---

## 背景分析

近期审查流程审计发现以下关键问题：

| 问题域 | 发现 | 严重度 |
|--------|------|--------|
| Review SOP | 5个入口点，8处不一致，亟需标准化 | 🔴 高 |
| 测试覆盖 | Vitest配置含死代码，覆盖率门槛未执行 | 🔴 高 |
| Canvas Hooks | 6个新Hook无测试，API完整度72% | 🟡 中 |
| API覆盖率 | 72%端点缺失测试，E2E场景不足 | 🟡 中 |

---

## Proposal 1: Reviewer SOP 标准化

**优先级**: P0  
**影响工时**: 6h（实现） + 2h（文档 + 培训）

### Problem/Opportunity

当前有5个代码审查入口点（manual review, PR comment, draft review, self-review, peer review），导致：
- 审查标准不一致，Reviewer间质量差异大
- 关键检查项（安全、类型、测试）容易被跳过
- 新成员上手困难，缺乏统一流程

### Solution

创建统一的 `REVIEWER_SOP.md`，定义单一入口审查流程：

```
PR创建 → 自动化Gate检查 → Reviewer分配 → 标准化Review → Merge决策
```

**核心要素**：
1. **强制Gate**（自动化）: lint → type check → coverage threshold → CI pass
2. **Review Checklist**（标准化）: 10项必检清单
3. **Reviewer轮换规则**: 按模块领域分配，避免单点
4. **Merge条件**: 至少1个LGTM + 所有Gate通过

### Implementation Sketch

```
/docs/REVIEWER_SOP.md           # 主SOP文档
/scripts/reviewer-assign.js    # 自动分配Reviewer脚本
/skills/ce-review/SKILL.md      # 更新ce:review技能以对齐SOP
/.github/workflows/review-gate.yml  # 自动化Gate（lint/type/coverage）
```

### Verification Criteria

- [ ] SOP文档覆盖所有5个入口的标准化流程
- [ ] 自动化Gate在所有PR上执行，覆盖lint + type + coverage
- [ ] Reviewer分配脚本按模块轮换，可追溯
- [ ] 新PR的平均Review时间降低30%（基准测量后验证）

---

## Proposal 2: 测试覆盖率门槛强制执行

**优先级**: P0  
**影响工时**: 3h（修复Vitest配置） + 2h（CI集成）

### Problem/Opportunity

`vitest.config.ts` 中存在死代码，且配置的覆盖率门槛未在CI中强制执行：
- 当前配置中 `coverageThreshold` 被注释或无效
- PR即使测试覆盖率降至50%也能Merge
- canvas 6个新Hook（`useCanvasViewport`, `useCanvasGrid`, `useCanvasZoom`, `useCanvasPan`, `useCanvasSelection`, `useCanvasTool`）完全无测试

### Solution

**Phase 1 — 修复Vitest配置（3h）**
1. 清理 `vitest.config.ts` 中的死代码和注释
2. 设置合理的覆盖率门槛：
   - 全局: statements 70%, branches 65%, functions 70%, lines 70%
   - 新文件（canvas hooks）: 需达到 80%
3. 验证配置有效性：`vitest run --coverage`

**Phase 2 — CI集成（2h）**
- 在 `.github/workflows/ci.yml` 中添加 coverage check step
- 覆盖率不达标则PR状态设为 `failure`，block merge
- 生成覆盖率报告上传至 CI artifacts

### Implementation Sketch

```typescript
// vitest.config.ts 关键配置
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
        perFile: {
          'src/canvas/hooks/*.ts': 80,  // 新Hook更高要求
        },
      },
    },
  },
})
```

```yaml
# .github/workflows/ci.yml 新增
- name: Check Coverage
  run: |
    npx vitest run --coverage
    npx vitest coverage-thresholds
```

### Verification Criteria

- [ ] `vitest --coverage` 成功执行，无死代码错误
- [ ] CI中覆盖率不达标PR被block
- [ ] canvas 6个新Hook至少有单元测试覆盖
- [ ] 覆盖率报告在CI artifacts中可访问

---

## Proposal 3: 自动化Review Checklist增强

**优先级**: P1  
**影响工时**: 8h（ce:review技能增强）

### Problem/Opportunity

当前 `ce:review` 技能虽然存在，但未充分利用近期分析结果：
- 无法自动检测SOP违规（如5个入口点的不一致）
- 缺乏对Canvas API覆盖率的主动检查
- 未针对72%端点缺失测试发出警告

### Solution

增强 `ce:review` 技能，增加以下自动化检查模块：

| 模块 | 检查项 | 触发条件 |
|------|--------|----------|
| SOP合规 | Review入口一致性 | 每PR |
| 测试覆盖 | 新增API端点必须有测试 | 涉及API的PR |
| Canvas专检 | Hook覆盖率 + API端点测试 | 涉及canvas的PR |
| 安全扫描 | 敏感信息泄露、依赖漏洞 | 每PR |

### Implementation Sketch

```
/skills/ce-review/
  SKILL.md           # 更新主技能定义
  /checks/
    sop-compliance.js   # SOP合规检查
    canvas-api-test.js  # Canvas API测试覆盖检查
    security-scan.js    # 安全扫描
    coverage-gate.js    # 覆盖率门槛检查
```

**关键检查逻辑**：
```javascript
// canvas-api-test.js 示例
const UNTESTED_APIS = [
  'canvas:getViewport', 'canvas:setViewport',
  'canvas:exportImage', 'canvas:importSVG',
  // 共72%端点缺失，需列出清单
];

function checkCanvasAPIcoverage(prFiles) {
  const addedAPIs = extractAddedAPICalls(prFiles);
  const untested = addedAPIs.filter(api => UNTESTED_APIS.includes(api));
  if (untested.length > 0) {
    return {
      status: 'warn',
      message: `新增 ${untested.length} 个API调用缺少测试: ${untested.join(', ')}`,
      blocking: false,  // P1暂为warn，P0改为block
    };
  }
}
```

### Verification Criteria

- [ ] ce:review对所有PR自动运行，覆盖4个检查模块
- [ ] Canvas API测试缺失在PR评论中可见
- [ ] SOP合规检查可识别不一致入口
- [ ] 假阳性率 < 5%（通过抽样20个历史PR验证）

---

## Proposal 4: 关键路径E2E测试要求

**优先级**: P1  
**影响工时**: 12h（制定规范） + 20h（补充E2E测试）

### Problem/Opportunity

Canvas模块测试策略分析（2026-04-05）建议3层测试金字塔，但当前：
- E2E测试覆盖率严重不足
- 72%的API端点无任何测试
- 关键用户路径（创建画布、保存、导出）缺乏端到端验证

### Solution

**制定E2E测试规范（12h）**

定义关键路径清单，要求PR覆盖对应场景：

| 路径 | 场景 | 测试框架 |
|------|------|----------|
| Canvas创建 | 新建 → 命名 → 设置尺寸 → 确认 | Playwright |
| 元素操作 | 添加矩形 → 移动 → 缩放 → 删除 | Playwright |
| 保存与导出 | 保存项目 → 导出PNG → 下载验证 | Playwright |
| 撤销/重做 | 操作 → Ctrl+Z → Ctrl+Y → 状态验证 | Playwright |
| 协作同步 | 多用户编辑 → 同步延迟 < 500ms | Playwright |

**补充E2E测试（20h）**
- 为5条关键路径各编写2-3个测试用例
- 覆盖正常路径 + 边界条件 + 错误处理
- 纳入CI，每次PR强制运行

### Implementation Sketch

```
/e2e/
  /critical-paths/
    canvas-creation.spec.ts
    element-operations.spec.ts
    save-export.spec.ts
    undo-redo.spec.ts
    collaboration-sync.spec.ts
  /fixtures/
    test-projects.json    # 测试用项目数据
    mock-users.ts         # 协作测试mock用户
```

```typescript
// canvas-creation.spec.ts 示例
test('用户可以创建新画布并设置尺寸', async ({ page }) => {
  await page.goto('/canvas/new');
  await page.getByLabel('画布名称').fill('测试画布');
  await page.getByLabel('宽度').fill('1920');
  await page.getByLabel('高度').fill('1080');
  await page.getByRole('button', { name: '创建' }).click();
  
  // 验证画布创建成功
  await expect(page.locator('.canvas-container')).toBeVisible();
  await expect(page.locator('.canvas-title')).toHaveText('测试画布');
  
  // 验证尺寸
  const viewport = page.locator('.canvas-viewport');
  await expect(viewport).toHaveAttribute('data-width', '1920');
  await expect(viewport).toHaveAttribute('data-height', '1080');
});
```

### Verification Criteria

- [ ] 5条关键路径E2E测试完成，覆盖率100%
- [ ] E2E测试纳入CI，失败则block merge
- [ ] 测试运行时间 < 5分钟（CI优化）
- [ ] 关键路径测试稳定性 > 95%（无flaky test）

---

## Proposal 5: Review指标追踪系统

**优先级**: P2  
**影响工时**: 6h（系统搭建） + 持续迭代

### Problem/Opportunity

当前缺乏Review过程的量化指标：
- 无法衡量Review效率改进效果
- Reviewer工作量分布不透明
- PR cycle time无追踪，难优化

### Solution

构建轻量级Review指标追踪系统：

| 指标 | 定义 | 采集方式 |
|------|------|----------|
| PR Cycle Time | 创建→Merge时间 | GitHub API |
| Review Duration | 首次Review时间 | GitHub API |
| Reviewer Load | 各Reviewer处理的PR数 | GitHub API |
| Comment Count | PR评论数（质量代理） | GitHub API |
| Gate Failure Rate | 自动化Gate失败率 | CI API |
| Rework Rate | 需要返工的PR比例 | 手动标注 |

**数据收集与展示**：
```bash
# 每周生成报告
node scripts/review-metrics.js --weekly --output docs/review-metrics/weekly-$(date +%Y-%m-%d).md
```

Dashboard看板（可选）：用GitHub Issue + Projects追踪趋势

### Implementation Sketch

```
/scripts/
  review-metrics.js      # 指标采集脚本
  review-report.js       # 报告生成脚本
/docs/
  review-metrics/        # 周报存储
    weekly-2026-04-05.md
    weekly-2026-04-12.md
```

### Verification Criteria

- [ ] 每周自动生成Review指标报告
- [ ] 关键指标（Cycle Time, Gate Failure Rate）有历史趋势
- [ ] Reviewer Load分布可视化
- [ ] 基于数据提出至少1项改进建议（季度复盘）

---

## 实施路线图

| 周期 | P0提案 | P1提案 | P2提案 |
|------|--------|--------|--------|
| 2026-04-07 | ✅ SOP标准化 + ✅ 覆盖率门槛 | E2E测试规范 | 指标追踪规划 |
| 2026-04-14 | 审查自动化增强 | E2E测试补充 | 指标系统上线 |
| 2026-04-21 | 指标系统迭代 | 持续补充 | 季度复盘 |

---

## 附录：近期分析依据

| 分析项 | 来源 | 关键发现 |
|--------|------|----------|
| reviewer-process-standard | 内部审计 | 5入口、8不一致 |
| test-coverage-gate | vitest.config.ts审计 | 死代码 + 门槛未执行 |
| canvas-testing-strategy | 测试策略分析 | 6 Hook无测试 |
| canvas-api-completion | API审计 | 72%端点缺失 |

---

*提案人: Analyst  
*评审人: 待指派  
*创建时间: 2026-04-05
