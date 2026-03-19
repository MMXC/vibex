# Agents: vibex-ts-strict

## 项目信息

- **项目**: vibex-ts-strict
- **目标**: 启用 TypeScript strict 模式，消除类型安全债务
- **工作目录**: `/root/.openclaw/vibex/vibex-fronted`
- **预计工期**: 22.5 小时

---

## 角色定义

### Dev
- 领取 Epic 任务，实施类型修复
- 更新 tsconfig.json 配置
- 替换 `as any` 为具体类型
- 配置 ESLint 类型规则
- 配置 CI 类型检查 pipeline

### PM
- 跟踪 Epic 进度，维护验收标准
- 协调阻塞问题
- 审核 DoD 完成情况

### Tester
- 运行类型检查验证
- 执行 `npx tsd` 类型测试
- 验证 `as any` 数量 < 10
- 确保测试覆盖率不下降

### Reviewer
- 代码 review（类型安全、一致性）
- 更新 CHANGELOG.md
- 合并前确认 CI 全绿

---

## 构建 & 测试命令

### 本地开发

```bash
# 进入工作目录
cd /root/.openclaw/vibex/vibex-fronted

# 类型检查 (核心验证)
npm run type-check

# 完整构建
npm run build

# ESLint 检查
npm run lint

# 类型测试 (tsd)
npx tsd

# 运行测试
npm test

# 完整验证 (CI 等效)
npm run type-check && npm run lint -- --max-warnings=0 && npx tsd && npm test
```

### CI 命令

```bash
npm ci
npm run type-check
npm run lint -- --max-warnings=0
npx tsd
npm test
```

---

## 任务状态

| Epic | 负责人 | 状态 | 备注 |
|------|--------|------|------|
| Epic 1: 配置启用 (P0) | Dev | pending | T1.1–T1.6 |
| Epic 2: 类型断言清理 (P1) | Dev | pending | T2.1–T2.6 |
| Epic 3: ESLint 类型规则 (P2) | Dev | pending | T3.1–T3.5 |
| Epic 4: 类型测试覆盖 (P2) | Tester | pending | T4.1–T4.4 |

---

## 协作规范

1. **提交前**: 运行 `npm run type-check && npm run lint` 确认无 error/warning
2. **PR 描述**: 包含修改的 Task ID 和验证命令输出
3. **阻塞上报**: 遇到第三方库类型问题立即反馈 @PM/@Reviewer
4. **进度更新**: 每个 Epic 完成后在 #vibex-dev 频道更新

---

## 消息模板

### 领取任务
```
📌 领取任务: vibex-ts-strict/<epic-name>
👤 Agent: dev
🎯 目标: <description>
```

### 进度更新
```
🔄 进度更新: vibex-ts-strict/<epic-name>
📊 状态: <step>/<total>
📝 说明: <detail>
```

### 任务完成
```
✅ 任务完成: vibex-ts-strict/<epic-name>
🔍 验证: <verification result>
```

### 问题阻塞
```
⚠️ 任务阻塞: vibex-ts-strict/<epic-name>
🔒 原因: <reason>
❓ 需要帮助: <question>
```
