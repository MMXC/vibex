# 智能诊断与需求录入框合并分析报告

**项目**: vibex-diagnosis-input-merge
**分析师**: Analyst Agent
**日期**: 2026-03-14

---

## 执行摘要

当前存在**两套独立的需求输入系统**，样式不一致且功能重叠。建议合并为统一的需求录入组件，采用深色主题，集成智能诊断功能。**预计提升用户体验一致性 80%**。

---

## 1. 业务场景分析

### 1.1 当前架构

```
┌─────────────────────────────────────────────────────────────┐
│                       主页 (page.tsx)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  需求输入区 (textarea)                               │    │
│  │  样式: homepage.module.css (深色主题)                │    │
│  │  功能: 基础需求输入                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  diagnosisSection                                    │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  DiagnosisPanel                              │    │    │
│  │  │  样式: styled-jsx (浅色主题)                  │    │    │
│  │  │  功能: 需求输入 + 诊断 + 优化                  │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 问题识别

| 问题 | 影响 | 严重度 |
|------|------|--------|
| 两套输入框 | 用户困惑，不知道用哪个 | 🔴 高 |
| 样式冲突 | 深色主题中嵌入浅色面板 | 🔴 高 |
| 功能重叠 | 维护成本高 | 🟡 中 |
| 状态不同步 | 诊断结果不能影响主输入 | 🟡 中 |

### 1.3 用户旅程分析

**当前流程**:
```
用户进入主页 
  → 看到需求输入框 (深色)
  → 下方看到诊断面板 (浅色)
  → 困惑：应该在哪里输入？
  → 在诊断面板输入
  → 诊断结果在诊断面板显示
  → 点击优化
  → 优化结果在诊断面板
  → 需要手动复制到主输入框
```

**期望流程**:
```
用户进入主页 
  → 看到统一的需求输入框
  → 输入需求
  → 实时诊断/优化建议
  → 一键应用优化
  → 点击"开始设计"
```

---

## 2. 技术方案分析

### 2.1 现有组件对比

| 组件 | 位置 | 样式方案 | 主题 | 功能 |
|------|------|----------|------|------|
| 主页输入框 | page.tsx | CSS Modules | 深色 | 基础输入 |
| DiagnosisPanel | components/diagnosis/ | styled-jsx | 浅色 | 输入+诊断+优化 |

### 2.2 样式差异

**主页输入框样式**:
```css
.textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  /* 深色主题 */
}
```

**DiagnosisPanel 样式**:
```css
.diagnosis-panel {
  border: 1px solid #e0e0e0;
  background: white;
  /* 浅色主题 */
}
```

### 2.3 推荐方案：统一需求录入组件

```
┌─────────────────────────────────────────────────────────────┐
│                   RequirementInput 组件                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  统一输入区 (textarea)                               │    │
│  │  - 深色主题                                          │    │
│  │  - 实时诊断指示器                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────┬─────────┬─────────┐                           │
│  │ 🎯 开始 │ 🔍 诊断 │ ✨ 优化 │  <- 统一操作按钮          │
│  └─────────┴─────────┴─────────┘                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  诊断结果区 (条件渲染)                               │    │
│  │  - 深色主题                                          │    │
│  │  - 评分 + 建议                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 技术实现方案

**方案 A：扩展现有主页组件** (推荐)
- 将 DiagnosisPanel 功能整合到 page.tsx
- 统一使用 CSS Modules
- 保留诊断服务层

**方案 B：创建新的统一组件**
- 创建 `RequirementInput` 组件
- 同时替换主页输入和诊断面板
- 更大的重构范围

**推荐方案 A**，原因：
1. 改动范围小
2. 保持现有功能稳定
3. 快速见效

---

## 3. 可行性评估

### 3.1 技术可行性

| 维度 | 评估 | 说明 |
|------|------|------|
| 组件重构 | ✅ 可行 | DiagnosisPanel 功能可拆分 |
| 样式统一 | ✅ 可行 | CSS Modules 可替换 styled-jsx |
| 状态管理 | ✅ 可行 | 已有 requirementText 状态 |
| 服务复用 | ✅ 可行 | diagnoser/optimizer 可直接调用 |

### 3.2 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 功能遗漏 | 低 | 完整测试诊断功能 |
| 样式回归 | 中 | 视觉回归测试 |
| 用户习惯改变 | 低 | 保持相似交互模式 |

### 3.3 依赖分析

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| diagnoser.ts | ✅ 可用 | 诊断服务核心 |
| optimizer.ts | ✅ 可用 | 优化服务核心 |
| types.ts | ✅ 可用 | 类型定义 |
| ScoreDisplay | ⚠️ 需改 | 样式需适配深色主题 |
| SuggestionList | ⚠️ 需改 | 样式需适配深色主题 |

---

## 4. 详细需求拆分

### 4.1 需求列表

| ID | 需求 | 优先级 | 工作量 |
|----|------|--------|--------|
| R1 | 合并两个输入框为一个 | P0 | 0.5天 |
| R2 | 统一深色主题样式 | P0 | 0.5天 |
| R3 | 集成诊断功能到主输入区 | P0 | 0.5天 |
| R4 | 集成优化功能到操作按钮 | P1 | 0.5天 |
| R5 | 诊断结果区深色主题适配 | P1 | 0.5天 |
| R6 | 状态同步机制 | P1 | 0.25天 |
| R7 | 移除旧 DiagnosisPanel | P2 | 0.25天 |

**总工作量**: 3 天

### 4.2 验收标准

| 需求 | 验收标准 | 测试方法 |
|------|----------|----------|
| R1 | 页面只有一个需求输入框 | 视觉检查 |
| R2 | 所有元素深色主题 | CSS 检查 |
| R3 | 点击诊断按钮显示结果 | E2E 测试 |
| R4 | 点击优化更新输入内容 | E2E 测试 |
| R5 | 诊断结果可读性良好 | 视觉检查 |
| R6 | 优化结果自动应用到输入框 | 功能测试 |
| R7 | 无旧组件残留代码 | 代码审查 |

---

## 5. 实现方案

### 5.1 组件结构

```
src/components/requirement-input/
├── RequirementInput.tsx      # 主组件
├── RequirementInput.module.css  # 样式
├── DiagnosisResult.tsx       # 诊断结果展示
├── ScoreIndicator.tsx        # 评分指示器
└── index.ts                  # 导出
```

### 5.2 核心代码示例

```typescript
// RequirementInput.tsx
export function RequirementInput() {
  const [requirementText, setRequirementText] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    const result = await diagnoser.diagnose(requirementText);
    setDiagnosisResult(result);
    setIsDiagnosing(false);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const result = await optimizer.optimize({ requirementText });
    setRequirementText(result.improvedText);
    // 重新诊断
    const diagnosis = await diagnoser.diagnose(result.improvedText);
    setDiagnosisResult(diagnosis);
    setIsOptimizing(false);
  };

  return (
    <div className={styles.container}>
      <textarea
        className={styles.textarea}
        value={requirementText}
        onChange={(e) => setRequirementText(e.target.value)}
        placeholder="描述你的产品需求..."
      />
      
      <div className={styles.actions}>
        <button onClick={handleGenerate}>🎯 开始设计</button>
        <button onClick={handleDiagnose} disabled={isDiagnosing}>
          {isDiagnosing ? '诊断中...' : '🔍 智能诊断'}
        </button>
        <button onClick={handleOptimize} disabled={isOptimizing}>
          {isOptimizing ? '优化中...' : '✨ 一键优化'}
        </button>
      </div>

      {diagnosisResult && (
        <DiagnosisResult result={diagnosisResult} />
      )}
    </div>
  );
}
```

### 5.3 样式规范

```css
/* RequirementInput.module.css */
.container {
  /* 继承主页深色主题 */
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
}

.textarea {
  width: 100%;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  color: #fff;
  font-size: 14px;
  resize: none;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

/* 诊断结果区 - 深色主题适配 */
.resultSection {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.scoreCircle {
  border-color: var(--score-color);
  background: rgba(0, 0, 0, 0.2);
}
```

---

## 6. 迁移计划

### 6.1 阶段一：核心合并 (1天)

1. 创建 `RequirementInput` 组件
2. 整合诊断功能
3. 统一深色样式
4. 替换主页输入区

### 6.2 阶段二：功能完善 (1天)

1. 诊断结果深色主题适配
2. 优化功能集成
3. 状态同步机制
4. E2E 测试补充

### 6.3 阶段三：清理优化 (0.5天)

1. 移除旧 DiagnosisPanel
2. 清理无用代码
3. 文档更新

---

## 7. 测试计划

### 7.1 单元测试

| 测试项 | 验证内容 |
|--------|----------|
| 输入状态 | requirementText 正确更新 |
| 诊断功能 | diagnoser 返回正确结果 |
| 优化功能 | optimizer 返回改进文本 |
| 状态同步 | 优化结果应用到输入框 |

### 7.2 E2E 测试

```typescript
// tests/e2e/requirement-input.spec.ts
test('统一输入流程', async ({ page }) => {
  // 1. 只有一个输入框
  const textareas = await page.locator('textarea').count();
  expect(textareas).toBe(1);
  
  // 2. 输入需求
  await page.fill('textarea', '开发一个电商平台');
  
  // 3. 点击诊断
  await page.click('button:has-text("诊断")');
  
  // 4. 检查诊断结果
  await expect(page.locator('.diagnosis-result')).toBeVisible();
  
  // 5. 点击优化
  await page.click('button:has-text("优化")');
  
  // 6. 检查输入框更新
  const value = await page.inputValue('textarea');
  expect(value.length).toBeGreaterThan(10);
});
```

### 7.3 视觉回归测试

- 深色主题一致性
- 诊断结果可读性
- 按钮状态反馈

---

## 8. 验收检查清单

- [ ] 页面只存在一个需求输入框
- [ ] 所有元素采用深色主题
- [ ] 诊断功能正常工作
- [ ] 优化功能正常工作
- [ ] 诊断结果可读性良好
- [ ] 优化结果自动应用到输入框
- [ ] 旧 DiagnosisPanel 已移除
- [ ] E2E 测试通过
- [ ] 无样式回归

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-diagnosis-input-merge/analysis.md`

**分析师**: Analyst Agent
**日期**: 2026-03-14