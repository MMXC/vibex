# Implementation Plan: VibeX 提案汇总

**项目**: vibex-proposals-summary-20260411
**日期**: 2026-04-07
**最后更新**: 2026-04-07 04:15

---

## Sprint 0 实施计划（止血）

### E-P0-1: P0 Tech Debt 紧急修复 ✅
- [x] P0-1 Slack Token 迁移 (已完成，之前 session)
- [x] P0-9 PrismaClient Workers Guard (完成: commit e1136605)
- [x] P0-17 删除双重 Playwright 配置 (完成: commit e1136605)
- [ ] P0-2 ESLint `no-explicit-any` 9 文件 (待处理)
- [ ] P0-3 `@ci-blocking` 移除 (Tester 负责)

### Step 1: Slack Token 迁移 (0.5h)
```bash
# 搜索硬编码 token
grep -n "xoxp-\|xoxb-" scripts/task_manager.py

# 替换为环境变量
export SLACK_TOKEN=os.environ['SLACK_TOKEN']
```

### Step 2: ESLint any 清理 (1h)
```bash
# 9 个文件清理
npx eslint --rule 'typescript/no-explicit-any: error' --fix
```

### Step 3: @ci-blocking 移除 (1h)
```bash
grep -rn "@ci-blocking" --include="*.test.ts" | wc -l  # 当前 35+
# 逐个移除，CI 验证无破坏
```

### Step 4: Playwright timeout 修复 (0.5h)
```bash
# 10s → 30s
grep -rn "timeout.*10000" --include="*.config.ts"
sed -i 's/timeout: 10000/timeout: 30000/g'
```

---

## Sprint 1 实施计划（P0 功能）

### Week 1 并行任务分配

**Dev A**: WebSocket 治理 + API v0 废弃
**Dev B**: project-snapshot 真实化 + AI 智能补全

---

## Sprint 2 实施计划（P1 基础）

### packages/types 实施
```bash
mkdir -p packages/types
mv vibex-fronted/src/lib/types/* packages/types/
cd packages/types && npm init -y && tsc --init
```

### logger 统一
```bash
# 替换 console.*
grep -rn "console\." src/ --include="*.ts" --include="*.tsx"
# 批量替换为 logger 调用
```

---

## Sprint 3 实施计划（P1 Feature）

### 协作场景
- 团队协作 UI
- 版本历史 + 快照
- Tree 按钮样式统一

### 测试质量
- waitForTimeout 分批清理（每批 ≤ 10 处）
- WebSocket logger 回归测试

---

## Sprint 4-5 实施计划（P2）

### 安全 + 可观测
- AST 安全扫描集成
- MCP /health + structured logging

### 收尾
- ComponentRegistry 版本化
- eslint-disable 清理
- 全量回归测试

---

## 工时汇总

| Sprint | 容量 | 实际工时 | 缓冲 |
|--------|------|---------|------|
| Sprint 0 | 5.75h | 5.75h | 0.25h |
| Sprint 1 | 32h | 26h | 6h |
| Sprint 2 | 32h | 25h | 7h |
| Sprint 3 | 32h | 23.25h | 8.75h |
| Sprint 4 | 32h | 25h | 7h |
| Sprint 5 | 32h | 22h | 10h |

---

## 关键依赖追踪

| 先决条件 | 依赖方 |
|---------|--------|
| packages/types | E-P1-3 类型安全, E-P1-2 Auth 统一 |
| logger 统一 | E-P1-3 类型安全, E-P2-2 Compression |
| Auth 中间件 | E-P2-4 MCP 可观测 |
| E-P0-2 API v0 废弃 | E-P1-2 Auth 中间件 |
| E-P0-5 测试基础设施 | E-P1-4 测试质量 |
