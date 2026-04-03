# 测试失败根因分析报告

**项目**: vibex-test-infra-fix  
**阶段**: analyze-test-failure  
**分析师**: analyst  
**日期**: 2026-03-10 16:10

---

## 1. 执行摘要

当前测试状态：**79 个测试失败 / 822 个通过 / 902 总计**（失败率 8.8%）  
覆盖率：**54.86%**（目标 60%，差距 5.14%）

**核心发现**：测试失败主要源于 **测试与实现 API 不匹配** 和 **Mock 配置问题**，而非代码功能缺陷。

**推荐行动**：
1. 更新过时测试以匹配当前 API（高优先级）
2. 修复 Mock 配置问题
3. 补充边缘场景处理代码

---

## 2. 失败测试清单

### 2.1 失败测试套件（11 个）

| # | 测试文件 | 失败数 | 根因分类 |
|---|----------|--------|----------|
| 1 | `auth/page.test.tsx` | 2 | Mock/异步问题 |
| 2 | `confirmationStore.test.ts` | 7 | API 不匹配 |
| 3 | `MermaidCodeEditor.test.tsx` | 13 | Mock 配置问题 |
| 4 | `CompletenessScorer.test.ts` | 2 | 断言期望不匹配 |
| 5 | `templateMatcher.test.ts` | 1 | 空值处理缺失 |
| 6 | `ChatEntry.test.tsx` | - | 待分析 |
| 7 | `PrototypePreview.test.tsx` | - | 待分析 |
| 8 | `ComponentEditor.test.tsx` | - | 待分析 |
| 9 | `ProgressIndicator.test.tsx` | - | 待分析 |
| 10 | `flow/page.test.tsx` | - | 待分析 |
| 11 | `RelationshipEditor.test.tsx` | - | 待分析 |

---

## 3. 根因分析

### 3.1 根因一：API 不匹配（影响 7 个测试）

**现象**：`confirmationStore.test.ts` 中测试调用的方法在 store 中不存在

**详细错误**：
```
TypeError: addBusinessFlow is not a function
TypeError: addUIPage is not a function
TypeError: setDomainModel is not a function
TypeError: setClarificationAccepted is not a function
```

**原因**：测试文件是为旧版 API 编写，当前 store 实现已变更

**影响范围**：`src/stores/confirmationStore.test.ts` (7/11 测试失败)

**修复方案**：
- 方案 A：更新测试以匹配当前 store API（推荐）
- 方案 B：恢复 store 中缺失的方法

---

### 3.2 根因二：Mock 配置问题（影响 15+ 测试）

**现象**：`MermaidCodeEditor.test.tsx` 无法找到 `data-testid="monaco-editor"`

**详细错误**：
```
TestingLibraryElementError: Unable to find an element by: [data-testid="monaco-editor"]
```

**原因**：Monaco Editor 组件被 mock，但 mock 实现未保留 `data-testid` 属性

**影响范围**：
- `MermaidCodeEditor.test.tsx` (13/14 测试失败)
- `auth/page.test.tsx` (2/6 测试失败)

**修复方案**：
1. 检查 `jest.setup.js` 中的 Monaco Editor mock
2. 确保 mock 组件传递 `data-testid` 属性
3. 或修改测试使用其他查询方式

---

### 3.3 根因三：异步/Mock 调用失败（影响 2 个测试）

**现象**：`auth/page.test.tsx` 中 mock 函数未被调用

**详细错误**：
```
expect(jest.fn()).toHaveBeenCalled()
Expected number of calls: >= 1
Received number of calls:    0
```

**错误信息显示**：`Cannot read properties of undefined (reading 'then')`

**原因**：
1. Auth API mock 返回值未正确设置为 Promise
2. 或组件内部调用路径与测试预期不符

**修复方案**：
1. 检查 `useAuth` hook 的 mock 配置
2. 确保 `mockRegister` / `mockLogin` 返回正确的 Promise

---

### 3.4 根因四：边缘场景处理缺失（影响 3 个测试）

**现象**：代码无法处理 null/空值输入

**案例 1** - `templateMatcher.test.ts`:
```javascript
TypeError: Cannot read properties of null (reading 'includes')
// 代码第 16 行: text.includes(keyword)
```

**案例 2** - `CompletenessScorer.test.ts`:
```javascript
expect(result.totalScore).toBeGreaterThan(0);
// 空字符串输入返回 0，测试期望 > 0
```

**修复方案**：
1. 在 `templateMatcher.ts` 添加 null/undefined 检查
2. 更新 `CompletenessScorer.test.ts` 的期望值或修改实现逻辑

---

## 4. 覆盖率差距分析

### 4.1 当前覆盖率

| 指标 | 当前值 | 目标值 | 差距 |
|------|--------|--------|------|
| Lines | 54.86% | 60% | -5.14% |
| Statements | 53.35% | 60% | -6.65% |
| Functions | 44% | 60% | -16% |
| Branches | 49.11% | 60% | -10.89% |

### 4.2 低覆盖率模块（需优先补充）

| 模块 | Lines | Functions | 优先级 |
|------|-------|-----------|--------|
| `components/ui/FlowEditor.tsx` | 3.57% | 4% | P0 |
| `components/ui/FlowPropertiesPanel.tsx` | 5.88% | 0% | P0 |
| `data/templates/index.ts` | 7.14% | 0% | P0 |
| `components/ui/MermaidCodeEditor.tsx` | 18.42% | 28.57% | P1 |
| `app/domain/DomainPageContent.tsx` | 22.38% | 8.91% | P1 |

---

## 5. 修复优先级矩阵

| 优先级 | 问题 | 影响测试数 | 修复复杂度 | 预估工时 |
|--------|------|------------|------------|----------|
| P0 | confirmationStore API 不匹配 | 7 | 低 | 1h |
| P0 | Monaco Editor Mock 问题 | 13 | 中 | 2h |
| P1 | auth/page Mock/异步问题 | 2 | 中 | 1h |
| P1 | 空值处理缺失 | 1 | 低 | 0.5h |
| P1 | CompletenessScorer 断言问题 | 2 | 低 | 0.5h |
| P2 | 其他 6 个测试文件 | ~54 | 待分析 | 4h |

**总计预估**: 9h（不含覆盖率提升）

---

## 6. 可执行建议

### 6.1 立即行动（P0）

1. **检查 confirmationStore 实际 API**
   ```bash
   # 对比测试期望与实际实现
   grep -n "export" src/stores/confirmationStore.ts
   ```

2. **修复 Monaco Editor Mock**
   - 文件: `jest.setup.js` 或 `__mocks__/monaco-editor.tsx`
   - 确保 mock 组件传递 `data-testid`

### 6.2 短期行动（P1）

3. **修复 auth 测试 Mock**
   - 检查 `useAuth` mock 返回值
   - 确保返回正确格式的 Promise

4. **添加空值保护**
   - `templateMatcher.ts`: 添加 `if (!text) return { matched: false };`

### 6.3 覆盖率提升（并行）

5. **补充核心模块测试**
   - 优先: `FlowEditor.tsx`, `FlowPropertiesPanel.tsx`
   - 目标: 每个模块提升至 50%+

---

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 修复测试引入新问题 | 中 | 中 | 逐个修复并验证 |
| 覆盖率提升困难 | 中 | 低 | 聚焦核心模块 |
| Mock 配置复杂 | 中 | 中 | 参考 Jest 最佳实践 |

---

## 8. 下一步

- [ ] Dev 领取 `fix-remaining-tests` 任务
- [ ] 按 P0 → P1 → P2 优先级修复
- [ ] 每修复一个测试套件后运行 `npm test` 验证
- [ ] 修复完成后重新评估覆盖率

---

**产出物**: 本分析报告  
**路径**: `docs/vibex-test-infra-fix/failure-analysis.md`