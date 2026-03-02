# AI 原型设计工具 - 详细任务拆解清单

**项目**: vibex-ai-prototype-builder
**创建时间**: 2026-03-01 16:03
**总任务数**: 32 个

---

## Phase 1: 基础框架 (11 个任务)

### 1.1 需求输入界面模块 (5 个任务)

#### T1.1.1 创建需求输入页面
- **类型**: dev
- **描述**: 新建 `/prototype/input` 页面路由，包含基础布局
- **约束**: 
  - 使用 Next.js App Router
  - 继承全局 layout
  - 响应式布局
- **验证标准**: 
  ```bash
  curl -s http://localhost:3000/prototype/input | grep "需求输入"
  ```
- **依赖**: 无
- **预估工时**: 2h

#### T1.1.2 实现自然语言输入组件
- **类型**: dev
- **描述**: 多行文本输入框，支持字符计数、自动保存到 localStorage
- **约束**:
  - 最大 2000 字符
  - 自动保存间隔 500ms
  - 支持 Ctrl+Enter 快捷提交
- **验证标准**:
  ```bash
  # 组件文件存在
  test -f src/components/prototype/RequirementInput.tsx
  ```
- **依赖**: T1.1.1
- **预估工时**: 3h

#### T1.1.3 实现示例提示组件
- **类型**: dev
- **描述**: 展示示例需求卡片，点击可填充到输入框
- **约束**:
  - 至少 3 个示例
  - 支持分类展示
  - 点击自动填充
- **验证标准**:
  ```bash
  grep -c "示例" src/components/prototype/ExamplePrompts.tsx
  ```
- **依赖**: T1.1.1, T1.1.2
- **预估工时**: 2h

#### T1.1.4 实现文件上传组件
- **类型**: dev
- **描述**: 支持拖拽上传 PDF/Word/TXT 文件
- **约束**:
  - 最大文件 10MB
  - 支持拖拽
  - 上传进度显示
- **验证标准**:
  ```bash
  grep -c "accept=" src/components/prototype/FileUpload.tsx
  ```
- **依赖**: T1.1.1
- **预估工时**: 4h

#### T1.1.5 实现分步引导组件
- **类型**: dev
- **描述**: 3 步引导流程：需求类型选择 → 详细描述 → 确认提交
- **约束**:
  - 步骤指示器
  - 上一步/下一步按钮
  - 步骤间数据保持
- **验证标准**:
  ```bash
  grep -c "step" src/components/prototype/StepGuide.tsx
  ```
- **依赖**: T1.1.2, T1.1.3, T1.1.4
- **预估工时**: 4h

### 1.2 领域模型展示模块 (6 个任务)

#### T1.2.1 创建领域模型页面
- **类型**: dev
- **描述**: 新建 `/prototype/model` 页面，展示领域模型树形结构
- **约束**:
  - 左右分栏布局
  - 左侧模型树，右侧详情面板
- **验证标准**:
  ```bash
  curl -s http://localhost:3000/prototype/model | grep "领域模型"
  ```
- **依赖**: 无
- **预估工时**: 2h

#### T1.2.2 实现树形结构组件
- **类型**: dev
- **描述**: 递归渲染树形结构，支持展开/折叠
- **约束**:
  - 无限层级支持
  - 动画效果
  - 虚拟滚动优化
- **验证标准**:
  ```bash
  grep -c "TreeNode" src/components/prototype/ModelTree.tsx
  ```
- **依赖**: T1.2.1
- **预估工时**: 4h

#### T1.2.3 实现搜索筛选组件
- **类型**: dev
- **描述**: 关键词搜索 + 分类筛选
- **约束**:
  - 实时搜索 (debounce 300ms)
  - 高亮匹配结果
  - 支持正则表达式
- **验证标准**:
  ```bash
  grep -c "debounce" src/components/prototype/SearchFilter.tsx
  ```
- **依赖**: T1.2.2
- **预估工时**: 3h

#### T1.2.4 实现节点选择组件
- **类型**: dev
- **描述**: 单选/多选/全选/反选功能
- **约束**:
  - Ctrl 点击多选
  - Shift 点击范围选择
  - 选中状态持久化
- **验证标准**:
  ```bash
  grep -c "selected" src/components/prototype/NodeSelector.tsx
  ```
- **依赖**: T1.2.2
- **预估工时**: 3h

#### T1.2.5 实现节点属性面板
- **类型**: dev
- **描述**: 显示选中节点详情，支持编辑
- **约束**:
  - 表单验证
  - 实时预览
  - 保存/取消按钮
- **验证标准**:
  ```bash
  grep -c "property" src/components/prototype/PropertyPanel.tsx
  ```
- **依赖**: T1.2.4
- **预估工时**: 4h

#### T1.2.6 实现模型预览组件
- **类型**: dev
- **描述**: 整体预览、缩放、导出 PNG
- **约束**:
  - 支持 50%-200% 缩放
  - 导出透明背景 PNG
  - 全屏预览模式
- **验证标准**:
  ```bash
  grep -c "canvas" src/components/prototype/ModelPreview.tsx
  ```
- **依赖**: T1.2.2
- **预估工时**: 4h

---

## Phase 2: AI 集成 (8 个任务)

### 2.1 需求解析 API (2 个任务)

#### T2.1.1 实现需求解析 API
- **类型**: dev (backend)
- **描述**: 调用 LLM 解析自然语言需求，返回结构化 JSON
- **约束**:
  - 输入: 自然语言文本
  - 输出: 结构化需求 JSON
  - 超时 30s
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/parse \
    -H "Content-Type: application/json" \
    -d '{"text":"我需要一个电商系统"}' | jq '.requirements'
  ```
- **依赖**: T1.1.2
- **预估工时**: 6h

#### T2.1.2 实现文档解析 API
- **类型**: dev (backend)
- **描述**: 解析上传的 PDF/Word 文档，提取关键信息
- **约束**:
  - 支持 PDF (pdf-parse)
  - 支持 Word (mammoth)
  - 支持 TXT (原生)
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/parse-document \
    -F "file=@test.pdf" | jq '.content'
  ```
- **依赖**: T1.1.4
- **预估工时**: 6h

### 2.2 模型生成 API (3 个任务)

#### T2.2.1 实现领域模型生成 API
- **类型**: dev (backend)
- **描述**: 基于需求生成领域模型树形结构
- **约束**:
  - 输入: 结构化需求
  - 输出: 树形模型 JSON
  - 支持增量更新
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/model \
    -H "Content-Type: application/json" \
    -d '{"requirements":{}}' | jq '.model'
  ```
- **依赖**: T2.1.1, T2.1.2
- **预估工时**: 8h

#### T2.2.2 实现模型优化 API
- **类型**: dev (backend)
- **描述**: 根据用户反馈优化模型
- **约束**:
  - 支持增量更新
  - 版本历史记录
  - 回滚支持
- **验证标准**:
  ```bash
  curl -X PUT http://localhost:3000/api/prototype/model/123 \
    -H "Content-Type: application/json" \
    -d '{"feedback":"增加用户管理模块"}' | jq '.model'
  ```
- **依赖**: T2.2.1
- **预估工时**: 6h

#### T2.2.3 实现原型生成 API
- **类型**: dev (backend)
- **描述**: 基于模型生成 React 组件代码
- **约束**:
  - 输出 React 组件
  - 支持 TypeScript
  - 支持样式生成
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/generate \
    -H "Content-Type: application/json" \
    -d '{"model":{}}' | jq '.components'
  ```
- **依赖**: T2.2.1
- **预估工时**: 10h

### 2.3 AI 对话集成 (2 个任务)

#### T2.3.1 实现 AI 对话面板
- **类型**: dev
- **描述**: 在原型编辑器中嵌入 AI 对话面板
- **约束**:
  - SSE 流式响应
  - Markdown 渲染
  - 历史记录
- **验证标准**:
  ```bash
  grep -c "EventSource" src/components/prototype/AIChatPanel.tsx
  ```
- **依赖**: T2.2.3
- **预估工时**: 6h

#### T2.3.2 实现指令解析组件
- **类型**: dev
- **描述**: 解析用户指令并执行对应操作
- **约束**:
  - 支持常用指令: /add, /delete, /modify, /preview
  - 指令提示
  - 错误处理
- **验证标准**:
  ```bash
  grep -c "parseCommand" src/lib/commandParser.ts
  ```
- **依赖**: T2.3.1
- **预估工时**: 4h

---

## Phase 3: 高级功能 (8 个任务)

### 3.1 原型编辑增强 (3 个任务)

#### T3.1.1 增强拖拽编辑器
- **类型**: dev
- **描述**: 复用现有 editor，添加 AI 辅助功能
- **约束**:
  - 保持现有功能
  - 添加 AI 建议面板
  - 支持组件推荐
- **验证标准**:
  ```bash
  npm run build 2>&1 | grep -c "error"
  ```
- **依赖**: T2.2.3
- **预估工时**: 6h

#### T3.1.2 实现多页面管理
- **类型**: dev
- **描述**: 页面列表、切换、重命名、删除
- **约束**:
  - 支持 10+ 页面
  - 拖拽排序
  - 页面缩略图
- **验证标准**:
  ```bash
  grep -c "PageManager" src/components/prototype/PageManager.tsx
  ```
- **依赖**: T3.1.1
- **预估工时**: 6h

#### T3.1.3 实现预览模式
- **类型**: dev
- **描述**: 独立预览窗口，支持设备模拟
- **约束**:
  - 桌面/平板/手机预览
  - 全屏预览
  - 分享链接
- **验证标准**:
  ```bash
  grep -c "Preview" src/components/prototype/PreviewMode.tsx
  ```
- **依赖**: T3.1.2
- **预估工时**: 4h

### 3.2 PRD 导出功能 (5 个任务)

#### T3.2.1 创建 PRD 导出页面
- **类型**: dev
- **描述**: 新建 `/prototype/export` 页面
- **约束**:
  - 响应式布局
  - 预览+导出分栏
  - 导出历史
- **验证标准**:
  ```bash
  curl -s http://localhost:3000/prototype/export | grep "PRD"
  ```
- **依赖**: T1.2.6
- **预估工时**: 2h

#### T3.2.2 实现文档预览组件
- **类型**: dev
- **描述**: Markdown 渲染、样式预览
- **约束**:
  - GitHub Markdown 风格
  - 代码高亮
  - 目录导航
- **验证标准**:
  ```bash
  grep -c "markdown" src/components/prototype/DocumentPreview.tsx
  ```
- **依赖**: T3.2.1
- **预估工时**: 4h

#### T3.2.3 实现 Markdown 导出
- **类型**: dev
- **描述**: 生成 .md 文件下载
- **约束**:
  - UTF-8 编码
  - 图片嵌入 (base64)
  - 模板支持
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/export/markdown \
    -H "Content-Type: application/json" \
    -d '{"model":{}}' --output test.md
  ```
- **依赖**: T3.2.2
- **预估工时**: 3h

#### T3.2.4 实现 PDF 导出
- **类型**: dev
- **描述**: HTML 转 PDF 下载
- **约束**:
  - A4 格式
  - 分页支持
  - 目录生成
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/export/pdf \
    -H "Content-Type: application/json" \
    -d '{"model":{}}' --output test.pdf
  ```
- **依赖**: T3.2.2
- **预估工时**: 6h

#### T3.2.5 实现 Word 导出
- **类型**: dev
- **描述**: 生成 .docx 文件下载
- **约束**:
  - 兼容 Word 2016+
  - 样式保持
  - 图片嵌入
- **验证标准**:
  ```bash
  curl -X POST http://localhost:3000/api/prototype/export/word \
    -H "Content-Type: application/json" \
    -d '{"model":{}}' --output test.docx
  ```
- **依赖**: T3.2.2
- **预估工时**: 6h

---

## Phase 4: 测试与优化 (5 个任务)

#### T4.1 单元测试
- **类型**: tester
- **描述**: 核心组件单元测试
- **约束**:
  - Jest + React Testing Library
  - 覆盖率 > 60%
  - CI 集成
- **验证标准**:
  ```bash
  npm test -- --coverage | grep "All files"
  ```
- **依赖**: Phase 1-3 完成
- **预估工时**: 8h

#### T4.2 集成测试
- **类型**: tester
- **描述**: API 集成测试
- **约束**:
  - Supertest
  - 所有 API 测试通过
  - Mock LLM 响应
- **验证标准**:
  ```bash
  npm run test:integration | grep "passing"
  ```
- **依赖**: T4.1
- **预估工时**: 6h

#### T4.3 E2E 测试
- **类型**: tester
- **描述**: 完整流程端到端测试
- **约束**:
  - Playwright
  - 关键流程覆盖
  - 截图对比
- **验证标准**:
  ```bash
  npx playwright test | grep "passed"
  ```
- **依赖**: T4.2
- **预估工时**: 8h

#### T4.4 性能优化
- **类型**: dev
- **描述**: 性能分析和优化
- **约束**:
  - 首屏加载 < 3s
  - Lighthouse > 80
  - 包体积 < 500KB
- **验证标准**:
  ```bash
  npx lighthouse http://localhost:3000 --output=json | jq '.categories.performance.score'
  ```
- **依赖**: T4.3
- **预估工时**: 6h

#### T4.5 文档完善
- **类型**: docs
- **描述**: API 文档、使用指南、部署文档
- **约束**:
  - Markdown 格式
  - 示例代码
  - 多语言支持
- **验证标准**:
  ```bash
  ls -la docs/api.md docs/guide.md docs/deploy.md
  ```
- **依赖**: T4.4
- **预估工时**: 4h

---

## 任务统计

| Phase | 任务数 | 预估工时 |
|-------|--------|----------|
| Phase 1 | 11 | 36h |
| Phase 2 | 8 | 46h |
| Phase 3 | 8 | 31h |
| Phase 4 | 5 | 32h |
| **总计** | **32** | **145h** |

---

## 执行顺序建议

```
Week 1: T1.1.1 → T1.1.2 → T1.1.3 → T1.1.4 → T1.1.5 → T1.2.1 → T1.2.2
Week 2: T1.2.3 → T1.2.4 → T1.2.5 → T1.2.6 → T2.1.1 → T2.1.2 → T2.2.1
Week 3: T2.2.2 → T2.2.3 → T2.3.1 → T2.3.2 → T3.1.1 → T3.1.2 → T3.1.3
Week 4: T3.2.1 → T3.2.2 → T3.2.3 → T3.2.4 → T3.2.5 → T4.1 → T4.2 → T4.3 → T4.4 → T4.5
```

---

**创建者**: Analyst Agent
**创建时间**: 2026-03-01 16:03