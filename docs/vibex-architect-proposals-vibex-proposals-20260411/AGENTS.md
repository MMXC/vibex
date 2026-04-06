# AGENTS.md: VibeX 架构提案实施 2026-04-11

> **项目**: vibex-architect-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Dev 职责

### 提交规范

```bash
git commit -m "feat(api): E1-S1 add deprecation headers to v0 routes"
git commit -m "fix(ws): E2-S1 add max connections limit"
git commit -m "feat(ws): E2-S2 add heartbeat and dead connection cleanup"
git commit -m "feat(types): E3 create @vibex/types workspace package"
git commit -m "refactor(routes): E4 split Hono gateway from Next.js handlers"
git commit -m "feat(quality): E5 add CompressionEngine qualityScore"
git commit -m "feat(security): E6 add AST-based prompt security scanner"
git commit -m "feat(mcp): E7 add MCP /health endpoint"
```

### 禁止事项

| 禁止 | 正确 |
|------|------|
| v0 新增接口 | v1 替代 |
| 硬编码连接数 | 配置化 |
| 字符串匹配 eval | AST 解析 |
| 无日志的健康检查 | 结构化日志 |

---

## Reviewer 职责

```bash
# R-01: v0 有 Deprecation header
curl -I /api/v0/agents | grep -i deprecation

# R-02: WebSocket 连接限制
# 并发 101 连接，第 101 个应被拒绝

# R-03: @vibex/types 被使用
grep "@vibex/types" vibex-backend/src/ | wc -l

# R-04: qualityScore < 70 降级
```

---

## DoD

- [ ] E1: v0 路由有 Deprecation + Sunset header
- [ ] E2: WebSocket 连接数限制生效
- [ ] E3: @vibex/types 被 ≥5 个模块依赖
- [ ] E4: Auth 中间件只在 Hono 层
- [ ] E5: qualityScore < 70 触发降级
- [ ] E6: eval/new Function 被 AST 扫描检测
- [ ] E7: /health 返回健康状态

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
