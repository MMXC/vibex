# VibeX 提案状态管理 SOP

> **生效日期**: 2026-04-10
> **维护者**: analyst
> **适用范围**: 所有 VibeX 提案

---

## 1. 状态定义

| 状态 | 含义 | 触发条件 |
|------|------|----------|
| `proposed` | 已提交，待评审 | 提案创建后自动设置 |
| `in-progress` | 已采纳，实施中 | PM/Architect 批准后，dev 领取任务时 |
| `done` | 已完成 | 所有开发任务完成，测试通过 |
| `rejected` | 已驳回 | 技术不可行或优先级不足 |
| `stale` | 已废弃 | 超过 2 个 sprint 未推进 |
| `blocked` | 阻塞 | 等待上游依赖或资源 |

---

## 2. 状态转换规则

```
proposed ──[PM/Architect 批准]──→ in-progress ──[任务完成]──→ done
   │                                  │
   └──[评审驳回]──→ rejected         └──[阻塞]──→ blocked
                                              │
                           ──[依赖解除]──→ in-progress
```

### 转换条件

| 当前状态 | 目标状态 | 触发者 | 条件 |
|----------|----------|--------|------|
| proposed | in-progress | PM/Architect | 技术可行 + 优先级确定 |
| proposed | rejected | PM/Architect | 不可行或 P2 以下 |
| in-progress | done | dev | 代码提交 + 测试通过 |
| in-progress | blocked | dev | 上游依赖不可用 |
| blocked | in-progress | dev | 依赖解除 |
| done | (terminal) | — | — |
| rejected | (terminal) | — | — |

---

## 3. 状态更新时机

### analyst
- 创建提案时设置初始状态为 `proposed`
- 更新 `proposed` → `in-progress` 的时间戳

### PM / Architect  
- 评审通过后更新为 `in-progress`
- 评审驳回后更新为 `rejected`

### dev
- 领取任务时更新为 `in-progress`
- 完成开发后更新为 `done`
- 遇到阻塞时更新为 `blocked`

### tester
- 测试发现 regression → 触发 dev 修复循环
- 测试全部通过 → 可选建议更新状态

---

## 4. 维护规则

### 索引文件
- `docs/proposals/INDEX.md` — 汇总表，自动生成
- `docs/proposals/TRACKING.md` — 活跃提案追踪
- 每个提案目录的 `proposal.md` — 独立状态

### 更新原则
1. **单点更新**: 状态变更只更新一个文件（INDEX 或 TRACKING），其他由脚本同步
2. **时间戳**: 每次状态变更记录更新时间
3. **不可逆**: `done` 和 `rejected` 为终态，不再变更

### 自动同步
- 状态变更后运行 `scripts/update-index.py` 同步 INDEX.md

---

## 5. 异常处理

| 场景 | 处理方式 |
|------|----------|
| 提案无状态字段 | 默认为 `proposed` |
| INDEX 与 TRACKING 状态冲突 | 以 TRACKING.md 为准 |
| 长期 blocked (> 2 sprints) | 推进或标记为 `stale` |

---

## 6. 相关文件

- `docs/proposals/INDEX.md` — 提案汇总索引
- `docs/proposals/TRACKING.md` — 活跃提案追踪
- `docs/proposals/TEMPLATE.md` — 提案模板
- `scripts/update-index.py` — 索引同步脚本
