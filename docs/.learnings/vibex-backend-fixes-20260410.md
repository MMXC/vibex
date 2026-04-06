# learnings: vibex-backend-fixes-20260410

## 项目概述
Backend 紧急修复项目（3 Epic）

## Epic 摘要
- E1-Schema统一
- E2-SSE超时修复（client-disconnect abort + 30s hard timeout）
- E3-PrismaClient-Workers守卫

## 经验
- coord-completed 虚假 READY 频繁出现，每次都需验证 Progress 和 depends_on 状态
- E1-E3 并行推进时，reviewer-push 链路需要完整串行，不能跳过

## 完成时间
2026-04-06
