# PRD: Test Commands Unification

> **项目**: vibex-tester-test-commands  
> **目标**: 统一测试命令入口，解决碎片化问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
测试命令分散在 30+ npm scripts 和多个 shell 脚本中，Tester/Developer 无法快速找到对应命令。主要痛点：入口不清晰、命名不一致、缺乏统一文档。

### 目标
- P0: 创建 Makefile 统一入口
- P1: 完善 TEST_COMMANDS.md 文档
- P2: 更新 CI 使用 Makefile

### 成功指标
- AC1: `make help` 列出所有命令
- AC2: 所有测试场景可通过 make 访问
- AC3: CI 使用 make 命令

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | Makefile 统一入口 | P0 | 2h |
| E2 | TEST_COMMANDS.md | P1 | 1h |
| E3 | CI 集成 | P2 | 1h |
| E4 | npm scripts 清理 | P2 | 1h |
| **合计** | | | **5h** |

---

### E1: Makefile 统一入口

**根因**: 30+ npm scripts + 多个 shell 脚本，入口碎片化。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | Makefile 创建 | 2h | `make help` 列出所有命令 ✓ |

**验收标准**:
- `expect(exec('make help').toContain('test'))` ✓
- `expect(targets).toContain('test:e2e')` ✓
- `expect(targets).toContain('test:flaky')` ✓
- `expect(targets).toContain('test:stability')` ✓

**DoD**:
- [ ] Makefile 存在于 `vibex-fronted/Makefile`
- [ ] `make help` 输出完整
- [ ] 所有测试目标可用

---

### E2: TEST_COMMANDS.md

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 文档编写 | 1h | 文档完整 ✓ |

**验收标准**:
- `expect(doc).toContain('test:e2e')` ✓
- `expect(doc).toContain('前置条件')` ✓
- `expect(doc).toContain('输出位置')` ✓

**DoD**:
- [ ] TEST_COMMANDS.md 创建
- [ ] 包含所有命令说明

---

### E3: CI 集成

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | CI 配置更新 | 1h | CI 使用 make ✓ |

**验收标准**:
- `expect(ci).toContain('make test:ci')` ✓

**DoD**:
- [ ] CI 配置更新为 make 命令

---

### E4: npm scripts 清理

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 命名统一 | 1h | 命名一致 ✓ |

**验收标准**:
- `expect(scripts).toMatch(/^test:/)` ✓

**DoD**:
- [ ] 命名统一为 test:* 格式

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Makefile 创建 | E1 | expect(fileExists('Makefile')).toBe(true) | 无 |
| F1.2 | test 目标 | E1 | expect(exec('make test')).toPass() | 无 |
| F1.3 | test:e2e 目标 | E1 | expect(targets).toContain('test:e2e') | 无 |
| F1.4 | test:flaky 目标 | E1 | expect(targets).toContain('test:flaky') | 无 |
| F2.1 | TEST_COMMANDS.md | E2 | expect(doc).toBeDefined() | 无 |
| F3.1 | CI 集成 | E3 | expect(ci).toContain('make test:ci') | 无 |
| F4.1 | npm 清理 | E4 | expect(names).toMatch(/^test:/) | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 执行 | `make help` | 列出所有测试命令 |
| AC2 | 执行 | `make test` | 运行单元测试 |
| AC3 | 执行 | `make test:e2e` | 运行 E2E 测试 |
| AC4 | 执行 | `make test:flaky` | 调用 flaky-detector.sh |
| AC5 | 执行 | `make test:stability` | 调用 stability-report.sh |
| AC6 | CI | push | 使用 `make test:ci` |

---

## 5. DoD

- [ ] Makefile 存在，所有测试目标可用
- [ ] `make help` 完整输出
- [ ] TEST_COMMANDS.md 文档完整
- [ ] CI 配置更新

---

## 6. 实施计划

### Sprint 1 (P0, 2h)
- E1: Makefile 创建（test/test:watch/test:coverage/test:e2e/test:flaky/test:stability）

### Sprint 2 (P1, 1h)
- E2: TEST_COMMANDS.md 文档

### Sprint 3 (P2, 2h)
- E3: CI 集成
- E4: npm scripts 清理

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
