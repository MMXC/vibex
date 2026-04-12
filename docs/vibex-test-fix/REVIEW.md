# 架构审查报告 — vibex-test-fix

**审查人**: Architect Agent (外部审查)
**日期**: 2026-04-12
**审查范围**: architecture.md / IMPLEMENTATION_PLAN.md / AGENTS.md / prd.md / analysis.md + 实际测试文件交叉验证

---

## 总体评价

**有条件通过 — 建议修复以下问题后执行。**

核心架构决策（集中式 IO Mock、jest-axe 安装）方向正确，文件变更范围清晰。但存在以下需明确或修复的问题：

1. **Epic 3 实施计划缺乏具体的代码改动点** — 仅"4 处修复""5 处修复"描述，无法直接执行
2. **Epic 4 验收标准"失败数 ≤ 26"是错误的** — 修复后应小于 26，而非不增加
3. **lazy loading "NOT visible" 测试的 mock override 机制存在理论风险**
4. **jest-axe 与 @testing-library/jest-dom 混用规范未明确**

---

## 维度 1: 根因分析是否完整？是否有遗漏？

- **判定**: 建议
- **理由**: 覆盖了全部 4 个根因（IO mock 缺失、CardTreeNode TypeScript 错误、jest-axe 缺失、选择器不精确），但对 Epic 3 选择器问题的具体失败信息描述不足。
- **具体问题**:

  1. **Epic 3 失败数量存在矛盾**：`analysis.md` 称 dashboard 有 5 个失败，export 有 1 个失败，page 有 4 个失败（合计 10 个）。但实际 `dashboard/page.test.tsx` 有 31 个测试、`page.test.tsx` 有 4 个、`export/page.test.tsx` 有 13 个。文档未说明这 10 个失败具体对应哪些测试行，无法验证是否真的只有 10 个。

  2. **page.test.tsx 的实际失败信息不明**：文档说 4 个 TestingLibraryElementError（元素未找到），但 4 个测试都只断言 `getByText('VibeX')`，这在 nav 存在时应该能找到。实际失败可能另有原因（如 next/navigation mock 冲突），建议实施前先跑一次 `vitest run page.test.tsx` 确认真实错误信息。

  3. **潜在遗漏：`useFloatingMode.ts` 无独立测试**（analysis.md 第 1 节已提到），但如果未来有测试依赖它，当前集中式 IO Mock 可以兜底，无额外风险。

  4. **`page.test.tsx` 内 `vi.mock('next/navigation')` 与 `setup.ts` 全局 mock 可能冲突**：两个 mock 都定义了 `useRouter`，vitest 的模块 mock 是覆盖式的而非合并，`page.test.tsx` 中的 `vi.mock` 会覆盖 `setup.ts` 的 `useRouter`。这在单文件时能工作，但如果未来有测试共享 context，行为不一致。当前无实测数据，风险等级：低。

- **修复建议**:
  - 实施 Epic 3 前，先运行 `npx vitest run src/app/page.test.tsx --no-coverage 2>&1 | head -80` 获取真实错误信息
  - 同样处理 dashboard 和 export
  - 将真实失败信息（具体哪一行、什么错误）补充到 architecture.md §2.4 或单独的问题清单文件

---

## 维度 2: 方案选择是否合理？集中式 vs 分散 mock 的取舍

- **判定**: OK ✅
- **理由**:
  - 集中式 mock 是正确选择：IO Mock 影响范围是所有使用 IntersectionObserver 的组件，而 jsdom 不提供该 API，集中 mock 一劳永逸
  - 历史经验（vibex-test-env-fix commit `32667283`）支撑决策，降低实施风险
  - 弃选的方案 B（改生产代码）、方案 C（只修本地 mock）取舍正确
- **具体问题**: 无

---

## 维度 3: IntersectionObserver mock 实现是否正确？TypeScript 类型处理

- **判定**: 风险 ⚠️
- **理由**: Mock 结构本身正确，但存在一个关键风险：lazy loading "NOT visible" 测试的 mock override 机制。

- **具体问题 1（关键）— lazy loading "NOT visible" 测试的 mock 失效风险**:

  当前 `CardTreeNode.test.tsx` 的测试（L151-173）使用 `mockImplementationOnce` 来覆盖 mock：

  ```typescript
  (global.IntersectionObserver as any).mockImplementationOnce(
    (_callback: IntersectionObserverCallback) => ({
      observe: vi.fn(), // 不调用 callback
      ...
    })
  );
  ```

  实施计划将这段本地 mock **完全移除**（S1.2），改为依赖全局 `setup.ts` mock。但当 `setup.ts` 中的 `IntersectionObserver` 是一个 `vi.fn()` 时：

  - `beforeAll` 阶段：全局 `IntersectionObserver` 被设置为 `vi.fn(() => ({ observe: vi.fn(), ... }))`
  - `beforeEach` 阶段：`vi.fn()` 的所有 mock 状态被 `vi.clearAllMocks()` 清除
  - 测试执行：尝试 `mockImplementationOnce`... **但 `IntersectionObserver` 是全局属性引用，不是 vi.fn 实例本身**

  换句话说，`beforeAll` 设置的是 `global.IntersectionObserver = vi.fn()`（函数 A），测试中尝试做的是：
  ```typescript
  global.IntersectionObserver.mockImplementationOnce(...)
  ```

  这依赖于 `global.IntersectionObserver` 本身是一个 `vi.fn()` 实例（Vitest 创建的对象）。经分析，这**应该可以工作**——`vi.fn()` 返回值可以被 `mockImplementationOnce` 链式调用。但这个机制在 Vitest 4.x 中的行为需实测验证。

- **具体问题 2（轻微）— Mock observe 方法签名类型**:
  
  架构定义的 `observe`：
  ```typescript
  observe: vi.fn((element: Element) => {
    callback([...], global.IntersectionObserver as unknown as IntersectionObserver)
  })
  ```
  
  `vi.fn()` 默认返回 `undefined`，需要明确 `vi.fn(() => {...})` 形式才能返回对象。上述写法正确（传入工厂函数）。

- **具体问题 3（信息）— `vi.clearAllMocks()` vs `vi.resetAllMocks()`**:
  
  `setup.ts` 全局 mock 在每个测试文件执行完毕后，`vi.clearAllMocks()` 会清除调用记录但保留 mock 实现。这对全局 mock 是正确的（mock 行为跨测试保持一致）。但 `beforeEach` 中的清理逻辑需要确认 vitest 是否在文件间自动执行，还是需要在 `setup.ts` 中显式配置。

- **修复建议**:
  1. **实施后优先验证** `CardTreeNode.test.tsx` 的 Lazy Loading "NOT visible" 测试是否仍然通过
  2. 如果失败，改用 `vi.mocked(global.IntersectionObserver).mockImplementationOnce(...)` 显式方式
  3. 在 `setup.ts` 末尾添加注释说明全局 mock 的持久化行为预期

---

## 维度 4: 选择器修复方案是否覆盖了所有 10 个失败？

- **判定**: 建议 ⚠️
- **理由**: 数量上覆盖（4+5+1=10），但缺乏具体改动点，无法执行。
- **具体问题**:

  1. **无具体代码改动清单**：实施计划 S3.1/S3.2/S3.3 只有泛泛的"修复模式"描述（"使用精确 role + name"、"使用 getAllByText"），没有指出哪一行、改为哪一行。这给实施者造成大量猜测工作。

  2. **page.test.tsx 的失败信息缺失**：4 个测试都只断言 `getByText('VibeX')`，理论上能找到 nav 中的 VibeX 文本。如果真的失败，可能是因为 `next/navigation` mock 冲突（`redirect` 函数 mock 覆盖了 `useRouter`），或者其他运行时错误，而非选择器问题。架构文档对 page.test.tsx 的根因描述（"元素未找到"）与测试代码（只检查 `toBeInTheDocument`）不一致。

  3. **dashboard/page.test.tsx 的 31 个测试 vs 5 个失败**：PRD 说 5 个失败，但有 31 个测试。如果只有 5 个失败，说明大部分测试用 `waitFor` + `getAllByText` + `toBeGreaterThan(0)` 这种宽松断言通过了。修复时需确认这 5 个失败的断言是什么。

  4. **export/page.test.tsx 的 13 个测试 vs 1 个失败**：13 个测试中有 11 个使用了精确断言（如 `getByRole('checkbox', { name: /TypeScript/i })`），如果只有 1 个失败，需要明确是哪一个。

- **修复建议**:
  1. 实施前先跑测试获取真实错误信息（见维度 1）
  2. 在 architecture.md §2.4 或新建 `SELECTOR_FIXES.md` 中列出每个失败的：
     - 文件名 + 行号
     - 当前错误代码
     - 修复后的代码（diff 格式）
  3. 示例格式：
     ```
     src/app/page.test.tsx:19
     错误: screen.getByText('VibeX') → 找到多个元素
     修复: screen.getByRole('heading', { name: 'VibeX' })
     ```

---

## 维度 5: 是否有可能引入新的回归？

- **判定**: OK ✅（低风险）
- **理由**: 变更范围限于测试文件，mock 行为（`isIntersecting: true`）与组件默认可见行为一致。
- **具体问题**:
  1. **jest-axe 与 axe-core 版本兼容性**：未说明版本约束。`jest-axe` 依赖 `axe-core`，如果项目中已有 `axe-core` 或其他 accessibility 工具，版本冲突可能导致 `axe()` 执行失败或误报。建议在安装时确认：`pnpm add -D jest-axe && pnpm why axe-core`。

  2. **`accessibility.test.tsx` 中 mock 的 `EventSource` 定义在测试文件内**（非 setup.ts），与其他 accessibility 测试（如未来新增的 flow/page）共享存在隐患。但当前与全局修复无关，风险等级：中（但不是本次引入的）。

  3. **`setup.ts` 的 IO Mock 影响其他组件**：如果未来有组件测试依赖 `IntersectionObserver` **不触发 callback**（即 `isIntersecting: false`），当前 mock 会破坏该测试。但这是好事——这种测试本身说明组件有 IO 行为依赖 bug，应修复组件而非持久化错误的 mock。

  4. **Vitest 4.x (`^4.1.2`) 与 setup.ts 中的 `jest.*` 兼容性**：`setup.ts` 用 `jest` 别名包装 `vi.*`。vitest 通常兼容此模式，但 Vitest 4.x 对 `jest.fn` 的完整兼容需要确认。已有 `jestCompat` 定义，风险可控。

- **修复建议**:
  - 安装 jest-axe 后运行 `pnpm why axe-core` 确认无版本冲突
  - Epic 4 全量测试时重点关注 accessibility 相关输出

---

## 维度 6: 实施计划是否可执行？步骤是否有遗漏？

- **判定**: 建议 ⚠️
- **理由**: Epic 1 和 Epic 2 可执行，Epic 3 不可直接执行（缺具体改动点）。
- **具体问题**:

  1. **Epic 3 完全无法执行**：S3.1 "page.test.tsx（4 处修复）"、S3.2 "dashboard/page.test.tsx（5 处修复）"、S3.3 "export/page.test.tsx（1 处修复）" 均无具体代码 diff。实施者无从下手，这是实施计划最大的缺失。

  2. **验收标准错误**：Epic 4 验收标准"失败数 ≤ 26"是错的。修复后失败数应 < 26（至少减少 26 个失败）。正确的标准应为：`npm test` 退出码 0，或已知失败的 26 个测试全部通过。

  3. **缺少 setup.ts 验证测试**：PRD S1.1 定义的验收标准包含 setup.ts 本身的单元测试（`tests/unit/setup.spec.ts`），但实施计划中完全没有提到如何创建该文件。这是一个有价值的验证手段（确保 IO Mock 正确），但实施计划漏掉了。

  4. **缺少 pnpm install 步骤**：S2.1 安装 jest-axe 后，需要 `pnpm install` 更新 pnpm-lock.yaml。实施计划没有这一步（只在"验证"中提了一句）。

  5. **CardTreeNode 本地 mock 清理范围不明**：S1.2 说"删除以下内容"，列出了 3 类，但没有说明 `beforeAll` 块本身是否保留为空块。代码中的 `beforeAll` 块如果保留为空，`beforeEach` 中的清理逻辑也需要相应调整。

  6. **Epic 1/2/3 可并行，但 S1.3 依赖 S1.1**：逻辑正确。

- **修复建议**:
  1. **补充 Epic 3 具体改动清单**（见维度 4 修复建议）
  2. **修正 Epic 4 验收标准**为"已知失败测试 100% 通过，无新增失败"
  3. 在实施计划末尾补充：`pnpm install` 命令
  4. 明确 CardTreeNode 中 `beforeAll` / `beforeEach` 块的处理方式（完全删除 or 保留空块）
  5. 添加可选步骤：创建 `tests/unit/setup.spec.ts` 验证 IO Mock

---

## 维度 7: AGENTS.md 约束是否完整？

- **判定**: OK ✅
- **理由**: 约束清晰，白名单明确，规范覆盖了核心风险点。
- **具体问题**（轻微）:

  1. **约束 2"禁止删除测试文件"与约束"只修复不移除测试覆盖"略显冗余**：可合并为一条，避免歧义。

  2. **缺少并行执行警告**：Epic 1/2/3 可并行，但"同一文件不能并行修改"。AGENTS.md 没有说明这一点。如果两个 Agent 同时修改 `setup.ts`（Epic 1 和可能的未来变更），会产生合并冲突。

  3. **缺少验收通过标准**："每修改一个文件后立即验证"已规定，但验证命令已提供，无需补充。

  4. **`jest-axe` 混用 `@testing-library/jest-dom` 的规范缺失**（已在架构文档中提到）：建议在 AGENTS.md §jest-axe 中补充说明：不需要在测试文件中 `import '@testing-library/jest-dom'`（已在 setup.ts 中导入）。

- **修复建议**: 在 AGENTS.md 添加一条并行约束：如果多个 Agent 同时执行 vibex-test-fix，需要用不同文件隔离，禁止两个 Agent 同时修改同一文件。

---

## 补充观察

### OBS-1: 当前测试文件结构异常

所有 5 个测试文件（CardTreeNode / page / dashboard / export / accessibility）的内容全部拼接在 `CardTreeNode.test.tsx` 路径下，**而非各自独立的文件**。这意味着：

- `CardTreeNode.test.tsx` 文件同时包含了 5 个不同 describe 块的代码
- 每个测试块都重新定义了自己的 `localStorageMock`、`vi.mock('next/navigation')` 等
- Vitest 按文件加载时，这些内容都在同一文件作用域

虽然这不影响架构决策（修改点仍在各自 describe 块中），但这是一个**重大代码组织问题**，应在修复后作为 tech debt 记录。

### OBS-2: 全局 `jest.*` 别名与 Vitest 4.x

`setup.ts` 定义了完整的 `jest.*` 兼容层（`jestCompat`）。Vitest 4.x 已内置 `jest.*` 支持（通过 `jestGlobals: true` 或配置），当前实现可能冗余。建议在 vibex-test-fix 完成后评估是否可以移除该兼容层。

### OBS-3: PRD vs Architecture 执行决策不一致

- PRD 的执行决策是"有条件推荐，执行日期待定（Phase1 先行）"
- Architecture 的执行决策是"已采纳，执行日期 2026-04-12"

这两个文档应统一。当前审查基于 Architecture 版本（已采纳），建议 PM 确认后同步 PRD。

---

## 审查意见处理状态

| # | 行动项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | 补充 Epic 3 具体改动清单 | ✅ 已处理 | 在 IMPLEMENTATION_PLAN.md §8 增加前置条件；SELECTOR_FIXES.md 占位符已创建 |
| 2 | 修正 Epic 4 验收标准 | ✅ 已处理 | "≤ 26" 修正为 "已知 26 个失败修复后失败总数为 0" |
| 3 | 运行测试获取真实错误信息 | ✅ 已处理 | 实测发现 page.test.tsx 是空渲染而非"找不到元素"，根因与 PRD 描述不符 |
| 4 | 验证 CardTreeNode Lazy Loading 测试 | ⏳ 待执行 | 需 Epic 1 完成后验证 |
| 5 | 同步 PRD 执行决策 | ✅ 已处理 | Architecture 执行决策：已采纳，2026-04-12 |
| 6 | AGENTS.md 补充并行约束和 jest-axe 说明 | ✅ 已处理 | 已添加并行约束 + jest-axe/@testing-library/jest-dom 混用说明 |

---

## 审查结论

**有条件通过 — 上述阻断问题已修复。**

关键变化：
- 实测发现 `page.test.tsx` 根因与 PRD 不符（空渲染 vs 找不到元素），Epic 3 需要先获取真实堆栈才能执行
- Epic 3 标记为"需先实测"，执行 agent 必须先运行 §8 前置命令，填写 `SELECTOR_FIXES.md` 后再修复
- Epic 4 验收标准已修正

| 维度 | 判定 | 备注 |
|------|------|------|
| 1. 根因分析完整性 | ✅ 已修复 | §2.5 补充实测发现 + 前置条件 |
| 2. 方案选择合理性 | OK ✅ | — |
| 3. IO Mock 实现正确性 | ⏳ 待实测 | S1.4 验证步骤已加入实施计划 |
| 4. 选择器覆盖完整性 | ✅ 已修复 | IMPLEMENTATION_PLAN.md §8 前置条件 + SELECTOR_FIXES.md 占位 |
| 5. 回归风险 | OK ✅ | — |
| 6. 实施计划可执行性 | ✅ 已修复 | Epic 3 前置条件 + 验收标准修正 |
| 7. AGENTS.md 完整性 | ✅ 已修复 | 并行约束 + jest-axe 说明 |

---

## 结论

| 维度 | 判定 | 优先级 |
|------|------|--------|
| 1. 根因分析完整性 | ✅ 已修复 | 中 |
| 2. 方案选择合理性 | OK ✅ | — |
| 3. IO Mock 实现正确性 | ⏳ 待实测 | 高 |
| 4. 选择器覆盖完整性 | ✅ 已修复 | 高 |
| 5. 回归风险 | OK ✅ | — |
| 6. 实施计划可执行性 | ✅ 已修复 | 高 |
| 7. AGENTS.md 完整性 | ✅ 已修复 | — |

**建议行动**：
1. **Epic 1 + 2 可立即执行**（不依赖真实错误信息）
2. **Epic 3 需先完成 §8 前置条件**（运行测试获取真实错误 → 填写 SELECTOR_FIXES.md）
3. **Epic 4 待 Epic 1/2/3 全部完成后执行**
4. **Epic 1 完成后必须验证 CardTreeNode Lazy Loading 测试**（S1.4）
