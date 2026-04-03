# 需求分析：按钮拆分方案

## 1. 业务背景

### 1.1 当前状态
- 首页有一个统一的"🚀 开始生成"按钮
- 按钮触发生成逻辑，根据当前步骤执行不同操作
- 步骤流程：需求输入 → 限界上下文 → 领域模型 → 业务流程 → 项目创建

### 1.2 目标
拆分为 4 个独立按钮，提供更细粒度的用户控制：

| 按钮 | 功能 | 前置条件 |
|------|------|----------|
| 上下文分析 | 生成限界上下文 | 需求文本已录入 |
| 流程分析 | 生成领域模型+业务流程 | 上下文已选择 |
| 页面结构分析 | 分析页面结构（新功能） | 流程已生成 |
| 创建项目 | 生成项目代码 | 页面结构已分析 |

---

## 2. 技术方案

### 2.1 组件结构

```
InputArea/
├── InputArea.tsx (主组件)
├── ActionButtons.tsx (新增：4 个独立按钮)
├── InputArea.module.css
└── ActionButtons.module.css (新增)
```

### 2.2 按钮状态控制逻辑

```typescript
interface ButtonStates {
  contextAnalysis: {
    enabled: boolean;  // requirementText.trim().length > 0
    tooltip?: string;  // 禁用时的提示
  };
  flowAnalysis: {
    enabled: boolean;  // boundedContexts.length > 0 && selectedContextIds.size > 0
    tooltip?: string;
  };
  pageStructure: {
    enabled: boolean;  // businessFlow !== null
    tooltip?: string;
  };
  createProject: {
    enabled: boolean;  // pageStructureAnalyzed === true (新增状态)
    tooltip?: string;
  };
}
```

### 2.3 事件绑定

| 按钮 | 点击事件 | API 调用 |
|------|----------|----------|
| 上下文分析 | `onGenerateContexts()` | `generateContexts(requirementText)` |
| 流程分析 | `onGenerateFlow()` | `generateDomainModels()` + `generateBusinessFlow()` |
| 页面结构分析 | `onAnalyzePageStructure()` | **新增 API** |
| 创建项目 | `onCreateProject()` | 项目创建 API |

### 2.4 状态管理更新

需要扩展 `useHomePage` hook：

```typescript
// 新增状态
const [pageStructureAnalyzed, setPageStructureAnalyzed] = useState(false);
const [pageStructure, setPageStructure] = useState<PageStructure | null>(null);

// 新增方法
const analyzePageStructure = useCallback(() => {
  // 调用页面结构分析 API
}, [businessFlow]);
```

---

## 3. 实现细节

### 3.1 ActionButtons 组件

```tsx
interface ActionButtonsProps {
  // 按钮状态
  requirementText: string;
  boundedContexts: BoundedContext[];
  selectedContextIds: Set<string>;
  businessFlow: BusinessFlow | null;
  pageStructureAnalyzed: boolean;
  
  // 回调函数
  onGenerateContexts: () => void;
  onGenerateFlow: () => void;
  onAnalyzePageStructure: () => void;
  onCreateProject: () => void;
  
  // 加载状态
  isGenerating: boolean;
  currentGeneratingButton?: 'context' | 'flow' | 'page' | 'project';
}
```

### 3.2 CSS 样式

```css
/* ActionButtons.module.css */
.buttonGroup {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actionButton {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.actionButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actionButton.enabled {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.actionButton.enabled:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

### 3.3 现有 UI 结构保持

- 按钮组放置在 `InputArea` 组件底部 `actions` 区域
- 替换现有的单个"开始生成"按钮
- 保持 `PlanBuildButtons` 组件不变

---

## 4. 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 页面结构分析 API 不存在 | 高 | 先实现 Mock，后续接入真实 API |
| 按钮状态计算复杂 | 中 | 抽取为独立 hook，增加单元测试 |
| 用户体验变化 | 低 | 保留原"一键生成"快捷入口作为可选 |

---

## 5. 验收标准

### 5.1 功能验收

- [ ] 4 个按钮正确渲染
- [ ] 按钮可用性根据前置条件动态变化
- [ ] 点击上下文分析按钮 → 生成限界上下文
- [ ] 点击流程分析按钮 → 生成领域模型 + 业务流程
- [ ] 点击页面结构分析按钮 → 调用 API（Mock 可行）
- [ ] 点击创建项目按钮 → 触发项目创建

### 5.2 UI 验收

- [ ] 按钮样式与现有设计一致
- [ ] 禁用状态有视觉反馈（灰色 + tooltip）
- [ ] 加载状态有进度指示
- [ ] 不破坏现有布局结构

### 5.3 测试覆盖

- [ ] ActionButtons 组件单元测试
- [ ] useButtonStates hook 单元测试
- [ ] 集成测试：按钮点击 → 状态更新

---

## 6. 任务拆分建议

| 阶段 | 任务 | 产出 |
|------|------|------|
| 1. 组件实现 | 创建 ActionButtons 组件 | ActionButtons.tsx + CSS |
| 2. 逻辑抽取 | 创建 useButtonStates hook | 按钮状态计算逻辑 |
| 3. 状态扩展 | 扩展 useHomePage | 新增 pageStructure 状态 |
| 4. 集成 | 修改 InputArea | 替换单按钮为按钮组 |
| 5. 测试 | 编写测试用例 | 测试文件 |
| 6. API | 实现页面结构分析 API | 后端接口（可 Mock） |

---

## 7. 待澄清问题

1. **页面结构分析**：这是新功能还是对应现有某个步骤？
   - 如果是新功能，需要明确 API 定义
   - 如果是映射，请确认映射关系

2. **流程分析按钮**：是否一次性触发"领域模型 + 业务流程"两个步骤？
   - 当前系统是分两步的，需要确认是否合并

3. **一键生成保留**：是否需要保留原有的"开始生成"按钮作为快捷入口？

---

*分析完成时间: 2026-03-17 18:45*
*分析人: Analyst Agent*