# homepage-theme-api-analysis-epic3-test-fix 需求分析报告

> 项目: homepage-theme-api-analysis-epic3-test-fix
> 分析时间: 2026-03-22
> 分析师: Analyst Agent
> 状态: ✅ 分析完成

---

## 执行摘要

**一句话结论**: `smartFetch()` 对 Jest mock 的检测逻辑依赖非公开内部属性 `_isMockFunction`，导致 mock 检测失败后回退到不完整的 stub 数据 `{ theme: 'dark' }`（缺少 `userPreferences` 字段），进而造成 3 个 theme-binding 测试失败。

**关键指标**:
- 问题类型: Mock 检测逻辑缺陷
- 影响范围: `theme-binding.test.tsx` 3个测试用例失败
- 修复工时: ~0.5h（单文件，改动 <20 行）
- 风险: 低（仅影响测试，不影响生产代码）

---

## 1. 问题分析

### 1.1 根因链路

```
smartFetch() 检测 Jest mock
  └─ 使用 (fetch as any)._isMockFunction 内部属性
      └─ Jest 版本差异 / minified build 中属性名变化
          └─ 检测失败，绕过 mock 处理分支
              └─ 直接返回 STUB_DATA = { theme: 'dark' }
                  └─ STUB_DATA 缺少 userPreferences 字段
                      └─ ThemeContext 合并逻辑缺少覆盖源
                          └─ 3 个测试用例失败
```

### 1.2 关键证据

| 证据 | 内容 |
|------|------|
| 失败测试 | `theme-binding.test.tsx` 3个用例 |
| 失败表现 | Consumer 显示 `mode='light'` 而非预期的 `mode='dark'`（userPreferences 覆盖失效）|
| 根因代码 | `(fetch as any)._isMockFunction` — Jest 内部属性，不保证跨版本稳定 |
| Stub 数据 | `STUB_DATA = { theme: 'dark' }` — 无 `userPreferences` 字段 |

### 1.3 问题分类

| 维度 | 评估 |
|------|------|
| 类型 | 测试基础设施缺陷（Mock 层）|
| 影响 | 阻塞 CI / 开发反馈 |
| 紧迫性 | 中 — 不影响生产，但阻止测试通过 |
| 范围 | 仅 homepage API mock，单文件 |

---

## 2. 修复方案

### 2.1 方案选型

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A: 特征检测（推荐）| 直接调用 fetch，检查返回对象是否包含 `json` 方法 | 跨 Jest 版本稳定，不依赖内部属性 | 需要 try/catch |
| B: 恢复 `_isMockFunction` | 保留原有检测，补加特征检测兜底 | 渐进修改 | 复杂度增加 |
| C: 改用 jest.fn().mockResolvedValue | 重构测试 mock 方式 | 更规范 | 工作量大，需改多个测试文件 |

**推荐方案 A**：改动最小（~15行），不依赖 Jest 内部实现，最稳定。

### 2.2 实施细节

**修改文件**: `src/services/__mocks__/homepageAPI.ts`

**核心逻辑变更**:
```typescript
// Before (不稳定的内部属性检测)
if (
  typeof fetch === 'function' &&
  (fetch as any).mock &&
  (fetch as any)._isMockFunction  // ❌ Jest 内部属性，不稳定
)

// After (行为检测)
if (typeof global.fetch === 'function') {
  try {
    const result = await (global.fetch as Function)();
    if (result && typeof result === 'object' && 'json' in result) {
      return result as Response;  // ✅ 有效 Response 对象
    }
  } catch {
    // fetch 不可用/失败，使用 stub
  }
}
```

### 2.3 验收标准覆盖

| 验收条件 | 对应测试用例 | 修复后预期 |
|----------|-------------|-----------|
| smartFetch 正确返回 mock 数据 | theme-binding: "API userPreferences overrides API default" | Consumer 显示 `mode='dark'` ✅ |
| userPreferences 覆盖生效 | theme-binding: 优先级测试 | 合并结果正确 ✅ |
| API default 生效（无 userPreferences） | theme-binding: "API default used" | Consumer 显示 `mode='dark'` ✅ |
| localStorage 持久化 | theme-binding: localStorage 写入验证 | setItem 包含 `"mode":"dark"` ✅ |
| mock 失败安全回退 | 非 jest mock 时 | 返回 STUB_DATA ✅ |

---

## 3. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| `smartFetch` 被其他地方直接依赖 | 低 | 高 | 仅测试层使用，审查无生产调用 |
| `global.fetch` 在 Node 环境中不可用 | 极低 | 低 | 已有的 `typeof` 检查 + try/catch |
| 修复后破坏其他依赖 smartFetch 的测试 | 低 | 中 | 全量测试回归（npm test）|

---

## 4. DoD 对齐

根据 PRD 的 DoD，项目完成的判定条件：

- [x] 分析完成（本文档）
- [ ] `smartFetch()` 能正确处理 `setupFetchMock` 设置的 jest mock
- [ ] 3 个失败测试用例全部通过
- [ ] `npm test -- --watchAll=false theme` 100% 通过
- [ ] 所有 homepageAPI + ThemeWrapper + theme-binding 测试全部通过
- [ ] 提交 PR 并通过 code review

**待 dev 领取任务后更新状态。**

---

## 5. 后续行动

| 角色 | 行动 |
|------|------|
| **dev** | 修改 `src/services/__mocks__/homepageAPI.ts`，实现方案 A |
| **dev** | 运行 `npm test -- --watchAll=false --testPathPattern=theme` 验证 |
| **dev** | 提交 PR，附上测试通过截图 |
| **reviewer** | Code review，验证方案合理性 |
| **tester** | 全量回归测试确认无副作用 |

---

## 6. Open Questions

- [ ] `STUB_DATA` 的 `userPreferences` 是否应该补充完整（而非依赖 mock）？
  - 建议：**否** — 保持 stub 最小化，让测试显式 setup mock 更清晰。
- [ ] 是否需要为 `smartFetch` 添加单元测试覆盖？
  - 建议：**是** — 防止未来回归，可作为后续优化项。
