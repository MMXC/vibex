# Spec: E2 WorkbenchUI

**Epic**: E2 — Workbench 生产化
**文件**: `src/components/WorkbenchUI.tsx` + `SessionList.tsx` + `TaskInput.tsx`

---

## 组件结构

```
WorkbenchUI
├── Header (固定)
├── SessionList (可滚动列表)
└── TaskInput (底部固定)
```

---

## 状态机定义

### WorkbenchUI 容器

| 状态 | 触发条件 | 视觉表现 |
|------|----------|----------|
| 理想态 | sessions 非空，gateway 可达 | 三个区块全部可见，header 显示 session count |
| 空状态 | sessions 为空，gateway 可达 | 三个区块全部可见，messages 区域显示引导插图+文案 |
| 加载态 | 首次加载或 sessions 正在获取 | 三个区块可见，messages 区域骨架屏（3 条灰色卡片） |
| 错误态 | gateway 不可达（E4-S6 失败） | 三个区块可见，header 显示红色警告「Gateway 不可达」 |

### 空状态规范（神技4）

**引导插图**: 抽象几何图标（一个圆圈 + 一个向下箭头），表示「开始启动」

**引导文案**:
- 主文案：「还没有运行中的任务」
- 副文案：「在下方输入框中输入任务，AI agent 将为您执行」
- 禁止只写「无内容」「No sessions」

### 加载态规范

**骨架屏**（禁止用转圈）：
- messages 区域：3 条等高灰色卡片，宽幅不一（60%, 80%, 70%）
- 卡片内无文字，渐变灰色 `#E5E7EB` → `#F3F4F6`
- 禁止使用 spinner

### 错误态覆盖

| 错误类型 | 显示文案 |
|----------|----------|
| Gateway 不可达 | 「连接失败，请检查网络后重试」+ 重试按钮 |
| Session 创建失败 | 「任务创建失败，请重试」+ 重试按钮 |
| 输入超长（>2000 chars） | 实时字符计数变红，submit 按钮禁用 |

### Header 状态

| 状态 | 内容 |
|------|------|
| 正常 | 显示「Workbench」+ session count badge |
| Gateway 错误 | 显示「Workbench ⚠️」+ 红色背景 |

### TaskInput 状态

| 状态 | 触发 | 视觉 |
|------|------|------|
| 理想态 | 可输入 | placeholder「输入任务描述...」，submit 按钮亮 |
| 禁用态 | 正在等待 agent 响应 | input 禁用，placeholder 变灰，submit 变「等待中...」|
| 错误态 | 上次提交失败 | input 边框红色，下方显示错误文案 |

---

## 原子化规范（神技5）

**间距**: 全部使用 8 的倍数
- 组件内 padding: 16px
- 元素间距: 8px / 16px / 24px
- 列表项间距: 12px

**颜色 Token**:
- 背景: `var(--color-bg-primary)`
- 卡片: `var(--color-bg-card)`
- 边框: `var(--color-border)`
- 文字主: `var(--color-text-primary)`
- 文字次: `var(--color-text-secondary)`
- 错误: `var(--color-error)`
- 成功: `var(--color-success)`
- 警告: `var(--color-warning)`

**禁止硬编码**: 所有颜色和间距必须使用 Token，禁止 `#FFFFFF`、`24px` 等硬编码出现在组件代码中。

---

## 响应式规范（神技6）

- 移动端（< 768px）: TaskInput 固定在底部，SessionList 占满剩余高度
- 桌面端（≥ 768px）: 最小宽度 400px，最大宽度 800px，居中显示
- 断点: `768px`