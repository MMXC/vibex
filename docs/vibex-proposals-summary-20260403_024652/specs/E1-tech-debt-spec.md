# E1 Spec: 技术债清理

## S1.1 TS 编译错误修复

### 根因
`StepClarification.tsx` 中 `StepComponentProps` 重复定义。

### 修复步骤
1. 检查 `src/components/flow-branch-editor/StepClarification.tsx`
2. 移除重复的类型定义
3. 验证 `npx tsc --noEmit` 零错误

### 验证命令
```bash
cd vibex-fronted && npx tsc --noEmit
echo $?  # 应为 0
```

## S1.2 E4 Sync Protocol

### 后端 API 变更
```
POST /api/canvas/snapshots
Body: { projectId, data, version }
Response: 200 | 409 Conflict { serverVersion, localVersion, conflictData }
```

### ConflictDialog 组件
- 位置：CanvasPage 右下角
- 三个选项：保留本地 / 使用服务端 / 合并
- 合并逻辑：前端 diff → 用户选择 → 重新提交

### 场景测试用例
1. 正常保存（version 匹配）→ 200
2. 版本冲突（version 过期）→ 409 + Dialog
3. 保留本地 → 强制覆盖
4. 使用服务端 → 回滚本地
5. 合并 → 差异展示 + 选择保存

## S1.3 canvasStore Facade 清理

### 迁移策略
1. 分析 canvasStore.ts 剩余 1513 行
2. 识别每行属于哪个子 store
3. 迁移到 `stores/contextStore.ts` / `flowStore.ts` / `componentStore.ts`
4. canvasStore.ts 降级为 re-export 层（< 50 行）

### 验证
```bash
wc -l src/lib/canvas/canvasStore.ts
# 应 < 300 行

# 检查无直接状态定义
grep "useState\|useReducer\|create()" src/lib/canvas/canvasStore.ts
# 应无输出
```

## S1.4 ESLint disable 豁免记录

### ESLINT_DISABLES.md 格式
```markdown
# ESLint Disable Records

| 文件 | 行号 | 规则 | 理由 | 复查日期 |
|------|------|------|------|----------|
| components/Canvas.tsx | 42 | @typescript-eslint/no-explicit-any | React Flow 类型定义缺失 | 2026-05-01 |
```
