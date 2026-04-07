# Spec: E2 Epic 规模标准化

## 问题

`vibex-canvas-feature-gap-20260329` 包含 18 个功能点，超出常规 Epic 规模（3-5 个）。

## 规模标准

| 规模 | 功能点数 | 适用场景 |
|------|----------|----------|
| 小 Epic | 3-4 个 | 紧急修复、Bug fix |
| 标准 Epic | 4-5 个 | 常规 Feature 开发 |
| 大 Epic | 6+ 个 | **必须拆分** |

## 拆分规范

### 拆分原则
- 按功能模块拆分（如 UndoRedo、Navigation、Export）
- 按依赖关系拆分（前置功能优先）
- 按优先级拆分（P0-P1 独立）

### 命名规范
```
[project] Epic[N]-[name]
  - N: 序号（0-9）
  - name: 功能模块英文名
```

### 示例
```
vibex-canvas-feature-gap Epic0-DeployFix      (1 功能点)
vibex-canvas-feature-gap Epic1-UndoRedo        (4 功能点)
vibex-canvas-feature-gap Epic2-Navigation      (5 功能点)
vibex-canvas-feature-gap Epic3-Export          (4 功能点)
vibex-canvas-feature-gap Epic4-Collaboration   (4 功能点)
```

## Analyst HEARTBEAT.md 更新

```markdown
## Epic 规模自检

在创建新 Epic 前，检查功能点数量：

1. 统计当前 Epic 下的功能点总数
2. 若 > 5，自动拆分：
   - 按优先级排序（P0 > P1 > P2 > P3）
   - 前 5 个功能点 → 当前 Epic
   - 剩余功能点 → 新的 sub-Epic
3. 使用 task_manager.py 创建 sub-Epic
```

## 验证命令

```bash
# 验证 Epic 功能点数量
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py status [project]
# 检查输出中的功能点数量
```

## 验收标准

```typescript
// 自动化检查脚本
const epicFeatureCount = getEpicFeatureCount(epicId);
expect(epicFeatureCount >= 3).toBe(true);
expect(epicFeatureCount <= 5).toBe(true);
```

## 输出

- 更新后的 Analyst `HEARTBEAT.md`
- 更新的 Analyst `SOUL.md`（记录此规范）
