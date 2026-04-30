# Spec: E18-CORE-2 Canvas 骨架屏

**Epic**: E18-CORE-2
**名称**: Canvas 骨架屏
**状态**: 已实现
**文件路径**: `vibex-fronted/src/components/canvas/CanvasPageSkeleton.tsx`

---

## 四态定义

### 1. 理想态（Ideal State）

**定义**: 数据加载完成，用户看到完整的 Canvas 页面，三栏树形结构正常显示。

**视觉表现**:
- BoundedContextTree: 显示限界上下文列表，每个节点可展开
- ComponentTree: 显示组件树，对应上下文下的组件
- BusinessFlowTree: 显示业务流程树
- 顶部工具栏正常显示
- 数据交互流畅

**代码/组件**:
- `CanvasPage.tsx` 主组件正常渲染
- 三树组件各自渲染数据列表
- 无骨架屏，无 loading 指示器

---

### 2. 空状态（Empty State）

**定义**: 用户首次进入 Canvas，无任何数据，需要引导用户创建第一个限界上下文。

**视觉表现**:
- 三栏骨架屏消失，显示空状态插图
- 引导文案居中显示："暂无限界上下文，请先添加"
- 新增按钮（"添加限界上下文"）明显可见
- 页面其他区域（工具栏）正常显示

**情绪**: 迷茫，首次使用不知所措。

**引导文案**: "还没有限界上下文，点击下方按钮创建第一个"

**禁止**:
- ❌ 只留白，什么都不显示
- ❌ 只显示"暂无数据"文字，无引导

**组件**:
```tsx
// 空状态示意（非实际代码）
<div className="empty-state">
  <EmptyIllustration />
  <p>暂无限界上下文，请先添加</p>
  <Button type="primary" onClick={onAddContext}>
    添加限界上下文
  </Button>
</div>
```

---

### 3. 加载态（Loading State）

**定义**: 用户进入 Canvas 或切换上下文时，数据正在加载中。

**视觉表现**:
- 三栏骨架屏占位（三列布局）
- 每列包含多个 SkeletonLine 和 SkeletonBox
- 骨架屏提供数据规模暗示（三行、五行等）
- 加载指示器可选（非必须）

**情绪**: 等待，不确定要多久。

**禁止**:
- ❌ 使用转圈加载（会抖动，视觉不稳定）
- ❌ 骨架屏内容与实际数据布局不一致

**实现要求**:
- 使用 `SkeletonLine` 和 `SkeletonBox` 组件
- 骨架屏宽度与实际内容列宽一致
- 骨架屏行数模拟真实数据行数

**组件**:
```tsx
// 骨架屏示意（非实际代码）
<div className="canvas-skeleton">
  <div className="skeleton-column">
    <SkeletonBox width="100%" height="40px" />
    <SkeletonLine width="80%" />
    <SkeletonLine width="60%" />
    <SkeletonLine width="70%" />
  </div>
  <div className="skeleton-column">
    <SkeletonBox width="100%" height="40px" />
    <SkeletonLine width="75%" />
    <SkeletonLine width="85%" />
  </div>
  <div className="skeleton-column">
    <SkeletonBox width="100%" height="40px" />
    <SkeletonLine width="65%" />
    <SkeletonLine width="90%" />
    <SkeletonLine width="50%" />
  </div>
</div>
```

---

### 4. 错误态（Error State）

**定义**: 数据加载失败，需要向用户反馈错误信息并提供恢复选项。

**覆盖场景**:
- **网络异常**: 无法连接到后端服务
- **权限不足**: 用户无权访问此项目
- **数据超长**: 数据量过大导致加载超时
- **接口超时**: 请求超时（30s）

**视觉表现**:
- 错误提示区域显示错误信息
- 错误图标 + 文案（"加载失败"）
- 重试按钮
- 可选：技术支持链接

**情绪**: 焦虑，担心数据丢失。

**引导文案**: "加载失败，请检查网络后重试" 或 "无权限访问此项目，请联系管理员"

**兜底机制**:
- 重试按钮：点击重新请求数据
- 网络状态检测：自动提示网络问题
- 错误日志：记录错误详情便于排查

**组件**:
```tsx
// 错误状态示意（非实际代码）
<div className="error-state">
  <ErrorIcon />
  <p className="error-title">加载失败</p>
  <p className="error-message">{errorMessage}</p>
  <Button type="primary" onClick={onRetry}>
    重试
  </Button>
</div>
```

---

## 状态转换图

```
用户进入 Canvas
    ↓
加载中 → [Loading State: 骨架屏]
    ↓
加载成功 → [Ideal State: 三树正常显示]
    ↓
用户操作/数据变化 → 重新加载 → [Loading State]
    ↓
加载失败 → [Error State: 显示错误+重试按钮]
    ↓
用户点击重试 → 重新加载 → [Loading State]
```

---

## 技术实现要求

### 组件层级
- `CanvasPage.tsx` — 主组件，管理加载状态
- `CanvasPageSkeleton.tsx` — 骨架屏组件
- `Skeleton.tsx` — 骨架屏辅助组件（SkeletonLine/SkeletonBox）

### 状态管理
- `useProjectLoader` 返回 `{ loading, data, error }`
- CanvasPage 根据状态渲染对应 UI

### 禁止事项
- 骨架屏禁止用转圈替代
- 空状态禁止只留白
- 错误态禁止只显示"加载失败"，必须有重试按钮

---

## 验收标准

| 状态 | 验证点 | 测试命令 |
|------|--------|----------|
| 骨架屏存在 | `CanvasPageSkeleton.tsx` 文件存在 | `fs.existsSync(...)` |
| 骨架屏集成 | `CanvasPage.tsx` 使用骨架屏组件 | 源码审查 |
| 三栏布局 | 骨架屏包含三列 TreeSkeleton | 源码审查 |
| 状态转换 | 加载状态使用骨架屏而非转圈 | 源码审查 |
