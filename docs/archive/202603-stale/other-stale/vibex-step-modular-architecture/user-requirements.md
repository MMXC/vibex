# 用户核心需求

## 来源
- Slack #coord 2026-03-17 00:17-00:18
- 用户：小羊

## 核心需求

### 1. 步骤驱动组件切换
> "进行到对应步骤就应该直接换组件等数据"

- **当前问题**: 用 SSE 状态判断渲染，逻辑复杂
- **改进方案**: 步骤ID = 组件ID，步骤切换直接换组件

### 2. 组件等数据（先挂载后加载）
- 组件先挂载到 DOM
- 数据异步加载填充
- 不阻塞 UI 渲染

### 3. 可切回查看
> "这样也方便切回去查看"

- 步骤历史数据保留
- 切换到已完成步骤时显示之前的数据
- 不需要重新请求

### 4. 避免重复渲染
> "避免重复渲染"

- 组件缓存机制
- 已渲染的步骤切换回来时复用
- 不重新初始化组件

## 模块化结构

```
StepComponents/
├── Step1/  (需求输入)
│   ├── GraphArea.tsx      # 图形区域（空/示例）
│   ├── ThinkingArea.tsx   # AI思考过程（空）
│   └── InputArea.tsx      # 录入区域
├── Step2/  (限界上下文)
│   ├── GraphArea.tsx      # Mermaid 图
│   ├── ThinkingArea.tsx   # AI思考过程
│   └── InputArea.tsx      # 节点选择
├── Step3/  (领域模型)
│   └── ...
└── Step4/  (业务流程)
    └── ...
```

## 测试简化

```typescript
// 测试只需验证步骤切换
test('Step 2 shows bounded-context components', () => {
  setCurrentStep(2);
  expect(screen.getByTestId('step2-graph-area')).toBeInTheDocument();
  expect(screen.getByTestId('step2-thinking-area')).toBeInTheDocument();
});

// 不需要模拟 SSE 状态
```

## 关键技术点

1. **步骤状态管理**: Zustand store 存储 currentStep + 各步骤数据缓存
2. **组件缓存**: React.memo + 条件渲染 或 keep-alive 机制
3. **数据持久化**: 步骤数据存储在 store，切换不丢失
