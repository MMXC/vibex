# 实施计划: VibeX 页面结构整合

**项目**: vibex-page-structure-consolidation  
**版本**: 1.0  
**日期**: 2026-03-21  
**架构师**: Architect Agent

---

## 1. 实施概览

| 阶段 | 目标 | 工时 | 优先级 | 风险 |
|------|------|------|--------|------|
| Phase 1 | 路由重定向 + 导航清理 | 1 天 | P0 | 🟢 低 |
| Phase 2 | Homepage 流程强化 + 评估 | 3-5 天 | P0 | 🟡 中 |
| Phase 3 | Design 步骤渐进合并 | 5-7 天 | P1 | 🟡 中 |
| Phase 4 | 废弃代码清理 | 1-2 天 | P2 | 🟡 中 |

**总工期**: ~10-15 个工作日

---

## 2. Phase 1: 路由重定向（Day 1）

**目标**: 止血，防止用户进入废弃流程

### 2.1 任务分解

```
Phase 1: 路由重定向 (Dev)
├── T1.1 配置 Next.js 重定向规则
│   └── 文件: next.config.ts 或 src/app/confirm/page.tsx
├── T1.2 配置 /requirements 重定向
│   └── 文件: src/app/requirements/page.tsx
├── T1.3 更新导航栏，移除废弃入口
│   └── 文件: src/components/layout/*.tsx
├── T1.4 添加 @deprecated 注释到废弃文件
│   └── 批量: grep + sed
└── T1.5 E2E 测试验证重定向
    └── 文件: tests/e2e/redirects.spec.ts
```

### 2.2 详细任务

#### T1.1 配置 `/confirm` 重定向

**实现方案** (output: 'export' 约束):

```typescript
// src/app/confirm/page.tsx
// src/app/confirm/context/page.tsx 等所有页面
import { redirect } from 'next/navigation';

export default function ConfirmPage() {
  redirect('/');
}
```

**备选方案** (客户端降级):
```typescript
// src/app/confirm/page.tsx (for static export)
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}
```

#### T1.2 配置 `/requirements` 重定向

同上，应用于:
- `src/app/requirements/page.tsx`
- `src/app/requirements/new/page.tsx`

#### T1.3 导航栏更新

**检查文件**:
```bash
grep -rn "/confirm\|/requirements" src/components/layout/
```

**修改清单**:
1. 移除 `href="/confirm"` 的 Link/NavLink
2. 移除 `href="/requirements"` 的 Link/NavLink
3. 保留 `/` 和 `/design` 入口

#### T1.4 @deprecated 注释

```bash
# 批量添加（需 review）
for f in src/app/confirm/**/page.tsx src/app/requirements/**/page.tsx; do
  [ -f "$f" ] && sed -i '1i/** @deprecated Use / instead. Redirects to / since 2026-03-21 */' "$f"
done
```

#### T1.5 E2E 重定向测试

```typescript
// tests/e2e/redirects.spec.ts
import { test, expect } from '@playwright/test';

const REDIRECT_ROUTES = [
  '/confirm',
  '/confirm/context',
  '/confirm/flow',
  '/confirm/model',
  '/requirements',
  '/requirements/new',
];

for (const route of REDIRECT_ROUTES) {
  test(`GET ${route} redirects to /`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
  });
}
```

### 2.3 Phase 1 验收标准

- [ ] 所有 `/confirm/*` 路由返回 301/302 或 redirect 到 `/`
- [ ] 所有 `/requirements/*` 路由返回 301/302 或 redirect 到 `/`
- [ ] 导航栏无 `/confirm` 和 `/requirements` 链接
- [ ] 所有废弃 page.tsx 包含 `@deprecated` 注释
- [ ] E2E 测试 `page.goto('/confirm/context')` 最终 URL 为 `/`
- [ ] `npm run build` 通过，无新增错误

---

## 3. Phase 2: Homepage 流程强化（Day 2-6）

**目标**: 确认 Homepage 包含所有核心步骤，评估 Design 独特功能

### 3.1 任务分解

```
Phase 2: Homepage 强化 (Dev + Tester)
├── T2.1 验证 StepRequirementInput 覆盖度
│   └── 对比: Homepage vs /requirements/page.tsx
├── T2.2 验证 StepBoundedContext 覆盖度
│   └── 对比: Homepage vs /confirm/context vs /design/bounded-context
├── T2.3 验证 StepDomainModel 覆盖度
│   └── 对比: Homepage vs /confirm/model vs /design/domain-model
├── T2.4 验证 StepBusinessFlow 覆盖度
│   └── 对比: Homepage vs /confirm/flow vs /design/business-flow
├── T2.5 产出 Clarification 评估报告
│   └── 已有: specs/assessment-clarification.md
└── T2.6 产出 UI Generation 评估报告
    └── 已有: specs/assessment-ui-generation.md
```

### 3.2 详细任务

#### T2.1-T2.4 Homepage 覆盖度验证

**验证方法**:

```bash
# 1. 列出各流程的步骤文件
echo "=== Homepage Steps ===" && ls src/components/homepage/steps/
echo "=== Confirm Context ===" && cat src/app/confirm/context/page.tsx | head -30
echo "=== Design Context ===" && cat src/app/design/bounded-context/page.tsx | head -30
```

**对比检查表**:

| 功能 | Homepage Step | Confirm | Design | 覆盖状态 |
|------|---------------|---------|--------|----------|
| 需求输入 | StepRequirementInput | ❌ | ❌ | ✅ 完整 |
| 限界上下文生成 | StepBoundedContext | ✅ (显示) | ✅ (编辑) | ⚠️ 需确认 Homepage 包含编辑 |
| 领域模型生成 | StepDomainModel | ✅ (显示) | ✅ (编辑) | ⚠️ 需确认 Homepage 包含编辑 |
| 业务流程生成 | StepBusinessFlow | ✅ (显示) | ✅ (编辑) | ⚠️ 需确认 Homepage 包含编辑 |
| 项目创建 | StepProjectCreate | ✅ | ❌ | ✅ 完整 |

**如发现 Homepage 缺少某功能**:
1. 在 `docs/vibex-page-structure-consolidation/coverage-gap.md` 记录
2. 决定：新增 Homepage Step 或标记为 Design 特有功能

### 3.3 Phase 2 验收标准

- [ ] 所有核心步骤在 Homepage 可用（Step1-5）
- [ ] 评估报告已产出（已有 ✅）
- [ ] 覆盖度 gap 文档产出（如有）
- [ ] 现有 E2E 测试全部通过
- [ ] `npm run build` 通过

---

## 4. Phase 3: Design 步骤渐进合并（Day 7-13）

**目标**: 将有价值的功能逐步合并到 Homepage

### 4.1 任务分解

```
Phase 3: Design 合并 (Dev)
├── T3.1 迁移 Clarification 到 Homepage (Step 2.5)
│   ├── 提取 /design/clarification 组件 → StepClarification.tsx
│   ├── 扩展 confirmationStore 添加 clarificationRounds
│   ├── 集成到 Homepage steps 数组
│   └── E2E 测试验证
├── T3.2 集成 UI Generation (Step 6, 可选触发)
│   ├── 提取 /design/ui-generation 核心逻辑
│   ├── 创建 StepUIGeneration.tsx（懒加载）
│   ├── 扩展 confirmationStore 添加 uiGenerationData
│   ├── 在 Homepage 添加"生成 UI"按钮（不是默认步骤）
│   └── E2E 测试验证
├── T3.3 状态同步桥接
│   ├── 设计双向数据同步机制
│   └── 验证 Design 页面与 Homepage 状态一致
└── T3.4 全流程 E2E 测试
    └── 完整 Homepage 流程（包含新增步骤）测试
```

### 4.2 详细任务

#### T3.1 Clarification 迁移

**Step 1: 提取组件**

```bash
# 源文件
ls src/app/design/clarification/

# 目标文件
src/components/homepage/steps/StepClarification.tsx
```

**Step 2: 扩展 Store**

```typescript
// confirmationStore.ts 新增
clarificationRounds: ClarificationRound[];
addClarificationRound: (round: ClarificationRound) => void;
acceptClarificationRound: (id: string) => void;
```

**Step 3: 集成到 Homepage**

```typescript
// src/components/homepage/HomePage.tsx
const steps = [
  StepRequirementInput,
  StepBoundedContext,
  StepClarification,  // 新增: Step 2.5
  StepDomainModel,
  StepBusinessFlow,
  StepProjectCreate,
];
```

#### T3.2 UI Generation 集成

**重点**: UI Generation 是可选步骤，不在默认 Homepage 流程中。

**集成方式**:
1. 在 StepProjectCreate 之前添加"生成 UI 原型"按钮
2. 点击后显示 StepUIGeneration 作为模态或侧边面板
3. 不改变默认的 5 步流程

```typescript
// StepProjectCreate.tsx 中的 UI 触发
const handleGenerateUI = () => {
  setShowUIGeneration(true);
};
```

### 4.3 Phase 3 验收标准

- [ ] StepClarification.tsx 组件可用，E2E 测试通过
- [ ] confirmationStore 包含 clarificationRounds 类型和操作
- [ ] StepUIGeneration.tsx 懒加载正常，无初始 bundle 影响
- [ ] UI Generation 可通过 Homepage 触发
- [ ] Design 页面与 Homepage 状态同步正常
- [ ] 全流程 E2E 测试通过（包含新增步骤）
- [ ] `npm run build` + `npm run lint` 通过

---

## 5. Phase 4: 废弃代码清理（Day 14-15）

**目标**: 删除废弃目录和组件，降低维护负担

### 5.1 任务分解

```
Phase 4: 清理 (Dev)
├── T4.1 删除 /confirm 目录
│   ├── 确认无残留引用 (grep -r "/confirm" src/)
│   ├── 删除 src/app/confirm/
│   └── 构建验证
├── T4.2 删除 /requirements 目录
│   ├── 确认无残留引用 (grep -r "/requirements" src/)
│   ├── 删除 src/app/requirements/
│   └── 构建验证
├── T4.3 删除废弃组件
│   ├── ConfirmationSteps.tsx
│   ├── 其他仅被废弃流程使用的组件
│   └── grep 确认无残留引用
├── T4.4 清理废弃 Store
│   ├── 确认无 legacyConfirmationStore
│   └── 删除废弃 store 代码（如有）
└── T4.5 更新文档
    ├── README.md 更新路由说明
    └── docs/architecture/routing.md 更新（如有）
```

### 5.2 删除前检查清单

```bash
#!/bin/bash
# 删除前必须全部 PASS

echo "=== 检查 /confirm 残留引用 ==="
refs=$(grep -rn "/confirm" src/ --include="*.ts" --include="*.tsx" | grep -v "deprecated" | grep -v "\.test\." | grep -v "spec\." || true)
[ -n "$refs" ] && echo "FAIL: $refs" || echo "PASS: 无残留引用"

echo "=== 检查 /requirements 残留引用 ==="
refs=$(grep -rn "/requirements" src/ --include="*.ts" --include="*.tsx" | grep -v "deprecated" | grep -v "\.test\." | grep -v "spec\." || true)
[ -n "$refs" ] && echo "FAIL: $refs" || echo "PASS: 无残留引用"

echo "=== 检查 ConfirmationSteps 引用 ==="
refs=$(grep -rn "ConfirmationSteps" src/ --include="*.ts" --include="*.tsx" | grep -v "deprecated" || true)
[ -n "$refs" ] && echo "FAIL: $refs" || echo "PASS: 无残留引用"

echo "=== 构建验证 ==="
npm run build && echo "PASS: 构建成功"
```

### 5.3 Phase 4 验收标准

- [ ] `src/app/confirm/` 目录不存在
- [ ] `src/app/requirements/` 目录不存在
- [ ] `ConfirmationSteps.tsx` 不存在
- [ ] 无残留引用（grep 验证）
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过（0 errors）
- [ ] README.md 更新

---

## 6. 实施优先级与依赖

### 6.1 依赖关系

```
T1.1 重定向配置
└── T1.2 /requirements 重定向
    └── T1.3 导航栏更新
        └── T1.4 @deprecated 注释
            └── T1.5 E2E 测试
                └── Phase 2 Homepage 强化
                    └── Phase 3 Design 合并
                        └── Phase 4 清理
```

### 6.2 并行化机会

- **T2.1-T2.4 Homepage 覆盖度验证**: 可并行执行（各自独立检查）
- **T3.1 Clarification 迁移** 和 **T3.2 UI Generation 集成**: 可并行开发，最后集成

### 6.3 关键里程碑

| 里程碑 | 日期 | 验收 |
|--------|------|------|
| M1: Phase 1 完成 | Day 1 | 重定向生效，用户不再进入废弃流程 |
| M2: Phase 2 完成 | Day 6 | Homepage 功能完整 |
| M3: Phase 3 完成 | Day 13 | Design 功能已渐进合并 |
| M4: Phase 4 完成 | Day 15 | 废弃代码清理完成 |

---

## 7. 回滚计划

| Phase | 回滚方法 |
|-------|----------|
| Phase 1 | 删除重定向代码，恢复 `next.config.ts` 原有配置 |
| Phase 2 | 保留 Homepage Step 组件，无需回滚 |
| Phase 3 | 删除 `StepClarification.tsx` 和 `StepUIGeneration.tsx`，恢复 confirmationStore 类型 |
| Phase 4 | 从 Git 恢复 `src/app/confirm/` 和 `src/app/requirements/` |

---

*Architect Agent | 2026-03-21*
