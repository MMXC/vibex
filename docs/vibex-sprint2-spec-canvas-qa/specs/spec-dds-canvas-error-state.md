# Spec — DDS Canvas 错误态（Error State）

**文件**: `spec-dds-canvas-error-state.md`
**组件**: DDSCanvasPage / AIDraftDrawer / DDSFlow
**Epic**: Epic 5 — S5.3
**状态**: 进行中

---

## 1. 原则

错误态的核心是**给出路**：用户看到错误 → 理解发生了什么 → 知道能做什么。不要只报告"连接失败"，要引导下一步。

---

## 2. 四类错误态定义

### 2.1 网络异常（Network Error）

**触发条件**: `fetch()` 返回 NetworkError / ECONNREFUSED / CORS 错误

**UI 表现**:
```
┌─────────────────────────────────────────────┐
│                                             │
│              ⛔ [网络图标]                   │
│                                             │
│           网络连接失败                        │
│                                             │
│     无法连接到服务器，请检查网络后重试         │
│                                             │
│        [ 重新加载 ]    [ 联系支持 ]          │
│                                             │
│     自动重试: 5s 后自动尝试重新连接...        │
│                                             │
└─────────────────────────────────────────────┘
```

**错误码映射**:
- `ERR_NAME_NOT_RESOLVED` → 网络异常
- `ERR_CONNECTION_REFUSED` → 网络异常
- `CORS` → 网络异常（降级为通用文案）
- 超时 10s → 网络异常

**自动重试**: 5s 后自动重试一次，超过则停止，显示"未收到响应"按钮

**布局**: 全屏居中覆盖层，`bg: rgba(0,0,0,0.8)`, `backdrop-filter: blur(8px)`

---

### 2.2 权限不足（Permission Denied）

**触发条件**: HTTP 403 / 401 返回

**UI 表现**:
```
┌─────────────────────────────────────────────┐
│                                             │
│              🔒 [锁图标]                    │
│                                             │
│          您没有此项目的编辑权限               │
│                                             │
│     只有项目成员可以编辑详细设计规范卡片        │
│                                             │
│     [ 查看只读版本 ]   [ 联系项目管理员 ]    │
│                                             │
└─────────────────────────────────────────────┘
```

**权限细分**:
| 权限状态 | 按钮 |
|---------|------|
| 未登录（401） | [ 登录 ] [ 注册 ] |
| 无项目访问权（403） | [ 申请访问权限 ] [ 返回首页 ] |
| 无编辑权（403，但可读） | [ 查看只读版本 ] [ 联系管理员 ] |

**只读版本**: 展示卡片内容但禁用所有编辑/新增/删除/AI 生成操作，UI 上通过 opacity: 0.6 + cursor: not-allowed 区分

---

### 2.3 数据超长（Content Overflow）

**触发条件**: API 返回的卡片内容字段超过 UI 可安全渲染的长度（title > 500 chars, description > 5000 chars）

**UI 表现**:

**卡片级别**:
```
┌──────────────────────────┐
│ [标题] 这是一个很长的标题... │
│                          │
│ [描述] 这是内容的一部分...   │
│   ↓                      │
│ [展开查看全部]             │
└──────────────────────────┘
```

点击"展开查看全部" → 展开 Modal 显示完整内容，Modal 内有"复制全部"按钮。

**章节列表级别**（大量数据场景）:
```
⚠️ 此章节包含大量数据（128 张卡片），已启用性能模式
[ 显示全部 ] [ 显示前 50 张 ]
```

---

### 2.4 接口超时（Request Timeout）

**触发条件**: 请求超过 10s 未返回 / HTTP 504 Gateway Timeout

**UI 表现**:
```
┌─────────────────────────────────────────────┐
│                                             │
│              ⏱️ [时钟图标]                   │
│                                             │
│            请求超时                          │
│                                             │
│     服务器处理时间过长，请稍后重试             │
│                                             │
│          [ 重新提交 ]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**超时重试策略**:
1. 首次超时 → 自动重试 1 次（不显示重试按钮，等待 2s）
2. 重试仍超时 → 显示重试按钮
3. 手动重试 → 重新发起请求，保留用户输入内容

---

## 3. Toast 错误通知

对于**非阻塞性错误**（如单卡片保存失败），使用 Toast 通知而非全屏覆盖：

```typescript
// Toast 规格
interface ErrorToast {
  type: 'error';
  message: string;
  duration: 4000;       // 4s 后自动消失
  action?: {
    label: string;      // e.g. "重试"
    onClick: () => void;
  };
}
```

**Toast 错误类型**:

| 场景 | 文案 |
|------|------|
| 卡片保存失败 | "卡片保存失败，请重试" + [重试] |
| 卡片删除失败 | "删除失败，请重试" + [重试] |
| AI 生成失败 | "AI 生成失败，请稍后重试" + [重试] |
| 边创建失败 | "关系创建失败，请重试" + [重试] |
| 网络不稳定 | "网络不稳定，部分操作可能失败" |

---

## 4. 全局错误边界（Error Boundary）

**规则**: React Error Boundary 包裹 `DDSCanvasPage` 根组件

**触发条件**: 未捕获的 JS 异常 / React render error

**表现**:
```
┌─────────────────────────────────────────────┐
│              💥 页面出现异常                  │
│                                             │
│     请刷新页面或联系技术支持                  │
│                                             │
│          [ 刷新页面 ]  [ 返回首页 ]          │
└─────────────────────────────────────────────┘
```

**不暴露错误详情给用户**，错误信息记录到日志系统。

---

## 5. 验收标准

```typescript
// 网络异常
expect(screen.getByText('网络连接失败')).toBeVisible();
expect(screen.getByRole('button', { name: '重新加载' })).toBeVisible();
expect(screen.getByText(/自动重试/)).toBeVisible();

// 权限不足
expect(screen.getByText(/没有编辑权限/)).toBeVisible();
expect(screen.getByRole('button', { name: '联系项目管理员' })).toBeVisible();

// 数据超长
expect(screen.getByText('展开查看全部')).toBeVisible();
expect(click('展开查看全部')).toOpenModal();

// 接口超时
expect(screen.getByText('请求超时')).toBeVisible();
expect(screen.getByRole('button', { name: '重新提交' })).toBeVisible();

// Toast 错误
expect(screen.getByText('卡片保存失败，请重试')).toBeVisible();
expect(screen.getByRole('button', { name: '重试' })).toBeVisible();

// Error Boundary
expect(screen.getByText('页面出现异常')).toBeVisible();
expect(screen.getByRole('button', { name: '刷新页面' })).toBeVisible();
```

---

## 6. 错误恢复路径

```
错误发生
  ├── 网络异常 → 重试成功 → 恢复正常
  │             重试失败 → 显示重试按钮
  ├── 权限不足 → 用户切换账号/申请权限 → 重试
  ├── 数据超长 → 用户展开查看/分页加载 → 恢复正常
  └── 接口超时 → 重试成功 → 恢复正常
                重试失败 → 显示重试按钮
```

---

*PM Agent | 2026-04-17*
