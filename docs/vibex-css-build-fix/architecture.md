# VibeX CSS Build Fix — 系统架构设计

**项目**: vibex-css-build-fix
**阶段**: design-architecture
**架构师**: Architect Agent
**日期**: 2026-04-04
**版本**: v1.0

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-04

---

## 1. 问题分析

### 1.1 错误信息

```
Build error occurred
Error: Turbopack build failed with 1 errors:
./vibex/vibex-fronted/src/app/dashboard/dashboard.module.css:808:21
Parsing CSS source code failed

Invalid token in pseudo element: WhiteSpace(" ")
```

### 1.2 根因

第 808 行存在孤立 CSS 属性 `flex-direction: column;`，不属于任何选择器。解析器无法识别归属，将缩进空格视为无效伪元素标记。

**上下文**:
```css
/* 第 803-809 行 */
  .searchInput {
    width: 100%;
  }
}                           /* @media 闭合 */
    flex-direction: column;  /* ← 孤立属性 */
.trashButton {
```

**判断**: 该属性冗余——`.header` 和 `.sectionHeader` 已有相同 `flex-direction: column` 设置。删除后不影响 UI。

---

## 2. 技术方案

### 2.1 修复操作

```bash
# 删除 dashboard.module.css 第 808 行
sed -i '808d' src/app/dashboard/dashboard.module.css
```

### 2.2 stylelint 防御机制

```bash
# 安装
pnpm add -D stylelint stylelint-config-standard

# package.json 添加
"lint:css": "stylelint \"src/**/*.css\" \"src/**/*.module.css\""
```

### 2.3 CI 集成

```yaml
# .github/workflows/ci.yml
- name: Lint CSS
  run: pnpm run lint:css
```

---

## 3. 验收标准

| Epic | 指标 | 验证方式 |
|------|------|---------|
| E1 | `npm run build` exit 0 | 构建命令 |
| E1 | Dashboard 页面渲染正常 | 手动验证 |
| E1 | 响应式布局 768px | DevTools 移动模拟 |
| E2 | stylelint 可检测孤立属性 | 测试验证 |
| E2 | CI 中 stylelint 失败阻断 | CI 验证 |
| E3 | 所有 module.css 无孤立属性 | `rg` 扫描 |

---

## 4. 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 删除有用样式 | 极低 | 低 | `.header`/`.sectionHeader` 已有相同属性 |
| stylelint 误报 | 低 | 低 | 配置 `ignoreFiles: ["**/*.min.css"]` |

---

## 5. 实施顺序

```
E1（立即）
  → 删除第 808 行
  → npm run build 验证
  → Dashboard 页面验证

E2（E1 后）
  → 安装 stylelint
  → 配置 .stylelintrc.json
  → 添加 lint:css script
  → 集成 CI

E3（E2 后）
  → 批量扫描所有 module.css
  → 修复发现的问题
```

---

*文档版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-04*
