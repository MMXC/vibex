# E2E 截图部署 PRD

**项目**: vibex-e2e-screenshots-deploy  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

E2E 测试截图需要通过 URL 公开访问，但当前存在以下问题：
- 截图存储在 `tests/` 目录，不在构建输出中
- `https://vibex-app.pages.dev/tests/e2e/screenshots/...` 返回 404
- 发布功能无法发送截图链接

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 截图路径可公开访问
- 每个功能有验收标准
- 构建后自动复制截图

### 2.2 Non-Goals
- 不修改现有截图生成逻辑
- 不实现截图存储服务
- 不修改 Git 仓库结构

---

## 3. Solution: 构建后复制 (方案B)

### 3.1 架构

```
tests/e2e/screenshots/          (截图源目录)
         ↓  postbuild 钩子
out/tests/e2e/screenshots/       (构建输出)
         ↓  Cloudflare Pages 部署
https://vibex-app.pages.dev/tests/e2e/screenshots/
```

### 3.2 实施内容

| # | 任务 | 文件 |
|---|------|------|
| 1 | 创建复制脚本 | `scripts/copy-screenshots.js` |
| 2 | 添加 postbuild 钩子 | `package.json` |
| 3 | 本地验证 | 构建测试 |
| 4 | 部署验证 | URL 访问测试 |

---

## 4. File Changes

### 4.1 新增文件

| 文件 | 描述 |
|------|------|
| `scripts/copy-screenshots.js` | 复制截图到 out 目录 |

### 4.2 修改文件

| 文件 | 修改内容 |
|------|---------|
| `package.json` | 添加 `"postbuild": "node scripts/copy-screenshots.js"` |

---

## 5. Acceptance Criteria (验收标准)

### 5.1 构建验证

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | `npm run build` 成功执行 | 构建无报错 |
| AC-02 | postbuild 钩子自动触发 | 查看构建日志 |
| AC-03 | `out/tests/e2e/screenshots/` 目录创建 | 检查目录存在 |
| AC-04 | 截图文件完整复制 | 检查文件数量 |

### 5.2 URL 访问验证

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-05 | 截图可通过 URL 访问 | curl 返回 200 |
| AC-06 | URL 路径正确 | 路径包含 /tests/e2e/screenshots/daily/ |
| AC-07 | 图片内容正确 | Content-Type: image/png |

### 5.3 功能验证

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-08 | 发布功能可发送截图链接 | 测试发布消息 |
| AC-09 | 链接可直接在浏览器打开 | 点击链接验证 |

---

## 6. Expected URL Patterns

```
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/dashboard.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/flow.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/homepage.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/landing-page.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/login-page.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/project-settings.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/requirements.png
https://vibex-app.pages.dev/tests/e2e/screenshots/daily/2026-03-05/templates.png
```

---

## 7. Definition of Done (DoD)

### 7.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | 构建后截图自动复制到 out 目录 |
| DoD-2 | 截图 URL 可公开访问 |
| DoD-3 | 每个截图文件可独立访问 |
| DoD-4 | 发布功能可发送截图链接 |

### 7.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-5 | 构建无报错 |
| DoD-6 | 复制脚本有错误处理 |
| DoD-7 | 源目录不存在时跳过复制 |

---

## 8. Risk Mitigation

| 风险 | 缓解措施 |
|------|----------|
| 截图目录不存在 | 添加 if (!fs.existsSync) return |
| 文件过大 | 定期清理 30 天前截图 |
| 路径权限 | 使用 Node.js API 确保跨平台 |

---

## 9. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| 创建复制脚本 | 10min |
| 添加 postbuild | 5min |
| 本地验证 | 10min |
| 部署验证 | 10min |
| **总计** | **35min** |

---

## 10. Dependencies

- **前置**: analyze-structure (已完成)
- **依赖**: 无外部依赖

---

*PRD 完成于 2026-03-05 (PM Agent)*
