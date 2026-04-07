# 架构设计: 首页关键 Bug 修复

**项目**: vibex-homepage-critical-bugs

---

## 1. 技术方案

### Epic 1: 限界上下文图渲染

**问题诊断**:
1. 检查 `useDDDStream` Hook 返回值
2. 确认 `contextMermaidCode` 状态更新
3. 验证 MermaidPreview 组件渲染

**修复方案**:
```tsx
// 添加调试日志
useEffect(() => {
  console.log('contextMermaidCode:', contextMermaidCode);
  console.log('boundedContexts:', boundedContexts);
}, [contextMermaidCode, boundedContexts]);

// 添加空状态处理
{!contextMermaidCode && boundedContexts.length === 0 && (
  <div className={styles.loading}>生成中...</div>
)}
```

---

### Epic 2: 进度条组件

**新增组件**: `StepProgress.tsx`
```tsx
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  status: 'idle' | 'streaming' | 'done' | 'error';
}

export function StepProgress({ currentStep, totalSteps, status }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      <span className={styles.progressText}>
        步骤 {currentStep}/{totalSteps}
      </span>
      {status === 'streaming' && <Spinner />}
    </div>
  );
}
```

**集成位置**: PreviewArea 顶部

---

### Epic 3: 面板自适应

**改进最小化逻辑**:
```tsx
const handleMinimize = useCallback((panelId: string) => {
  if (minimizedPanel === panelId) {
    // 已最小化，恢复
    setMinimizedPanel(null);
    setPanelSizes([60, 40]);
  } else {
    // 最小化当前，另一个填充
    setMinimizedPanel(panelId);
    setPanelSizes(panelId === 'preview' ? [0, 100] : [100, 0]);
  }
}, [minimizedPanel]);

// 展开按钮组件
const ExpandButton = ({ panelId, onExpand }) => (
  <motion.button
    className={styles.expandBtn}
    onClick={onExpand}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
  >
    ◀ 展开{panelId === 'preview' ? '预览' : '输入'}
  </motion.button>
);
```

---

### Epic 4: 步骤渐进渲染

**CSS 动画**:
```css
.stepItem.completed {
  animation: stepComplete 0.5s ease-out;
}

@keyframes stepComplete {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

---

## 2. 文件变更

| 文件 | 变更 |
|------|------|
| `page.tsx` | 添加进度条、修复面板逻辑 |
| `components/StepProgress.tsx` | 新增 |
| `homepage.module.css` | 添加样式 |

---

## 3. 风险

| 风险 | 缓解 |
|------|------|
| 后端 API 问题 | 添加错误提示 |
| 动画性能 | 使用 CSS transform |