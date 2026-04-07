# 开发检查清单: vibex-homepage-activation/impl-hero-section

**项目**: vibex-homepage-activation
**任务**: impl-hero-section
**日期**: 2026-03-13
**开发者**: Dev Agent

---

## PRD 功能点对照

### B1: 首页输入即开始

| 验收标准 | 实现情况 | 验证方法 |
|----------|----------|----------|
| 不跳转页面 | ✅ 已实现 | 首页直接显示输入框，无跳转逻辑 |
| 实时反馈 | ✅ 已实现 | MermaidPreview 实时渲染 |
| 输入区在首屏 | ✅ 已实现 | 三栏布局：侧边栏/输入区/AI面板 |
| 模板推荐 | ✅ 已实现 | SAMPLE_REQUIREMENTS 示例点击填充 |
| 预览区域 | ✅ 已实现 | Tab 切换显示实时预览 |

---

## 实现位置

**文件**: `vibex-fronted/src/app/page.tsx`

**核心功能**:
- 单页式流程 (Single Page Flow)
- 实时 Mermaid 预览
- 模板示例点击填充
- Tab 切换 (需求输入 / 实时预览)

---

## 红线约束验证

| 约束 | 状态 |
|------|------|
| 不跳转页面 | ✅ 已满足 |
| 实时反馈 | ✅ 已满足 |

---

## 构建验证

| 验证项 | 结果 |
|--------|------|
| Frontend build | ✅ PASSED |

---

## 下一步

- B3: 差异化展示 (impl-differentiator)
- B6: 术语简化 (impl-terminology)
