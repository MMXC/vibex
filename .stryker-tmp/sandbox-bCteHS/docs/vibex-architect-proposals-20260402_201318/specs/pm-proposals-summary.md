# Spec: PM 提案汇总 (P-001 ~ P-006)

**来源**: Architect Agent 评估矩阵  
**优先级**: P-001~P-004 Sprint 1-2 | P-005~P-006 Defer

---

## 1. P-001: 确认状态可视化

**优先级**: P1  
**Sprint**: Sprint 1（合并到 D-E1/E2 实施）

### 规格

- 确认状态通过视觉标识区分（颜色/图标/border）
- 状态变化时有动画反馈（transition 0.2s）
- 符合 ADR-003 CSS 命名规范

### 状态映射

| 状态 | 视觉表现 | CSS 类 |
|------|---------|--------|
| `unconfirmed` | 橙色 border | `--color-warning` |
| `confirmed` | 绿色 border | `--color-success` |
| `generating` | 蓝色 border + loading | `--color-info` |

### 验收标准

- [ ] 确认状态可视化实现
- [ ] 动画反馈流畅
- [ ] ADR-003 命名规范符合

---

## 2. P-002: 面板状态持久化

**优先级**: P2（可提前实施）  
**Sprint**: Sprint 2（独立于 D-003）

### 规格

- 面板折叠状态保存到 localStorage
- 键名: `vibex-panel-state`
- 游客使用 sessionStorage
- 退出登录后可选清除

### 验收标准

- [ ] 面板状态刷新后恢复
- [ ] localStorage 失败时有降级
- [ ] Playwright 测试覆盖

---

## 3. P-003: 导出向导

**优先级**: P2  
**Sprint**: Sprint 2（需 API 稳定）

### 规格

| 步骤 | 内容 |
|------|------|
| Step 1 | 格式选择（Mermaid / JSON / PNG / SVG）|
| Step 2 | 选项配置（深度、布局、主题）|
| Step 3 | 预览效果 |
| Step 4 | 确认导出 |

### 导出格式

| 格式 | 实现方式 |
|------|---------|
| Mermaid | 直接序列化 nodes → mermaid syntax |
| JSON | JSON.stringify(nodes) |
| PNG | html2canvas / SVG2Canvas |
| SVG | 直接导出 SVG DOM |

### 验收标准

- [ ] 4 步骤导出向导 UI
- [ ] 所有格式导出正常
- [ ] API 不稳定时优雅降级
- [ ] 导出进度指示

---

## 4. P-004: 空状态引导

**优先级**: P2  
**Sprint**: Sprint 2

### 规格

| 面板 | 空状态文案 | 引导操作 |
|------|---------|---------|
| Context 树 | "还没有任何上下文，点击创建第一个" | [创建上下文] |
| Flow 树 | "还没有流程，创建上下文后自动生成" | [查看上下文] |
| Component 树 | "还没有组件，从上下文中生成" | [生成组件] |

### 验收标准

- [ ] 所有面板空状态覆盖
- [ ] 空状态有快速创建入口
- [ ] 文案经过审核

---

## 5. P-005: 移动端降级（Defer → 降级为只读）

**优先级**: Defer  
**Sprint**: 待定

### 规格（降级方案）

- 仅支持只读视图，Canvas 编辑操作禁用
- 响应式 CSS 适配
- 核心信息可清晰展示

### 验收标准

- [ ] 移动端布局适配
- [ ] 只读模式功能限制明确
- [ ] 编辑操作禁用提示

---

## 6. P-006: PRD 导出（Defer）

**优先级**: Defer  
**Sprint**: 待定

### 规格

- 暂缓，等 API 稳定后评估
- 替代方案: Markdown 模板下载

### 替代方案

```markdown
# {Project Name}

## Bounded Contexts
{context list}

## Flows
{flow list}

## Components
{component list}
```

### 验收标准

- [ ] 需求重新评审后决定实施范围

---

## 7. 实施优先级总览

| 提案 | Sprint | 依赖 | 预计工时 |
|------|--------|------|---------|
| P-001 | Sprint 1 | D-E1/E2 | 2h（合并）|
| P-002 | Sprint 2 | 独立 | 3h |
| P-003 | Sprint 2 | API 稳定 | 8h |
| P-004 | Sprint 2 | 独立 | 2h |
| P-005 | Defer | Sprint 1+ | 待定 |
| P-006 | Defer | API 稳定 | 待定 |
