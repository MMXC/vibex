# Learnings: vibex-proposals-20260411-page-structure

## 项目信息
- 项目名: vibex-proposals-20260411-page-structure
- 完成时间: 2026-04-07
- Epic数: 1（组件树页面结构增强）
- Dev commit: c8ffde20

## 核心发现

### pageId/pageName 非 ComponentNode 一等字段
当前 `ComponentNode` 没有 `pageId`/`pageName` 字段，隐式用 `flowId` 代替。分组逻辑：
- `flowId` → BusinessFlowNode.nodeId（唯一标识）
- `flowId` → getPageLabel() → BusinessFlowNode.name（显示名）

### JSON Preview 三套独立系统
- JsonRenderPreview: @json-render/react，支持 ComponentNode[] 渲染
- PagePreview: 独立页面预览，未集成到主 canvas
- PrototypePreview: 交互原型预览，未集成到主 canvas
- JsonTreeRenderer: 虚拟化 JSON 树，未集成

### dev→tester→reviewer 串行链性能问题
此项目 tester 积压超 2h，因为 tester 单实例无法并行。链式依赖导致 tester 成为瓶颈。

## 经验教训

### Epic 划分教训
此项目只有 1 Epic，但仍然出现 tester 积压 2h+ 的情况。原因：
- tester 同时处理多个项目（vibex-proposals-summary + vibex-proposals-page-tree + 本项目）
- tester 单会话无法并行

### 防范机制
- tester 积压时需要人工判断优先级或扩容 tester 会话
- 虚假完成检测：必须验证 commit hash 在 origin/main 中存在，不能仅靠描述性文本
