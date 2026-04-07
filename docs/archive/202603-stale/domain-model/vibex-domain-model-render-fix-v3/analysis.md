# 分析报告: 领域模型生成后图表不渲染

**项目**: vibex-domain-model-render-fix-v3
**分析师**: Analyst
**日期**: 2026-03-16
**状态**: 已完成 (修复被回退，待重新修复)

---

## 一、执行摘要

**问题**: 用户点击"生成领域模型"后，API 返回成功但界面无变化，图表不渲染。

**根因**: 后端 `/ddd/domain-model/stream` SSE done 事件未返回 `mermaidCode`，前端无法渲染图表。

**修复尝试**: commit 005279b 添加了 `mermaidCode` 返回，但引入了新问题（需求输入后无进度条），已被回退 (commit 25e0c66)。

**当前状态**: 问题仍存在，需要更安全的修复方案。

---

## 二、问题现象

### 2.1 用户操作路径

```
1. 用户输入需求 → 点击"开始生成"
2. 限界上下文生成完成 → 界面显示上下文图
3. 用户点击"生成领域模型"
4. API 返回成功 (domainModels 有数据)
5. ❌ 界面无变化，图表不渲染
```

### 2.2 预期行为

```
5. ✅ 界面显示领域模型图 (Mermaid)
```

---

## 三、根因分析

### 3.1 数据流追踪

```
后端 /ddd/domain-model/stream
    ↓ SSE done 事件
    {
      domainModels: [...],
      message: "领域模型生成完成"
      // ❌ 缺少 mermaidCode
    }
    ↓
前端 useDomainModelStream hook
    ↓ 
    case 'done':
      setDomainModels(models)
      setStatus('done')
      // ❌ 没有 mermaidCode 可设置
    ↓
HomePage.tsx
    ↓
    modelMermaidCode = '' // 永远为空
    ↓
PreviewArea
    ↓
    ❌ 无内容渲染
```

### 3.2 代码定位

| 文件 | 行号 | 问题 |
|------|------|------|
| `vibex-backend/src/routes/ddd.ts` | 567-572 | done 事件未返回 mermaidCode |
| `vibex-fronted/src/hooks/useDDDStream.ts` | 520-530 | hook 未处理 mermaidCode |
| `vibex-fronted/src/components/homepage/HomePage.tsx` | 403 | modelMermaidCode 永远为空 |

### 3.3 对比其他端点

| 端点 | done 事件内容 | 状态 |
|------|---------------|------|
| `/ddd/bounded-context/stream` | `{ boundedContexts, mermaidCode }` | ✅ 正常 |
| `/ddd/domain-model/stream` | `{ domainModels, message }` | ❌ 缺少 mermaidCode |
| `/ddd/business-flow/stream` | `{ businessFlow, mermaidCode }` | ✅ 正常 |

---

## 四、修复历史

### 4.1 第一次修复 (commit 005279b)

**修改内容**:
1. 后端: done 事件添加 `mermaidCode: generateDomainModelMermaidCode(...)`
2. 前端: hook 添加 `mermaidCode` 状态和提取逻辑
3. 前端: HomePage.tsx 使用 hook 返回的 `mermaidCode`

**结果**: 领域模型渲染修复成功

### 4.2 回退 (commit 25e0c66)

**原因**: 修复引入了新问题
- 需求输入后点击"开始生成"没有 AI 分析进度条
- 限界上下文生成流程受影响

**分析**:
- `useDDDStream` hook 同时用于限界上下文和领域模型生成
- mermaidCode 状态的添加可能干扰了限界上下文的数据流
- 需要更细致的状态隔离

---

## 五、推荐修复方案

### 5.1 方案 A: 独立 Hook 状态 (推荐)

**思路**: `useDomainModelStream` 已有独立的 `mermaidCode` 状态，问题在于后端未返回。

**修改**:
1. 仅修改后端 `/ddd/domain-model/stream` 端点
2. 在 done 事件中添加 `mermaidCode` 生成
3. 前端 hook 已有提取逻辑 (line 544)

**风险**: 低 - 仅影响领域模型生成流程

### 5.2 方案 B: 状态隔离

**思路**: 确保限界上下文和领域模型的 mermaidCode 状态独立

**修改**:
1. 前端: 确保 `streamMermaidCode` 和 `modelMermaidCode` 完全独立
2. 检查 HomePage.tsx 中的状态使用是否有交叉

**风险**: 中 - 需要仔细检查状态隔离

### 5.3 方案 C: 重新设计 Hook

**思路**: 将 `useDDDStream` 拆分为更细粒度的 hooks

**修改**:
1. 创建 `useBoundedContextStream` hook
2. 创建 `useDomainModelStream` hook (已有)
3. 创建 `useBusinessFlowStream` hook (已有)

**风险**: 高 - 大规模重构

---

## 六、验收标准

修复后应满足:

1. ✅ 领域模型生成后图表正确渲染
2. ✅ 限界上下文生成进度条正常显示
3. ✅ 业务流程生成不受影响
4. ✅ 单元测试通过
5. ✅ E2E 测试通过

---

## 七、下一步行动

1. **Dev**: 实施方案 A，仅修改后端返回 mermaidCode
2. **Tester**: 验证三个 SSE 流程都正常
3. **Reviewer**: 确认修改范围最小化

---

## 八、相关资源

- 修复提交: commit 005279b
- 回退提交: commit 25e0c66
- 后端文件: `vibex-backend/src/routes/ddd.ts`
- 前端 Hook: `vibex-fronted/src/hooks/useDDDStream.ts`
- 前端组件: `vibex-fronted/src/components/homepage/HomePage.tsx`