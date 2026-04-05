# Implementation Plan: Proposal Deduplication

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: 去重脚本 | 1h | dedup.py |
| E2: coord 集成 | 1h | dedup_check.py |
| E3: 重复报告 | 0.5h | dedup-report.md |
| **合计** | **2.5h** | |

## 任务分解
| Task | 文件 | 验证 |
|------|------|------|
| E1: 去重脚本 | proposals/dedup.py | `python3 dedup.py ./proposals` |
| E2: coord 集成 | coord/dedup_check.py | coord 派生前调用 |
| E3: 报告 | docs/templates/dedup-report.md | 模板完整 |

## DoD
- [ ] 去重脚本可用
- [ ] coord 派生前调用 dedup
- [ ] 重复提案自动标记
