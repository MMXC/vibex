# AI Agent 失败模式库

**项目**: vibex-proposals-summary-20260324_0958  
**Epic**: Epic4 — AI Agent 治理  
**创建**: 2026-03-24  
**用途**: 记录 AI Agent 特有的失败模式，供自检和调试参考

---

## F-001: SyntaxWarning — task_manager.py 死代码

**分类**: 工具链 / 死代码  
**严重性**: P1  
**首次发现**: 2026-03-23

### 症状
```python
SyntaxWarning:Invalid escape sequence '\['
```
grep 正则表达式包含未转义的 `[` 字符。

### 根因
`scripts/task_manager.py` 第 616 行：
```python
grep -c "## \["  # 错误：\[ 在普通字符串中需双反斜杠
```

### 修复
```python
grep -c "## \\\["  # 或使用 -F 纯文本模式
grep -cF "## ["   # 推荐：-F 不解释正则
```

### 检测
```bash
python3 -W error scripts/task_manager.py list
grep -n "\\\\\[" scripts/task_manager.py
```

---

## F-002: TypeScript Prop 不匹配

**分类**: 前端 / 类型安全  
**严重性**: P1  
**首次发现**: 2026-03-24 (homepage-cardtree-debug Epic4)

### 症状
```
TypeScript error: Property '_domainModels' does not exist on type 'Props'
```

### 根因
组件接口定义与实际传入的 prop 名称不一致（重构后 prop 改名但调用方未同步）。

### 常见场景
1. **重构后漏改**: `boundedContextsToCardTree` 改名 → 调用方仍是旧名称
2. **命名不一致**: 组件接受 `_domainModels` 但父组件传 `domainModels`
3. **可选链遗漏**: `businessFlow?.states` vs `businessFlow.states`

### 修复
1. 确认组件接口定义（`.tsx` 文件中的 `interface Props` 或 `type Props`）
2. 确认父组件传入的 prop 名称与接口一致
3. 运行 `npx tsc --noEmit` 验证

### 预防
- 重构 prop 名称时使用 IDE 全局重命名
- 添加 TypeScript strict mode
- 组件接口放在单独文件并导出

---

## F-003: Jest OOM — 内存溢出

**分类**: 测试 / 资源限制  
**严重性**: P1  
**首次发现**: 2026-03-24

### 症状
```
Jest did not exit one second after the test run has been completed
--- or ---
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

### 根因
1. **未关闭的 timer/mock**: `jest.useFakeTimers()` 后未还原
2. **全局状态泄漏**: Store/Persist middleware 测试后未清理
3. **大量 snapshot 数据**: 测试文件过大
4. **maxWorkers 过低**: 并行度不够

### 修复
```bash
# 增加 Node 内存
NODE_OPTIONS="--max-old-space-size=4096" npx jest

# 或在 jest.config.js 中配置
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
```

### 检测
```bash
# 监控 Jest 内存
npx jest --detectOpenHandles --forceExit
```

---

## F-004: Import 路径错误

**分类**: 前端 / 模块解析  
**严重性**: P2  
**首次发现**: 2026-03-24

### 症状
```
Module not found: Error: Can't resolve '@/components/ErrorBoundary'
```

### 根因
1. **相对路径 vs 别名**: 使用 `@/components/...` 但 tsconfig paths 未配置
2. **目录大小写**: macOS 不区分大小写，Linux 严格区分
3. **barrel file 缺失**: `index.ts` 被删除或移动

### 常见场景
```tsx
// 错误：从组件内部用相对路径引用自己
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// 正确：通过 barrel file
import { ErrorBoundary } from '@/components/ui'
```

### 修复
1. 检查 `tsconfig.json` 的 `paths` 配置
2. 确保所有 `@/` 别名有对应的 barrel export
3. 使用 `import { xxx } from '../ui'` 相对路径更安全

### 预防
- ESLint rule: `import/no-unresolved`
- CI 检查: `tsc --noEmit`

---

## F-005: JSON Schema 不一致

**分类**: 工具链 / 数据模型  
**严重性**: P2  
**首次发现**: 2026-03-24

### 症状
```python
# task_manager.py
json.load(f)  # 成功

# heartbeat 脚本
jq -r '.stages | to_entries[]'  # 失败：stages 不存在
```

### 根因
team-tasks 的 JSON schema 有两个版本：
- **版本 A** (workspace-coord): `{ goal, status, stages: { stageName: { agent, status, ... } } }`
- **版本 B** (flat): `{ goal, status, agent, status, ... }` (无 stages)

### 常见场景
1. **字段缺失**: `stages` 字段在某些 JSON 文件中不存在
2. **字段类型不一致**: `status` 有时是字符串，有时是对象
3. **日期格式不一致**: `createdAt` 有 ISO 格式和 Unix timestamp 混用

### 修复
```bash
# 检测 schema 版本
if jq -e '.stages' tasks.json > /dev/null 2>&1; then
    echo "Version A: has stages"
else
    echo "Version B: flat structure"
fi
```

### 预防
- 定义 JSON Schema (schema.json) 并在 CI 中验证
- 使用 `jq` 时添加 `-e` 错误处理
- 迁移到统一 schema

---

## 通用调试检查清单

当遇到未知错误时，按顺序检查：

1. [ ] `npm test` 是否通过？（确认测试基线正常）
2. [ ] `npx tsc --noEmit` 是否有 TS 错误？
3. [ ] `grep -r "TODO\|FIXME\|HACK" src/` 有无遗漏修复？
4. [ ] `git status` 是否有未提交的依赖变更（package.json, lock file）？
5. [ ] `node --version` 和 `npm --version` 是否与 CI 一致？
6. [ ] 查看最近 5 个 commit 的 diff，确认无 regression

---

## 失败模式统计

| ID | 名称 | 严重性 | 状态 | 最后发现 |
|----|------|--------|------|---------|
| F-001 | SyntaxWarning | P1 | ✅ 已修复 | 2026-03-23 |
| F-002 | TS Prop 不匹配 | P1 | ✅ 已修复 | 2026-03-24 |
| F-003 | Jest OOM | P1 | ⚠️ 监控中 | 2026-03-24 |
| F-004 | Import 路径错误 | P2 | ⚠️ 监控中 | 2026-03-24 |
| F-005 | JSON Schema 不一致 | P2 | ✅ 已修复 | 2026-03-24 |

---

_Last updated: 2026-03-24 13:07_
