# AGENTS.md: VibeX PM Features 2026-04-10

> **项目**: vibex-pm-features-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev** | @dev | 前端实现 + 组件开发 |
| **Reviewer** | @reviewer | 代码审查 + UX 审查 |
| **Tester** | @tester | E2E 测试 + 验收 |

---

## 2. Dev Agent 职责

### 2.1 任务分配

| Task | 描述 | 工时 | 产出 |
|------|------|------|------|
| S1.1 | 模板数据结构 | 0.5h | `data/templates/*.json` |
| S1.2 | /templates 页面 | 1.5h | `app/templates/page.tsx` |
| S1.3 | 模板填充逻辑 | 1h | `hooks/useTemplateFill.ts` |
| S2.1 | 引导流程设计 | 0.5h | `data/onboarding-steps.ts` |
| S2.2 | Highlight + Tooltip | 1h | `OnboardingHighlight.tsx` |
| S2.3 | 引导状态持久化 | 0.5h | `hooks/useOnboarding.ts` |
| S3.1 | E2E 集成测试 | 0.5h | `tests/e2e/onboarding.spec.ts` |

### 2.2 提交规范

```bash
# 格式: <type>(<scope>): <description>
# 示例:
git commit -m "feat(templates): S1.1 add ecommerce template data"
git commit -m "feat(templates): S1.2 create /templates page"
git commit -m "feat(onboarding): S2.1 add onboarding steps config"
git commit -m "feat(onboarding): S2.2 implement OnboardingHighlight"
```

### 2.3 禁止事项

| 禁止 | 正确方式 |
|------|---------|
| 引导阻塞核心操作 | 提供跳过按钮 |
| 引导重复弹出 | localStorage 标记 |
| 模板数据硬编码 | JSON 文件管理 |
| 刷新后状态丢失 | localStorage/sessionStorage |

---

## 3. Reviewer Agent 职责

### 3.1 UX 审查清单

**每个 PR 必须通过**:

```bash
# UX-01: 引导不阻塞操作
grep -rn "pointer-events: none" vibex-fronted/src/
# 确保引导可跳过

# UX-02: 模板加载性能
curl -w "%{time_total}" -o /dev/null -s http://localhost:3000/templates
# 首屏时间应 < 2s

# UX-03: 响应式布局
# 验证 3 个分辨率：375px / 768px / 1440px
```

### 3.2 代码审查清单

| 检查项 | 标准 |
|--------|------|
| 组件拆分 | 每个组件 < 200 行 |
| 命名规范 | PascalCase (组件) / camelCase (函数/变量) |
| TypeScript | 无 `any`，类型完整 |
| 测试覆盖 | E2E 覆盖引导完整流程 |

### 3.3 驳回条件

1. 引导无法跳过
2. 刷新后引导重复弹出
3. 模板页面在移动端布局错乱
4. 引入新的 `any` 类型

---

## 4. Tester Agent 职责

### 4.1 E2E 测试用例

| 用例 | 步骤 | 验收 |
|------|------|------|
| UC-01: 首次访问引导 | 清除 localStorage → 访问 dashboard → 引导弹出 | 引导可见 |
| UC-02: 完成引导 | 点击下一步 × 3 → 完成 | localStorage 标记 |
| UC-03: 跳过引导 | 点击跳过 | 引导消失 |
| UC-04: 刷新不重复 | 完成引导 → 刷新页面 | 引导不弹出 |
| UC-05: 模板列表 | 访问 /templates | 3 个模板可见 |
| UC-06: 模板填充 | 选择模板 → 跳转 dashboard | 输入框自动填充 |

### 4.2 验收报告格式

```markdown
## Test Report: vibex-pm-features-20260410

| Test Case | Status | Notes |
|----------|--------|-------|
| UC-01: 首次访问引导 | PASS | 引导正确弹出 |
| UC-02: 完成引导 | PASS | localStorage 标记正确 |
| UC-03: 跳过引导 | PASS | 引导消失 |
| UC-04: 刷新不重复 | PASS | 不重复弹出 |
| UC-05: 模板列表 | PASS | 3 个模板显示 |
| UC-06: 模板填充 | PASS | 输入框自动填充 |

**结论**: 6/6 通过 ✅
```

---

## 5. Coord Agent 职责

### 5.1 进度追踪

**每日检查**:
```bash
# 检查 Sprint 进度
ls docs/vibex-pm-features-20260409/specs/

# 检查 E2E 测试
grep -rn "test(" tests/e2e/onboarding.spec.ts | wc -l
# 应 ≥ 6
```

---

## 6. Definition of Done

### 6.1 Sprint DoD

- [ ] 模板 JSON 数据文件 3 个行业
- [ ] /templates 页面响应式布局正常
- [ ] 引导流程 4 步内完成
- [ ] 跳过按钮功能正常
- [ ] 引导状态持久化
- [ ] E2E 测试全部通过

### 6.2 Epic DoD

| Epic | DoD |
|------|-----|
| E1: 模板系统 | 3 个模板可选择，选择后自动填充 |
| E2: 引导流程 | 引导可完成/跳过，状态不重复弹出 |

---

## 7. 文件清单

| 文件 | 路径 | 负责人 |
|------|------|--------|
| template.ts | `vibex-fronted/src/types/` | Dev |
| templates/*.json | `vibex-fronted/data/templates/` | Dev |
| templates/page.tsx | `vibex-fronted/src/app/templates/page.tsx` | Dev |
| TemplateCard.tsx | `vibex-fronted/src/components/` | Dev |
| useTemplateFill.ts | `vibex-fronted/src/hooks/` | Dev |
| onboarding-steps.ts | `vibex-fronted/data/` | Dev |
| OnboardingOverlay.tsx | `vibex-fronted/src/components/` | Dev |
| OnboardingHighlight.tsx | `vibex-fronted/src/components/` | Dev |
| useOnboarding.ts | `vibex-fronted/src/hooks/` | Dev |
| onboarding.spec.ts | `vibex-fronted/tests/e2e/` | Tester |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
