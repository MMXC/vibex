# 开发约束: VibeX 页面结构整合

**项目**: vibex-page-structure-consolidation  
**版本**: 1.0  
**日期**: 2026-03-21  
**架构师**: Architect Agent

---

## 1. Dev Agent 约束

### 1.1 Phase 1 — 路由重定向

**强制规则**:

1. **不删除任何现有页面文件**
   - 保留 `src/app/confirm/` 和 `src/app/requirements/` 的所有文件
   - 只修改为重定向逻辑
   - 原因: 保留备份，Phase 4 才真正删除

2. **重定向实现优先级**
   - 优先使用 Next.js 14 App Router `redirect()` (服务端组件)
   - 如果 `output: 'export'` 限制，则使用客户端 `router.replace('/')`
   - **禁止**: 硬编码 `<meta http-equiv="refresh">`

3. **@deprecated 注释规范**
   ```typescript
   /** @deprecated Use / instead. Redirects to / since 2026-03-21. To be removed in Phase 4. */
   ```

4. **导航栏修改范围**
   - 只修改 `src/components/layout/` 下的文件
   - 不修改 `src/components/homepage/` 下的任何文件
   - 不修改 `src/app/design/` 下的任何文件

### 1.2 Phase 2 — Homepage 强化

**强制规则**:

1. **不修改现有 Step 组件的内部逻辑**
   - 只检查覆盖度，不改变实现
   - 如发现覆盖度不足，新增组件而非修改现有组件

2. **新增组件命名规范**
   ```typescript
   // ✅ 正确
   src/components/homepage/steps/StepClarification.tsx
   src/components/homepage/steps/StepUIGeneration.tsx
   
   // ❌ 错误
   src/components/homepage/ClarificationStep.tsx
   src/components/design/NewUIGenStep.tsx
   ```

3. **Store 扩展规范**
   - 在 `confirmationStore.ts` 中**追加**类型，不修改现有类型
   - 使用 TypeScript `Omit` 和 `&` 扩展
   - **禁止**: 修改 `ConfirmationStep` 枚举或现有字段类型

### 1.3 Phase 3 — Design 合并

**强制规则**:

1. **保留 `/design` 原有功能**
   - 迁移组件时，保留原始 `/design/*` 页面的完整功能
   - 直到 Phase 3 完成且 E2E 验证通过后，才考虑删除
   - 原因: Design 作为独立设计工具保留

2. **懒加载要求**
   - `StepUIGeneration.tsx` 必须使用 `next/dynamic` 懒加载
   - `loading.tsx` 引用 `StepLoading` 组件

3. **双向数据同步**
   - 设计同步机制时，**优先**从 `confirmationStore` 读取
   - 不要让 `designStore` 依赖 `confirmationStore` 的实现细节
   - 使用 **事件/回调** 而非直接状态引用

4. **代码复用优先**
   - 优先将逻辑抽取为共享 hook/util
   - 禁止: 直接复制粘贴 `/design` 代码到 Homepage

### 1.4 Phase 4 — 清理

**强制规则**:

1. **删除前必须通过检查清单** (见 IMPLEMENTATION_PLAN.md T4.2)
   - 必须全部 PASS 才可执行删除
   - 任何一个 FAIL 必须修复后才能继续

2. **Git 提交规范**
   ```bash
   git rm -r src/app/confirm/
   git commit -m "chore: remove deprecated /confirm routes (Phase 4)
   
   BREAKING CHANGE: /confirm/* routes removed. Use / instead.
   Refs: vibex-page-structure-consolidation"
   ```

3. **构建验证**
   - `npm run build` 必须通过
   - `npm run lint` 必须 0 errors
   - 任何新增 lint warning 必须修复

---

## 2. Tester Agent 约束

### 2.1 测试覆盖要求

| Phase | 覆盖率要求 | 测试类型 |
|-------|-----------|----------|
| Phase 1 | 100% 路由 | E2E (Playwright) |
| Phase 2 | 核心步骤 100% | E2E + 组件测试 |
| Phase 3 | 新增步骤 100% | E2E |
| Phase 4 | 清理验证 100% | 构建 + E2E |

### 2.2 关键测试用例

#### Phase 1 — 重定向测试

```typescript
test.describe('Redirect tests (Phase 1)', () => {
  const routes = [
    '/confirm',
    '/confirm/context',
    '/confirm/flow',
    '/confirm/model',
    '/confirm/success',
    '/requirements',
    '/requirements/new',
  ];
  
  for (const route of routes) {
    test(`${route} redirects to /`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
    });
  }
});
```

#### Phase 2 — Homepage 功能测试

```typescript
test.describe('Homepage coverage (Phase 2)', () => {
  test('Step 1: Requirement input available', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('textbox')).toBeVisible();
  });
  
  test('Step 2: Bounded context generation available', async ({ page }) => {
    await page.goto('/');
    // ... 输入需求后验证上下文步骤
    await expect(page.getByRole('button', { name: /generate context/i })).toBeVisible();
  });
});
```

#### Phase 3 — 新增步骤测试

```typescript
test.describe('Clarification step (Phase 3)', () => {
  test('Clarification can be triggered from Homepage', async ({ page }) => {
    await page.goto('/');
    // 完成前几步...
    await expect(page.getByText(/clarification/i)).toBeVisible();
  });
});

test.describe('UI Generation (Phase 3)', () => {
  test('UI Generation triggered as optional step', async ({ page }) => {
    await page.goto('/');
    // 完成全流程...
    const generateUIButton = page.getByRole('button', { name: /generate.*ui/i });
    if (await generateUIButton.isVisible()) {
      await generateUIButton.click();
      await expect(page.getByText(/ui generation/i)).toBeVisible();
    }
  });
});
```

### 2.3 回归测试

**每个 Phase 完成后必须运行**:
```bash
npm run test:e2e -- --grep "Homepage"
npm run test:e2e -- --grep "Design"
npm run build
```

---

## 3. Reviewer Agent 约束

### 3.1 PR 审查清单

对于每个 Phase 的 PR，必须检查:

#### Phase 1 审查

- [ ] 重定向逻辑正确（301 或客户端 redirect）
- [ ] 未删除任何文件
- [ ] @deprecated 注释格式正确
- [ ] 导航栏只移除了指定链接
- [ ] E2E 测试覆盖所有旧路由
- [ ] 无 lint errors

#### Phase 2 审查

- [ ] 未修改现有 Step 组件的内部逻辑
- [ ] 新增组件命名规范正确
- [ ] confirmationStore 类型扩展未破坏现有类型
- [ ] 覆盖度验证有测试支撑

#### Phase 3 审查

- [ ] /design/* 原有功能仍然可用
- [ ] StepUIGeneration 使用懒加载
- [ ] 状态同步使用事件/回调模式
- [ ] 代码复用（无直接复制粘贴）

#### Phase 4 审查

- [ ] 删除前检查清单全部 PASS
- [ ] Git commit message 包含 BREAKING CHANGE
- [ ] 构建和 lint 验证通过
- [ ] 无残留引用（grep 验证）

### 3.2 驳回条件

满足以下任一条件，驳回并要求修改:

1. **破坏现有功能**: 任何 E2E 测试失败
2. **类型不安全**: TypeScript 编译错误或 `as any` 滥用
3. **绕过检查清单**: Phase 4 未通过删除前检查清单
4. **无测试**: 新增功能无测试覆盖
5. **重定向失效**: 任何旧路由不再重定向

---

## 4. 通用约束

### 4.1 禁止事项

- ❌ 禁止在 Phase 1 删除任何文件
- ❌ 禁止修改 `/design` 的原有页面（仅迁移组件）
- ❌ 禁止修改 `designStore` 的现有类型定义
- ❌ 禁止硬编码重定向 URL（使用常量）
- ❌ 禁止在 Phase 4 前删除 `@deprecated` 注释的文件

### 4.2 文件变更范围

| 允许变更 | 禁止变更 |
|---------|---------|
| `src/app/confirm/page.tsx` | `src/components/homepage/steps/*.tsx` (Phase 2 前) |
| `src/app/requirements/page.tsx` | `src/stores/designStore.ts` (类型) |
| `src/components/layout/*.tsx` | `src/app/design/page.tsx` (原有功能) |
| `src/components/homepage/steps/StepClarification.tsx` (Phase 3) | `src/app/design/bounded-context/page.tsx` |
| `src/components/homepage/steps/StepUIGeneration.tsx` (Phase 3) | `src/app/confirm/` (Phase 4 前) |
| `src/stores/confirmationStore.ts` (扩展) | `src/app/requirements/` (Phase 4 前) |
| `tests/e2e/redirects.spec.ts` | |

### 4.3 代码风格

- 遵循现有 `.eslintrc` 和 `.prettierrc` 配置
- 新增组件使用现有的 CSS Module 模式
- Store 扩展使用 TypeScript strict 模式

---

*Architect Agent | 2026-03-21*
