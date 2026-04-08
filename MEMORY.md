# Vibex MEMORY — AI Agent 失败模式库

**最后更新**: 2026-03-24
**维护者**: Dev Agent

---

## 失败模式库 (Dev Agent Self-Correction Patterns)

> 记录常见开发失败模式及检测/解决方案，供 Dev Agent 自我诊断

### 模式 F-001: SyntaxWarning in Python Scripts
| 属性 | 值 |
|------|-----|
| 触发场景 | grep 正则中使用 `[` 未转义 |
| 症状 | `SyntaxWarning: invalid escape sequence '\['` |
| 检测命令 | `python -W error::SyntaxWarning task_manager.py` |
| 根因 | 字符串中 `\[` 需要 `r"..."` 或 `\\[` |
| 解决方案 | 将正则字符串改为 raw string 或双重转义 |
| 关联 | task_manager.py (修复: `grep -cF "## ["`) |

### 模式 F-002: TypeScript Prop 名称不匹配
| 属性 | 值 |
|------|-----|
| 触发场景 | 父组件传递 prop 名称与子组件声明不一致 |
| 症状 | `TypeScript error: Property '_domainModels' does not exist` |
| 检测命令 | `npm run build 2>&1 | grep -i "does not exist"` |
| 根因 | 重构时未同步更新所有引用方 |
| 解决方案 | 重构后立即运行 `npm run build`，检查 prop 名称一致性 |
| 关联 | homepage-cardtree-debug Epic4 (修复: `_domainModels` → `domainModels`) |

### 模式 F-003: Test Suite OOM
| 属性 | 值 |
|------|-----|
| 触发场景 | Jest worker 内存不足导致测试套件崩溃 |
| 症状 | `Jest worker exited unexpectedly` 或 timeout |
| 检测命令 | `npm test 2>&1 | grep -i "worker\|memory"` |
| 根因 | 测试文件过大或并行 worker 数量过多 |
| 解决方案 | 添加 `--maxWorkers=2` 或 `NODE_OPTIONS="--max-old-space-size=4096"` |
| 关联 | tester 报告: useJsonTreeVisualization.test.ts OOM |

### 模式 F-004: Import 路径错误
| 属性 | 值 |
|------|-----|
| 触发场景 | 重构后引用路径未同步更新 |
| 症状 | `Cannot find module '../../components/ErrorBoundary'` |
| 检测命令 | `npm run build 2>&1 | grep -i "cannot find module"` |
| 根因 | 目录重组后未更新所有 import 语句 |
| 解决方案 | 使用 IDE 的 "Find in Files" 搜索旧路径前缀，全量替换 |
| 关联 | ErrorBoundary 去重 (Epic3, 旧路径 components/error-boundary/) |

### 模式 F-005: JSON Schema 不一致导致 task_manager 解析失败
| 属性 | 值 |
|------|-----|
| 触发场景 | 项目使用简化格式 vs 标准格式混合 |
| 症状 | `list` 命令输出不完整，部分项目状态显示异常 |
| 检测命令 | `python task_manager.py list | jq '.[] | select(.status==null)'` |
| 根因 | 简化格式缺少 `project/goal/stages` 顶层字段 |
| 解决方案 | 统一迁移到标准格式，添加 schema 验证 |
| 关联 | vibex-dev-proposals-20260323 D-003 (JSON schema 统一提案) |

### 模式 F-006: 多用户节点同步冲突（LWW Last-Write-Wins）
| 属性 | 值 |
|------|-----|
| 触发场景 | 两个用户同时编辑同一节点 |
| 症状 | 后写入的节点覆盖先写入的节点，用户无感知 |
| 检测命令 | Playwright 双 tab 测试 |
| 根因 | 无冲突检测和 UI 反馈 |
| 解决方案 | ConflictBubble UI (E1-S3)；升级 Yjs CRDT (Epic 4 预案) |
| 关联 | vibex-next E1-S2/S3, A-010 |

### A-010: 性能可观测性设计
#### 指标定义
- LCP (Largest Contentful Paint): 页面主要内容加载时间
- CLS (Cumulative Layout Shift): 累积布局偏移
- P99 延迟: API 响应时间 P99

#### 告警阈值
| 指标 | 阈值 | 触发动作 |
|------|------|----------|
| LCP | > 4000ms | console WARNING + Slack webhook |
| CLS | > 0.1 | console WARNING |
| P99 延迟 | > 2000ms | Slack webhook |

#### 数据保留策略
- 监控数据: 7 天滚动清除
- analytics_events: expires_at = created_at + 7 days
- 清理触发: 每次写入时异步清理过期记录

#### 状态
- [x] Architect 签署: 2026-04-08
