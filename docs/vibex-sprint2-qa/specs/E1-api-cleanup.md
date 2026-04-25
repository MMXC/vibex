# Spec — E1: confirm() → ConfirmDialog 四态

**文件**: `specs/E1-api-cleanup.md`
**Epic**: E1 阻塞性 API 清理验证
**基于**: PRD vibex-sprint2-qa § E1
**状态**: ✅ 已修复

---

## 组件描述

DDSToolbar 删除操作组件。将同步阻塞的 `window.confirm()` 替换为 React 组件 ConfirmDialog，避免阻塞浏览器 UI 线程。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 用户点击删除按钮（🗑️ 图标），节点/边处于可选中状态

**视觉表现**:
- 删除按钮可见（`aria-label="删除"`）
- 点击后 ConfirmDialog 模态框居中弹出
- 模态框标题「确认删除」，内容描述删除影响
- 「取消」和「确认删除」两个按钮，「确认」按钮红色警示（`var(--color-danger)`）

**交互行为**:
- 点击「取消」→ 模态框关闭，无操作
- 点击「确认删除」→ 执行删除 → 模态框关闭
- 点击遮罩层 → 关闭模态框（等同取消）

**情绪引导**: 删除前有确认，用户有安全感。「确认删除」红色高亮，暗示不可逆。

---

### 2. 空状态（Empty）

**触发条件**: 无节点/边被选中，删除按钮不可点击

**视觉表现**:
- 删除按钮置灰（`disabled=true`，`opacity: 0.5`）
- `aria-disabled="true"`
- `cursor: not-allowed`

**交互行为**:
- 点击置灰按钮 → 无响应（`pointer-events: none`）

**情绪引导**: 置灰是最明确的「当前不可用」信号，用户不会困惑。

---

### 3. 加载态（Loading）

**触发条件**: 用户点击「确认删除」，删除操作异步处理中

**视觉表现**:
- 「确认删除」按钮显示 spinner（`var(--spinner)`）
- 按钮文字变为「删除中...」
- 按钮 `disabled=true`

**交互行为**:
- 禁止重复点击
- 加载完成 → 模态框关闭 → Toast 提示「删除成功」

---

### 4. 错误态（Error）

**触发条件**: 删除操作失败（如网络错误、后端返回 500）

**视觉表现**:
- 模态框内显示红色错误文案「删除失败，请重试」
- 「确认删除」按钮恢复可用（可重试）
- 按钮文字恢复「确认删除」

**交互行为**:
- 点击「取消」可关闭模态框
- 点击「确认删除」可重试

---

## 技术约束

- **禁止**: `window.confirm()` / `window.alert()` / `window.prompt()`
- **必须**: ConfirmDialog 组件 + store 状态管理
- **禁止硬编码颜色**: 使用 `var(--color-danger)` / `var(--color-surface-overlay)`
- **禁止硬编码间距**: 使用 `var(--space-8)` / `var(--space-16)` / `var(--space-24)`
