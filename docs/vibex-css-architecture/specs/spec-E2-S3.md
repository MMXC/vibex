# Spec: E2-S3 — 扩展 CI 扫描脚本检测类名不匹配

## 文件

- **修改**: `vibex-fronted/scripts/scan-css-conflicts.ts`（现有脚本扩展）

## 目的

构建时扫描所有 `.tsx` 文件的 `styles[...]` 动态访问，对比对应 CSS 模块的类名定义，提前发现命名不一致，而非等到运行时才发现。

## 扩展功能

### 1. 扫描 `styles[...]` 动态访问

支持的正则模式：
```typescript
styles['xxx']       // 单引号
styles["xxx"]       // 双引号
styles[`xxx`]       // 模板字符串
styles[variable]    // 变量（跳过，但记录）
```

### 2. 解析 @forward 聚合链

脚本需能追踪：
```
canvas.module.css (@forward) → canvas.export.module.css → .queueItemQueued {}
```

### 3. 报告格式

```
ERROR: CSS class 'queueItem_queued' referenced in:
  - src/components/canvas/PrototypeQueuePanel.tsx:56
  but not defined in canvas.export.module.css (found: queueItemQueued, ...)
```

### 4. 退出码

| 情况 | 退出码 |
|------|--------|
| 有未定义的 `styles[...]` 引用 | 1 |
| 无问题 | 0 |

## 集成 CI

在 `package.json` 的 `prebuild` 或 `lint-staged` 中调用：
```bash
node scripts/scan-css-conflicts.ts
```

## DoD 检查单

- [ ] 脚本能检测 `styles['queueItem_queued']`（修复前应失败，修复后应通过）
- [ ] 脚本输出包含文件路径和行号
- [ ] 有未定义类名时 exit code = 1
- [ ] 脚本集成到 CI 构建流程中
