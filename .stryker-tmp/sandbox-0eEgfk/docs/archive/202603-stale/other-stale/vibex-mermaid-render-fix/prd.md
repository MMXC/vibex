# PRD: vibex-mermaid-render-fix

> **状态**: 建设中 | **优先级**: P0 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: 首页点击分析后 Mermaid 图表未渲染，根因为双组件竞争 + 初始化时序问题 + 缺少错误处理

---

## 1. 执行摘要

首页点击"分析"后，Mermaid 图表未渲染，用户无法看到 DDD 分析结果的可视化。根因为项目存在两套 Mermaid 渲染组件（MermaidPreview vs MermaidRenderer）竞争、初始化时序不确定、缺少错误重试和降级方案。修复方案：统一初始化管理器 + 预加载 + 降级显示。

---

## 2. Epic 拆分

### Epic 1: 统一 Mermaid 初始化管理

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 创建 MermaidManager 单例 | getInstance() 返回单例，initialize() 仅执行一次 |
| S1.2 | 预初始化 | layout.tsx useEffect 中调用 initialize()，启动时静默加载 |
| S1.3 | 统一配置 | theme='dark', securityLevel='loose' |

### Epic 2: 重构 MermaidPreview 组件

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S2.1 | 使用 MermaidManager.render() | 替换原有 getMermaid() + render() 逻辑 |
| S2.2 | 添加降级方案 | 渲染失败时显示原始代码 |
| S2.3 | 改进错误消息 | 显示具体错误原因而非通用消息 |

### Epic 3: 清理旧组件

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S3.1 | 移除 MermaidRenderer 引用 | PreviewArea 中无 MermaidRenderer 引用 |
| S3.2 | 验证构建通过 | npm run build 成功，无警告 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | MermaidManager 单例 | 创建 `src/lib/mermaid/MermaidManager.ts`，提供 getInstance/initialize/render | expect(MermaidManager.getInstance()).toBe(MermaidManager.getInstance()) | - |
| F1.2 | 预初始化调用 | 在 `src/app/layout.tsx` useEffect 中调用 `mermaidManager.initialize()` | expect(() => { mermaidManager.initialize() }).not.toThrow() | **【需页面集成】** src/app/layout.tsx |
| F1.3 | 统一配置 | MermaidManager 中配置 theme='dark', securityLevel='loose' | expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({theme:'dark',securityLevel:'loose'})) | - |
| F2.1 | MermaidPreview 重构 | `src/components/ui/MermaidPreview.tsx` 使用 mermaidManager.render() | expect(await mermaidManager.render('graph TD;A-->B')).resolves.toContain('<svg') | **【需页面集成】** src/components/ui/MermaidPreview.tsx |
| F2.2 | 降级方案 | 渲染失败时 `<details><summary>查看原始代码</summary><pre>{code}</pre></details>` | 传入 invalid code 后 expect(screen.getByText('查看原始代码')).toBeTruthy() | **【需页面集成】** src/components/ui/MermaidPreview.tsx |
| F2.3 | 错误消息改进 | error message 从 "图表渲染失败" 改为具体原因 | 语法错误时 expect(error).toMatch(/语法/) | **【需页面集成】** src/components/ui/MermaidPreview.tsx |
| F3.1 | 移除旧组件引用 | PreviewArea 中不引用 MermaidRenderer | expect(code).not.toContain('MermaidRenderer') | **【需页面集成】** src/components/homepage/PreviewArea/PreviewArea.tsx |

---

## 4. 依赖关系

- **上游**: vibex-mermaid-render-fix / analyze-requirements ✅
- **下游**: vibex-mermaid-render-fix / impl-mermaid-fix（Dev）
- **下游**: vibex-mermaid-render-fix / test-mermaid（Tester）

---

## 5. 技术约束

1. Mermaid 版本锁定为 11.13.0，监控未来 API 变更
2. 预初始化在 layout.tsx 中静默执行，不阻塞 UI
3. 降级方案：渲染失败时显示原始代码，始终有内容可看
4. 目标文件均标注【需页面集成】

---

## 6. 实施步骤

```
Phase 1: MermaidManager (1h)
  - 创建 src/lib/mermaid/MermaidManager.ts
  - layout.tsx 添加 initialize() 调用

Phase 2: MermaidPreview 重构 (2h)
  - 替换 getMermaid() 为 mermaidManager.render()
  - 添加降级显示
  - 改进错误消息

Phase 3: 清理 (0.5h)
  - 移除 MermaidRenderer 引用
  - npm run build 验证
```

**预估总工时**: 3.5 小时

---

## 7. 验收标准汇总

- [ ] F1.1: MermaidManager 单例正确
- [ ] F1.2: 预初始化不抛出错误
- [ ] F1.3: 配置统一
- [ ] F2.1: 渲染逻辑替换
- [ ] F2.2: 降级显示正常
- [ ] F2.3: 错误消息具体
- [ ] F3.1: 旧组件引用移除
- [ ] AC: npm run build 成功

---

*PM Agent | 2026-03-20*
