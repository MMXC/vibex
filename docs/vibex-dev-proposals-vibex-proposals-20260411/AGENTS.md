# AGENTS.md: VibeX Backend Dev Proposals 2026-04-11

> **项目**: vibex-dev-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev** | @dev | 日志改造 + TODO 清理 + 熔断实现 |
| **Reviewer** | @reviewer | PR 审查 |
| **Architect** | @architect | 架构设计 |

---

## 2. Dev Agent 职责

### 2.1 提交规范

```bash
git commit -m "refactor(logger): E1-S1 replace console.log with pino in connectionPool"
git commit -m "refactor(logger): E1-S2 unify devDebug to logger.debug"
git commit -m "refactor(logger): E1-S3 structure console.error with context"
git commit -m "fix(snapshot): E2-S1 replace mock with real D1 queries"
git commit -m "chore(todo): E2-S2 clear remaining TODOs in routes"
git commit -m "chore(cleanup): E2-S3 remove llm-provider backup files"
git commit -m "feat(circuit-breaker): E3-S1 add failure threshold to connectionPool"
git commit -m "feat(json): E3-S2 add markdown JSON extraction fallback"
```

### 2.2 禁止事项

| 禁止 | 正确方式 |
|------|---------|
| `console.log` | `logger.info()` |
| `console.error` | `logError({ operation, error })` |
| `devDebug` | `debug()` |
| `// TODO` 无日期 | `// TODO[YYYY-MM-DD]:` |
| 硬编码 mock | 真实 D1 查询 |

---

## 3. Reviewer Agent 职责

### 3.1 PR 审查清单

```bash
# L-01: 无 console.log
grep -rn "console\.log" vibex-backend/src/ --include="*.ts" | wc -l
# 应输出: 0

# L-02: 无 devDebug
grep -rn "devDebug" vibex-backend/src/ | wc -l
# 应输出: 0

# L-03: TODO 有日期
grep -rn "// TODO" vibex-backend/src/ | grep -v "TODO\[20"
# 应无结果

# L-04: 无 backup 文件
find vibex-backend/src -name "*.backup*" | wc -l
# 应输出: 0
```

### 3.2 驳回条件

1. PR 引入新的 `console.log`
2. PR 引入新的 `// TODO` 无日期
3. project-snapshot.ts 仍返回 mock 数据
4. JSON 解析无 markdown fallback

---

## 4. Definition of Done

### Sprint DoD

- [ ] E1: 无 `console.log`/`console.error`/`devDebug`
- [ ] E2: project-snapshot.ts 返回真实数据
- [ ] E2: 无未标记 TODO
- [ ] E3: connectionPool 有熔断逻辑
- [ ] E3: JSON 解析支持 markdown 包裹
- [ ] E4: CI 日志检查通过

### 全局 DoD

- [ ] `grep "console\." src/` → 0 结果
- [ ] `grep "devDebug" src/` → 0 结果
- [ ] `find src -name "*.backup*"` → 0 结果
- [ ] 回归测试全部通过

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
