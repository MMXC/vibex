# 分析报告：领域模型页面 Mermaid 实时渲染未切换展示

**项目**: vibex-mermaid-display-bug
**分析日期**: 2026-03-16
**分析师**: Analyst Agent
**状态**: 完成

---

## 一、执行摘要

**问题根因**：所有确认流程页面（context/model/flow）将 Mermaid 代码作为**纯文本**显示，而非使用 `MermaidPreview` 组件渲染为图表。

| 页面 | 当前实现 | 正确实现 |
|------|----------|----------|
| `/confirm/context/page.tsx` | `<pre>{contextMermaidCode}</pre>` | `<MermaidPreview code={contextMermaidCode} />` |
| `/confirm/model/page.tsx` | `<pre>{modelMermaidCode}</pre>` | `<MermaidPreview code={modelMermaidCode} />` |
| `/confirm/flow/page.tsx` | `<pre>{flowMermaidCode}</pre>` | `<MermaidPreview code={flowMermaidCode} />` |

**影响**：用户看到的是 Mermaid 代码文本，而非可视化图表，完全破坏用户体验。

---

## 二、问题定义

### 2.1 用户场景

```
用户操作流程：
1. 完成需求输入，进入 Step 2（限界上下文图）
2. 期望：看到可视化图表（节点、连线等）
3. 实际：看到代码文本 "graph TD\n  ctx-1[用户管理]..."
4. 同样问题出现在 Step 3（领域模型）和 Step 4（业务流程）
```

### 2.2 问题边界

| 维度 | 说明 |
|------|------|
| 涉及页面 | 3 个确认流程页面 |
| 涉及组件 | MermaidPreview（未使用） |
| 触发条件 | 所有用户访问确认流程 |
| 严重程度 | **P0** - 核心功能完全失效 |

---

## 三、代码分析

### 3.1 问题代码

**文件 1**: `/confirm/context/page.tsx` (Line 134-138)

```tsx
<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>限界上下文图</h3>
  <div className={styles.mermaidPreview}>
    <pre className={styles.mermaidCode}>{contextMermaidCode}</pre>  {/* ❌ 纯文本 */}
  </div>
</div>
```

**文件 2**: `/confirm/model/page.tsx` (Line 167-171)

```tsx
<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>领域模型类图</h3>
  <div className={styles.mermaidPreview}>
    <pre className={styles.mermaidCode}>{modelMermaidCode}</pre>  {/* ❌ 纯文本 */}
  </div>
</div>
```

**文件 3**: `/confirm/flow/page.tsx` (Line ~120)

```tsx
<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>业务流程图</h3>
  <div className={styles.mermaidPreview}>
    <pre className={styles.mermaidCode}>{flowMermaidCode}</pre>  {/* ❌ 纯文本 */}
  </div>
</div>
```

### 3.2 正确组件已存在

`MermaidPreview` 组件已完整实现（`/components/ui/MermaidPreview.tsx`），功能包括：

- ✅ 动态加载 Mermaid 库
- ✅ 深色主题配置
- ✅ XSS 防护（DOMPurify）
- ✅ 错误边界
- ✅ 加载状态
- ✅ 空状态处理

**但未被任何确认流程页面使用！**

---

## 四、解决方案

### 4.1 修复方案

将所有确认流程页面的 `<pre>` 标签替换为 `MermaidPreview` 组件。

**修复示例**：

```tsx
// 修复前
<div className={styles.mermaidPreview}>
  <pre className={styles.mermaidCode}>{modelMermaidCode}</pre>
</div>

// 修复后
import { MermaidPreview } from '@/components/ui/MermaidPreview';

<MermaidPreview 
  code={modelMermaidCode} 
  diagramType="classDiagram"
  height="400px"
/>
```

### 4.2 各页面图表类型

| 页面 | diagramType | 说明 |
|------|-------------|------|
| context | `flowchart` | 限界上下文关系图 |
| model | `classDiagram` | 领域模型类图 |
| flow | `stateDiagram` | 业务流程状态图 |

---

## 五、工作量评估

| 任务 | 工时 | 风险 |
|------|------|------|
| context/page.tsx 修改 | 10 分钟 | 低 |
| model/page.tsx 修改 | 10 分钟 | 低 |
| flow/page.tsx 修改 | 10 分钟 | 低 |
| 测试验证 | 20 分钟 | 低 |

**总计**: 50 分钟

---

## 六、验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| AC1 | Step 2 显示限界上下文可视化图表 | 手动测试 |
| AC2 | Step 3 显示领域模型类图 | 手动测试 |
| AC3 | Step 4 显示业务流程状态图 | 手动测试 |
| AC4 | 图表支持缩放/滚动 | 手动测试 |
| AC5 | 错误时显示友好提示 | 模拟无效代码 |

---

## 七、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Mermaid 语法错误 | 中 | 低 | 组件已有错误处理 |
| 性能问题 | 低 | 低 | 组件已有 debounce |
| 样式冲突 | 低 | 低 | 使用 CSS Module |

---

## 八、相关文件

**需要修改的文件**：
1. `vibex-fronted/src/app/confirm/context/page.tsx`
2. `vibex-fronted/src/app/confirm/model/page.tsx`
3. `vibex-fronted/src/app/confirm/flow/page.tsx`

**参考文件**：
- `vibex-fronted/src/components/ui/MermaidPreview.tsx` - 已有完整实现

---

## 九、修复代码参考

### context/page.tsx

```tsx
// 在文件顶部添加 import
import { MermaidPreview } from '@/components/ui/MermaidPreview';

// 替换 diagramSection 内容
<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>限界上下文图</h3>
  <MermaidPreview 
    code={contextMermaidCode} 
    diagramType="flowchart"
    layout="TB"
    height="300px"
  />
</div>
```

### model/page.tsx

```tsx
import { MermaidPreview } from '@/components/ui/MermaidPreview';

<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>领域模型类图</h3>
  <MermaidPreview 
    code={modelMermaidCode} 
    diagramType="classDiagram"
    height="400px"
  />
</div>
```

### flow/page.tsx

```tsx
import { MermaidPreview } from '@/components/ui/MermaidPreview';

<div className={styles.diagramSection}>
  <h3 className={styles.sectionTitle}>业务流程图</h3>
  <MermaidPreview 
    code={flowMermaidCode} 
    diagramType="stateDiagram"
    height="400px"
  />
</div>
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-mermaid-display-bug/analysis.md`
**分析师**: Analyst Agent
**日期**: 2026-03-16