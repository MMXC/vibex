# 开发检查清单: vibex-homepage-activation/impl-terminology

**项目**: vibex-homepage-activation
**任务**: impl-terminology
**日期**: 2026-03-13
**开发者**: Dev Agent

---

## PRD 功能点对照

### B6: 术语简化

| 验收标准 | 实现情况 | 验证方法 |
|----------|----------|----------|
| B6.1 JSON 配置化术语 | ✅ 已实现 | terminology.ts 配置 |
| B6.2 Tooltip 组件 | ✅ 已实现 | Tooltip.tsx + CSS |

---

## 实现位置

**文件**:
- `vibex-fronted/src/data/terminology.ts` - 术语映射配置
- `vibex-fronted/src/components/ui/Tooltip.tsx` - Tooltip 组件
- `vibex-fronted/src/components/ui/Tooltip.module.css` - 样式

**术语映射**:
| 原术语 | 简化 |
|--------|------|
| 限界上下文 | 业务模块 |
| 领域模型 | 数据实体 |
| 聚合根 | 主实体 |
| 值对象 | 数据类型 |
| 上下文映射 | 协作关系 |
| 核心域 | 核心业务 |
| 支撑域 | 支撑功能 |
| 通用域 | 通用能力 |

---

## 构建验证

| 验证项 | 结果 |
|--------|------|
| Frontend build | ✅ PASSED |

---

## 下一步

- 测试验收
