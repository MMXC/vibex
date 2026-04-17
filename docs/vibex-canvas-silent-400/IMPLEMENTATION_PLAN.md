# Implementation Plan — vibex-canvas-silent-400

**项目**: vibex-canvas-silent-400
**版本**: v1.0
**日期**: 2026-04-17
**状态**: Architect Approved

---

## 1. 任务拆分

### Sprint 1: F1.1 + F1.2（前端前置校验）

| Story | 任务 | 负责人 | 工时 |
|-------|------|--------|------|
| F1.1 | contextsToSend 空数组前置校验 | FE | 0.5h |
| F1.2 | 按钮 disabled 逻辑优化 | FE | 0.5h |

**开始条件**: 无依赖
**结束条件**: 单元测试覆盖 AC1/AC2

#### 任务清单

- [x] 1.1.1 在 `BusinessFlowTree.tsx` 的 `handleContinueToComponents` 中，`contextsToSend` 构建后增加空数组校验
- [x] 1.1.2 toast 消息：`请先确认至少一个上下文节点后再生成组件树`，类型 `'error'`
- [x] 1.1.3 early return，不触发 `canvasApi.fetchComponentTree` 调用
- [x] 1.1.4 编写单元测试覆盖 AC1 + AC2
- [x] 1.2.1 派生 `canGenerateComponents` 状态（复用 `contextsToSend` 计算逻辑）
- [x] 1.2.2 按钮 `disabled={!canGenerateComponents || componentGenerating}`
- [x] 1.2.3 单元测试覆盖 AC1（空时 disabled）+ AC2（有效时 enabled）
- [x] 1.2.4 回归测试：正常路径（有效 contexts + flows）按钮仍可点击

---

### Sprint 2: F2.1（API 层 async/await 修复）✅

| Story | 任务 | 负责人 | 工时 |
|-------|------|--------|------|
| F2.1 | canvasApi.ts 中 res.json() await 修复 | FE ✅ | 0.5h |
| F2.2 | 全局 res.json() 扫描验证 | FE ✅ | 0.5h |

**开始条件**: 无依赖，可与 Sprint 1 并行
**结束条件**: handleResponseError 正确解析后端错误 + 全局无遗漏

#### 任务清单

- [x] 2.1.1 修复 `canvasApi.ts` 中 `handleResponseError` 函数的 `res.json()` 添加 `await`
- [x] 2.1.2 单元测试覆盖 AC1（JSON 解析）+ AC2（非 JSON fallback）
- [x] 2.2.1 执行 `grep -rn "res\.json()" vibex-fronted/src/` 全局扫描（8 处）
- [x] 2.2.2 验证每处 `res.json()` 均有 `await`（无遗漏）

---

### Sprint 3: 集成验证 + Code Review

| 任务 | 负责人 | 工时 |
|------|--------|------|
| 集成测试 | FE | 0.5h |
| Code Review | Tech Lead | 0.5h |
| 手动验证（真实页面） | QA | 0.5h |

**开始条件**: Sprint 1 + Sprint 2 均完成
**结束条件**: 手动验证通过 + PR Merge

#### 任务清单

- [ ] 3.1 编写集成测试：模拟完整用户路径（未勾选上下文 → 点击按钮 → 看到 toast）
- [ ] 3.2 回归测试：正常路径（确认上下文 + flows → 生成组件树）功能正常
- [ ] 3.3 Code Review 通过
- [ ] 3.4 手动验证（Playwright 或手动）：
  - [ ] 场景 A：所有上下文未确认 → 点击按钮 → toast 显示具体提示
  - [ ] 场景 B：部分上下文确认 → 正常生成组件树
  - [ ] 场景 C：选中上下文子集 → 仅选中的上下文发送到 API
- [ ] 3.5 PR Merge 到目标分支

---

## 2. 工时汇总

| Sprint | 内容 | 工时 |
|--------|------|------|
| Sprint 1 | F1.1 + F1.2 前置校验 | 1h |
| Sprint 2 | F2.1 + F2.2 async/await 修复 | 1h |
| Sprint 3 | 集成验证 + CR | 1.5h |
| **总计** | | **3.5h** |

---

## 3. 验收标准总览

| Story | 验收标准 | 测试覆盖 |
|-------|----------|----------|
| F1.1 AC1 | `contextsToSend` 为空时 toast `'请先确认至少一个上下文节点后再生成组件树'` | ✅ 单元测试 |
| F1.1 AC2 | 校验后 early return，`fetchComponentTree` 未被调用 | ✅ 单元测试 |
| F1.2 AC1 | `contextsToSend` 为空时按钮 `disabled === true` | ✅ 单元测试 |
| F1.2 AC2 | `contextsToSend` 有效时按钮 `disabled === componentGenerating` | ✅ 单元测试 |
| F2.1 AC1 | `handleResponseError` 正确解析后端 JSON 错误并 throw | ✅ 单元测试 |
| F2.1 AC2 | 非 JSON 响应 fallback 到 `defaultMsg` | ✅ 单元测试 |
| F2.2 AC1 | 全局 `res.json()` 均有 `await` | ✅ 手动验证 |
| 回归 | 正常路径（有效 contexts + flows）组件树生成不受影响 | ✅ 集成测试 |

---

## 4. DoD

- [ ] 所有 AC 单元测试通过
- [ ] 集成测试通过
- [ ] Code Review 通过
- [ ] 手动验证完成
- [ ] PR Merge
- [ ] Regression 无新 regression

---

## 5. 注意事项

1. **不要引入新依赖** — 纯代码修复
2. **toast 消息严格匹配** — 与 PRD 中的 AC1 消息完全一致（大小写、标点）
3. **canGenerateComponents 派生** — 在组件顶层通过 `useMemo` 计算，避免重复计算
4. **handleResponseError 是 shared function** — 修改后全面回归测试其他 API 错误路径
