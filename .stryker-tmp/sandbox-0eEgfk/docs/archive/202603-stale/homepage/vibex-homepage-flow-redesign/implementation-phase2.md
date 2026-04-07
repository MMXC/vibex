# vibex-homepage-flow-redesign 二阶段实现方案

## 背景

二阶段目标：将首页从5步简化为3步
- **旧流程**: 需求输入 → 限界上下文 → 领域模型 → 业务流程 → 项目创建
- **新流程**: 业务流程分析 → UI组件分析 → 创建项目

## 分析

### 现有代码结构

| 文件 | 作用 |
|------|------|
| `HomePage.tsx` | 主页面，定义STEPS常量(5步) |
| `useHomePage.ts` | 状态管理，包含generateContexts/generateDomainModels/generateBusinessFlow |
| `InputArea.tsx` | 输入区域，包含各步骤按钮 |
| `PreviewArea.tsx` | 预览区域，渲染mermaid图 |
| `Sidebar.tsx` | 步骤导航 |

### 影响范围
- STEPS常量定义
- useHomePage状态管理逻辑
- 各步骤按钮文案
- 预览区域渲染逻辑

## 方案设计

### Epic 4: STEPS常量+状态管理 (基础)

**修改内容**:
1. 修改`HomePage.tsx`中的STEPS常量为3步
2. 调整`useHomePage.ts`中的步骤流转逻辑
3. 更新InputArea按钮文案

**新STEPS定义**:
```typescript
const STEPS: Step[] = [
  { id: 1, label: '业务流程分析', description: '分析业务流程' },
  { id: 2, label: 'UI组件分析', description: '生成UI组件树' },
  { id: 3, label: '创建项目', description: '生成项目代码' },
];
```

### Epic 1: Step1 业务流程分析

**修改内容**:
1. 复用现有的`generateBusinessFlow`生成流程图
2. 流程图完成后自动跳转到Step 2
3. 保留上下文选择能力（从boundedContexts选择）

### Epic 2: Step2 UI组件分析 (新增)

**新增内容**:
1. 新增`UICollectionSelector`组件
2. 调用新的API `/ddd/ui-components`生成UI组件树
3. 用户可勾选需要的UI组件

### Epic 3: Step3 创建项目

**修改内容**:
1. 复用现有的`analyzePageStructure`
2. 项目创建后跳转到项目详情页

## 实施步骤

### Phase 1: Epic 4 共用调整
1. [ ] 修改STEPS常量为3步
2. [ ] 调整useHomePage状态流转
3. [ ] 更新InputArea按钮文案

### Phase 2: Epic 1 业务流程分析
1. [ ] 调整Step1按钮为"业务流程分析"
2. [ ] 复用generateBusinessFlow
3. [ ] 完成后自动跳转Step2

### Phase 3: Epic 2 UI组件分析
1. [ ] 创建UICollectionSelector组件
2. [ ] 添加UI组件分析按钮
3. [ ] 渲染组件树状图(mermaid)

### Phase 4: Epic 3 创建项目
1. [ ] 复用analyzePageStructure
2. [ ] 创建项目API调用
3. [ ] 完成后跳转项目详情

## 验收标准

- [ ] npm run build 通过
- [ ] STEPS长度为3
- [ ] 步骤1→2→3完整流转
- [ ] 各步骤mermaid图正确渲染

## 回滚计划

```bash
git revert HEAD
```
