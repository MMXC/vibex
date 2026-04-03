# IMPLEMENTATION_PLAN: simplified-flow-test-fix

**项目**: simplified-flow-test-fix  
**更新时间**: 2026-03-23  
**状态**: Ready for Dev

---

## 1. 实施范围

### 修改文件
- `vibex-fronted/src/app/page.test.tsx`

### 不修改
- HomePage 组件代码（`vibex-fronted/src/app/page.tsx`）
- 其他测试文件
- 基础设施/依赖

---

## 2. 实施步骤

### Epic 1: 测试修正

#### Step 1: F1.1 重命名测试（10分钟）

**目标**: 修复 `should have five process steps` 命名问题

**操作**:
1. 将测试名改为 `should render home page basic structure`
2. 确保断言 `screen.getByText('VibeX')` 保留
3. 添加 async/await（render 支持异步）

**验收**:
```bash
cd vibex-fronted && npx jest page.test.tsx --testNamePattern="should render home page basic structure"
# 预期: PASS
```

#### Step 2: F2.1 布局验证增强（15分钟）

**目标**: 让 `should Render three-column layout` 真正验证布局

**操作**:
1. 检查 HomePage 是否有布局相关的文本/class（如 "Sidebar", "Main", "Panel"）
2. 补充布局断言（优先 text/class，不强制 DOM 结构）
3. 保持现有 `getByText('VibeX')` 断言

**验收**:
```bash
cd vibex-fronted && npx jest page.test.tsx --testNamePattern="three-column"
# 预期: PASS
```

#### Step 3: F3.1 流程步数验证（15分钟）

**目标**: 新增或修改测试验证流程步数

**操作**:
1. 检查是否有 `data-testid` 标识的流程步骤
2. 如有：添加步数验证断言
3. 如无：使用 `queryAllByTestId(/step-/)` 条件判断，存在则验证

**验收**:
```bash
cd vibex-fronted && npx jest page.test.tsx
# 预期: 4/4 PASS
```

### Epic 2: 回归验证

#### Step 4: 全量测试（10分钟）

**目标**: 确认修改无副作用

**操作**:
```bash
cd vibex-fronted && npm test
```

**验收**: 测试通过率 ≥ 99%

#### Step 5: Git 提交（5分钟）

**操作**:
```bash
git add vibex-fronted/src/app/page.test.tsx
git commit -m "fix(page.test): align test names with assertions and enhance coverage

- Rename 'should have five process steps' to 'should render home page basic structure'
- Enhance 'three-column layout' test with actual layout assertions
- Add conditional step count validation
- Ensure all tests pass with npm test"
```

---

## 3. 预估工时

| Step | 内容 | 预估时间 |
|------|------|---------|
| F1.1 | 重命名测试 | 10min |
| F2.1 | 布局验证增强 | 15min |
| F3.1 | 流程步数验证 | 15min |
| Epic2 | 回归验证 | 10min |
| Git | 提交 | 5min |
| **总计** | | **~55min** |

---

## 4. 注意事项

1. **先备份再改**: 运行现有测试确认通过后再修改
2. **小步提交**: 每个 F1.1/F2.1/F3.1 修改后立即运行测试
3. **不碰组件**: 只改测试文件，不改 page.tsx
4. **保留通过状态**: 修改不能导致已有测试失败
5. **CI 验证**: `npm test` 必须通过后再 commit

---

## 5. 依赖项

- Jest (`jest.config.ts`)
- React Testing Library (`@testing-library/react`)
- React Query (`@tanstack/react-query`)
- ToastProvider (`@/components/ui/Toast`)
