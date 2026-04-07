# 首页三步流程验证分析

**项目**: vibex-homepage-flow-verify  
**阶段**: analyze-requirements  
**分析日期**: 2026-03-18  
**Agent**: analyst

---

## 1. 初步分析结论验证

### ✅ 结论确认: 纯前端变更

| 变更项 | 验证结果 |
|--------|----------|
| commit 366856a 范围 | ✅ 仅 5 个前端文件，无后端改动 |
| 三步流程常量修改 | ✅ STEPS 从 5 步简化为 3 步 |
| generateBusinessFlow 调用 | ✅ 前端函数调用，参数 `([], requirementText)` |
| 按钮启用逻辑 | ✅ useMemo 计算，纯前端状态 |
| 后端 API 依赖 | ✅ 无 API 改动 |

**结论**: Coord 提供的初步分析结论 **正确**。

---

## 2. 功能验证点

### 2.1 三步流程切换

| 步骤 | 标签 | 说明 | 验证要点 |
|------|------|------|----------|
| Step 1 | 业务流程分析 | 使用 requirementText 直接生成流程图 | 按钮显示"业务流程分析" |
| Step 2 | UI组件分析 | 调用 analyzePageStructure | 按钮显示"UI组件分析" |
| Step 3 | 创建项目 | 调用 createProject | 按钮显示"创建项目" |

**验证方法**: 
- 检查 STEPS 常量是否为 3 个元素
- 检查 DYNAMIC_BUTTON_CONFIG 是否匹配 3 步

### 2.2 Step 1: 业务流程分析

```typescript
// 关键调用链
onGenerateBusinessFlow={() => generateBusinessFlow([], requirementText)}
```

**当前状态**: 
- `generateBusinessFlow` 为 mock 实现（无真实 API 调用）
- 设置 `streamStatus = 'streaming' → 'complete'`

**验证要点**:
1. 点击按钮后 isGenerating 变为 true
2. 流程图区域显示 flowMermaidCode
3. Step 完成后自动跳转 Step 2

### 2.3 Step 2: UI组件分析

```typescript
onAnalyzePageStructure={analyzePageStructure}
```

**当前状态**:
- `analyzePageStructure` 为 mock 实现
- 返回固定的 PageStructure 数据

**验证要点**:
1. 点击按钮后触发页面结构分析
2. Step 完成后自动跳转 Step 3

### 2.4 Step 3: 创建项目

```typescript
onCreateProject={() => {}}
```

**当前状态**:
- 空实现（TODO）

**验证要点**:
1. 按钮显示正确
2. 点击后触发项目创建流程（当前无实现）

---

## 3. 技术风险识别

### 3.1 高风险

| 风险 | 描述 | 影响 |
|------|------|------|
| 自动跳转逻辑缺失 | 代码中未见 Step 完成后自动跳转的实现 | 用户需手动切换步骤 |
| 数据流断裂 | generateBusinessFlow 未保存结果到状态 | Step 间无数据传递 |

### 3.2 中风险

| 风险 | 描述 | 影响 |
|------|------|------|
| Mock 实现未完成 | 3 个核心函数均为空/mock 实现 | 无法完成真实业务流程 |
| 状态管理不完整 | buttonStates 映射可能不完整 | 按钮启用状态可能异常 |

### 3.3 低风险

| 风险 | 描述 | 影响 |
|------|------|------|
| E2E 测试覆盖不足 | 现有测试未覆盖三步流程 | 需补充集成测试 |

---

## 4. 集成测试方案

### 4.1 单元测试 (useHomePageState)

```typescript
describe('三步流程状态', () => {
  it('应初始化为 Step 1', () => {
    // currentStep 应为 1
  });
  
  it('Step 1 完成后应跳转 Step 2', () => {
    // 模拟 generateBusinessFlow 完成后状态变化
  });
});
```

### 4.2 E2E 测试建议

```typescript
// tests/e2e/three-step-flow.spec.ts
import { test, expect } from '@playwright/test';

test('三步流程完整流程', async ({ page }) => {
  await page.goto('/');
  
  // Step 1: 业务流程分析
  await expect(page.locator('text=业务流程分析')).toBeVisible();
  await page.click('text=业务流程分析');
  
  // Step 2: UI组件分析  
  await expect(page.locator('text=UI组件分析')).toBeVisible();
  
  // Step 3: 创建项目
  await expect(page.locator('text=创建项目')).toBeVisible();
});
```

### 4.3 测试优先级

| 优先级 | 测试项 | 工作量 |
|--------|--------|--------|
| P0 | 单元测试: 步骤切换 | 2h |
| P0 | E2E测试: 三步流程完整路径 | 4h |
| P1 | 单元测试: 按钮状态 | 2h |
| P1 | E2E测试: 各步骤功能 | 6h |

---

## 5. 验收标准

### 5.1 功能验收

| 功能点 | 验收条件 | 测试方法 |
|--------|----------|----------|
| 三步流程显示 | STEPS.length === 3 | 代码检查 |
| Step 1 业务流程分析 | 按钮显示"业务流程分析" | E2E |
| Step 2 UI组件分析 | 按钮显示"UI组件分析" | E2E |
| Step 3 创建项目 | 按钮显示"创建项目" | E2E |
| 按钮启用状态 | useMemo 正确计算 | 单元测试 |

### 5.2 风险修复验收

| 风险项 | 修复标准 |
|--------|----------|
| 自动跳转 | 实现 useEffect 监听状态变化自动跳转 |
| 数据流传递 | generateBusinessFlow 结果保存到状态 |
| Mock 实现 | 替换为真实 API 调用或保持 mock 供后续开发 |

---

## 6. 实施建议

### 6.1 短期 (1-2天)

1. **补充自动跳转逻辑**: useEffect 监听 currentStep 变化
2. **完善数据流**: generateBusinessFlow 结果存储
3. **编写测试**: 单元测试 + E2E 测试覆盖

### 6.2 中期 (1周)

1. **实现真实 API 调用**: 连接后端服务
2. **完善 createProject**: 项目创建完整流程
3. **端到端验证**: 完整用户旅程测试

---

## 7. 总结

| 项目 | 状态 | 说明 |
|------|------|------|
| 初步分析结论 | ✅ 正确 | 纯前端变更，无后端依赖 |
| 技术风险 | ⚠️ 中等 | 3个高风险点需关注 |
| 测试覆盖 | ❌ 不足 | 需补充 E2E 测试 |
| 实施可行性 | ✅ 可行 | 前端改动，可独立完成 |

**建议**: 优先修复自动跳转和数据流问题，然后补充测试覆盖。
