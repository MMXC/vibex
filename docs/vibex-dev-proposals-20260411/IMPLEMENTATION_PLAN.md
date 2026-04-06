# Implementation Plan: vibex-dev-proposals

**项目**: vibex-dev-proposals-20260411

---

## Phase 1: 日志基础设施 (3h)

1. 创建 `src/lib/logger.ts`（基于 canvasLogger）
2. 替换 `connectionPool.ts` console.log → logger
3. devDebug 统一为 logger.debug
4. 路由 console.error 结构化

## Phase 2: 技术债务 (6h)

1. project-snapshot.ts 真实化（D1 查询）
2. TODO 清理（5 处）
3. 备份文件清理

## Phase 3: 健壮性 (4h)

1. ConnectionPool 熔断逻辑
2. ai-service JSON 降级 + 单元测试

## Phase 4: 收尾 (2h)

1. CI 日志规范检查
2. CHANGELOG 更新

---

**总工时**: 15h
