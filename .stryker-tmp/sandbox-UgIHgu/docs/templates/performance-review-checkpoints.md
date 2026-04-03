# 性能审查检查点

**版本**: 1.0
**创建日期**: 2026-03-18
**维护人**: Reviewer Agent

---

## 1. 概述

性能审查检查点清单，用于代码审查阶段识别潜在性能问题。

---

## 2. 检查清单

### 2.1 数据库查询

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| N+1 查询 | 循环内查询数据库 | 🔴 高 |
| 缺失索引 | 查询无索引支持 | 🔴 高 |
| 大数据返回 | SELECT * 过多 | 🟡 中 |
| 关联查询 | 未使用 JOIN | 🟡 中 |

**检测命令**:
```bash
# N+1 检测
grep -rn "forEach.*await\|\.map.*await" --include="*.ts"

# 大数据查询
grep -rn "findAll\|find\(\)" --include="*.ts" | grep -v "limit"
```

### 2.2 渲染性能

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| 重复渲染 | useEffect 过度触发 | 🔴 高 |
| 大列表渲染 | 无虚拟滚动 | 🔴 高 |
| 组件懒加载 | 未使用 React.lazy | 🟡 中 |
| 状态过度订阅 | 未使用 selector | 🟡 中 |

**检测命令**:
```bash
# 状态过度更新
grep -rn "setState\|useState" --include="*.tsx" | wc -l

# 大列表检测
grep -rn "\.map.*\.\.\." --include="*.tsx"
```

### 2.3 网络请求

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| 请求去重 | 相同请求未缓存 | 🟡 中 |
| 请求并行 | 串行请求未合并 | 🟡 中 |
| 大请求体 | 请求数据过大 | 🟡 中 |
| 无超时 | 请求无超时设置 | 🟡 中 |

**检测命令**:
```bash
# fetch/axios 检测
grep -rn "fetch\|axios" --include="*.ts" --include="*.tsx"

# 超时检测
grep -rn "timeout" --include="*.ts" --include="*.tsx"
```

### 2.4 内存管理

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| 事件监听未清理 | useEffect 无 cleanup | 🔴 高 |
| 定时器未清理 | clearTimeout 缺失 | 🔴 高 |
| 大对象引用 | 闭包持有大对象 | 🟡 中 |
| 缓存无上限 | 缓存无限增长 | 🟡 中 |

**检测命令**:
```bash
# useEffect cleanup
grep -rn "useEffect" --include="*.tsx" -A 5 | grep -c "return"

# 定时器检测
grep -rn "setTimeout\|setInterval" --include="*.ts" --include="*.tsx"
```

### 2.5 打包优化

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| 依赖体积 | 依赖包过大 | 🟡 中 |
| 代码分割 | 未使用动态 import | 🟡 中 |
| 图片优化 | 未使用 WebP/懒加载 | 🟡 中 |
| Tree Shaking | 未配置 sideEffects | 🟡 中 |

**检测命令**:
```bash
# 依赖大小
npm ls --depth=0

# 动态 import
grep -rn "import\(" --include="*.ts" --include="*.tsx"
```

---

## 3. 性能评分

| 等级 | 分数 | 定义 |
|------|------|------|
| A | 90-100 | 优秀，无需优化 |
| B | 75-89 | 良好，建议优化 |
| C | 60-74 | 一般，需要优化 |
| D | <60 | 差，必须优化 |

---

## 4. 审查报告格式

```markdown
## 性能审查

### N+1 查询
- [ ] 无 N+1 查询
- 位置: `{{FILE}}:{{LINE}}`

### 渲染性能
- [ ] 列表使用虚拟滚动
- [ ] 组件正确懒加载

### 内存管理
- [ ] useEffect 有 cleanup
- [ ] 定时器正确清理

### 评分
**总分**: {{SCORE}}/100 ({{GRADE}})
```

---

## 5. 自动化检测

```typescript
// scripts/performance-scan.ts

interface PerformanceIssue {
  type: 'n+1' | 'render' | 'memory' | 'network' | 'bundle';
  file: string;
  line: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

async function scanPerformance(): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];
  
  // N+1 检测
  issues.push(...await detectNPlusOne());
  
  // 渲染检测
  issues.push(...await detectRenderIssues());
  
  // 内存检测
  issues.push(...await detectMemoryLeaks());
  
  return issues;
}
```

---

## 6. 阈值参考

| 指标 | 阈值 | 说明 |
|------|------|------|
| API 响应时间 | < 200ms | P95 |
| 首屏加载 | < 1.5s | FCP |
| 列表渲染 | < 16ms | 每帧 |
| Bundle 大小 | < 500KB | 首屏 |

---

**版本**: 1.0
**最后更新**: 2026-03-18
