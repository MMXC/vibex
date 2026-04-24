# Spec: BatchExportCard

> **组件**: `src/components/import-export/BatchExportCard.tsx`
> **关联 Epic**: E5
> **状态机规范（神技4）**

---

## 四态定义

### 理想态（Ideal）

用户进入批量导出面板，有可导出组件：

```
[ ] 全选/取消全选  (已选 3/12)
─────────────────────────
[✓] Card: Header    v2
[ ] Card: Footer    v1
[✓] Button: Primary v3
...
─────────────────────────
[ 导出 ZIP (3个) ] ← 主按钮
```

- 复选框：每个组件左侧，`type="checkbox"`
- 勾选状态：`bg-primary`，未选：`bg-white border`
- 全选状态：indeterminate（部分选）时显示 dash
- 导出按钮：`bg-primary text-white`，选中数量动态
- 禁用条件：`selectedIds.size === 0`

### 空状态（Empty）

无组件可导出（`components.length === 0`）：

- 插图：下载图标，灰色 `#9CA3AF`
- 文案：**"暂无可导出的组件"**
- 副文案：**"在画布上创建组件后，可在此处批量导出"**
- 不显示导出按钮

### 加载态（Loading）

组件列表加载中：

- **骨架屏**：3 个卡片占位，逐个淡入（stagger 100ms）
- 卡片结构：`h-[56px] rounded-lg`，灰色背景 shimmer
- 禁止用 Spinner 或 Loading 文字

```tsx
// 骨架屏结构
{Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 100}ms` }} />
))}
```

### 错误态（Error）

组件列表加载失败：

- **Toast 错误提示**（非页面级错误）：
  - 文案：**"组件数据获取失败"**
  - 类型：error，停留 5s，自动消失
  - 操作：**"重试"** 按钮
- 不显示空列表（避免误导用户以为是空状态）

---

## Props 接口

```typescript
interface BatchExportCardProps {
  projectId: string;
  onExportSuccess?: (downloadUrl: string) => void;
  onExportError?: (error: string) => void;
}
```

---

## 导出流程状态

| 阶段 | UI | 说明 |
|------|-----|------|
| 空闲 | 导出按钮可用 | 选择 ≥1 组件 |
| 导出中 | 按钮禁用 + spinner + "导出中..." | ZIP 生成 + KV 上传 |
| 成功 | Toast + 链接按钮 | 显示 downloadUrl，5 分钟有效 |
| 失败 | Toast error + 重试按钮 | 5s 后自动消失 |

---

## 原子化规范（神技5）

- 间距：8px 倍数（卡片 padding 16px，组件间距 8px）
- 颜色：`border-gray-200`，`bg-white`，`text-gray-900`
- 选中色：`bg-primary`（主色调 token）
- 错误色：`text-red-500`，`bg-red-50`

---

## 开发交接（神技6）

- 导出中禁止按钮二次点击（`disabled` + pointer-events-none）
- downloadUrl 点击后应新标签页打开
- 5 分钟倒计时提示："链接将在 5 分钟 后过期"
