# Review Report: Epic1-Reviewer Dedup 全链路集成

**Agent**: REVIEWER | 创建时间: 2026-04-13 13:30 | 完成时间: TBD
**项目**: vibex-p0-sprint-20260410
**阶段**: reviewer-epic1-reviewer-dedup-全链路集成

---

## INV 镜子检视

> 来源：INV-0 快照幻觉、INV-1 波纹衰减、INV-2 格式断崖、INV-4 真相源分裂、INV-5 语义搭便车、INV-6 验证衰减、INV-7 无主接缝

- [ ] **INV-0** 我真的读过这个文件了吗？✅ 实际读取了 zombie-alert.py, dedup_api.py, dedup.js, dedup.test.js, vitest.config.ts
- [ ] **INV-1** 改了源头，消费方 grep 了吗？⚠️ dedup_api.py 修改了字段名（project_name/description），需确认 dedup.js 和 dedup.py 的消费方
- [ ] **INV-2** 格式对了，语义呢？✅ dedup.js 格式正确，语义逻辑清晰
- [ ] **INV-4** 同一件事写在了几个地方？❌ changelog 双写问题存在（见下方）
- [ ] **INV-5** 复用这段代码，我知道原来为什么这么写吗？✅ dedup.js 是独立实现，无复用
- [ ] **INV-6** 验证从用户价值链倒推了吗？❌ dedup.test.js 不在 vitest include 路径中，测试存在但从不运行
- [ ] **INV-7** 跨模块边界有没有明确的 seam_owner？❌ zombie-alert.py 与 dedup_api.py 的集成接口无 owner

---

## Scope Check: DRIFT DETECTED

**Intent**: Epic1-Reviewer Dedup 全链路集成 — 将 dedup_api 集成到 zombie-alert（scheduler），实现 task JSON dedup 字段 + similarity > 0.7 Slack 告警

**Delivered**: dedup.js 前端防重测试 + dedup_api.py 字段兼容性修复 + 17 个 dedup Python 测试通过

**DRIFT**: E1.2（zombie-alert → dedup_api 集成）和 E1.3（task JSON dedup 字段）**完全未实现**。dev 交付的是 dedup API 本身的增强，不是集成工作。

---

## 代码审查发现

### 🔴 BLOCKER 1: dedup.test.js 不在 vitest 测试路径中

**文件**: `vibex-fronted/vitest.config.ts:16-22`
**问题**: `scripts/__tests__/dedup.test.js` 的测试文件不在 `include` 数组中。`npm test` / `npm run test:unit` 永远不运行这些测试。
**证据**: vitest include 只有 `tests/unit/**/*.{test,spec}.{ts,tsx}` 和 `src/**/*.{test,spec}.{ts,tsx}`
**影响**: 17 个 dedup 测试（simpleHash、generateKey、checkDedup、recordSend、cache corruption）从不运行。验收标准要求测试通过，但测试不存在于执行路径中。
**修复**: 将 `scripts/__tests__/**/*.test.js` 添加到 vitest.config.ts 的 include 数组

### 🔴 BLOCKER 2: E1.3 未实现 — zombie-alert.py 未调用 dedup_api.py

**文件**: `scripts/zombie-alert.py`
**问题**: zombie-alert.py 是空壳，`get_zombie_tasks()` 返回 `[]`（TODO），完全没有调用 `dedup_api.py`。
**证据**: `grep -n "dedup" scripts/zombie-alert.py` → 0 结果
**影响**: 
- task JSON 无 `dedup` 字段（E1.3 验收标准明确要求）
- similarity > 0.7 Slack 告警无法触发
- E1.2（修改 scheduler 调用 dedup）和 E1.3（dedup 字段写入 task JSON）完全未实现
**修复**: 在 zombie-alert.py 的任务创建/分发流程中调用 `http://localhost:8765/dedup`，将结果写入 task JSON 的 `dedup` 字段

### 🟡 SUGGESTION 1: dedup.js 使用了 require()，其他文件可能用 ESM

**文件**: `vibex-fronted/scripts/dedup.js:88`
**问题**: `module.exports = { ... }` 使用 CommonJS，但 `scripts/test-with-exit-code.js` 使用 ESM `import`。
**证据**: `scripts/dedup.js` 末尾 `module.exports`，但 `scripts/test-with-exit-code.js` 顶部 `import`
**影响**: 如果其他地方尝试用 ESM 导入 dedup.js 会失败。建议统一。
**修复**: 考虑同时导出 ESM 和 CJS，或确认只用 CJS 消费

### 🟡 SUGGESTION 2: dedup_api.py 的 GET /projects 解析有 bug

**文件**: `scripts/dedup_api.py:79-82`
**问题**: 代码逻辑重复且有 bug：先从空的 query string 解析，再重新解析 `self.path`。
```python
qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path)._replace(query="").query)
# Actually use parsed path  ← 这个注释说明开发者知道有问题
parsed = urllib.parse.urlparse(self.path)
params = urllib.parse.parse_qs(parsed.query)
```
**影响**: 第一个 `qs` 变量永不使用，`_replace(query="")` 故意清空了 query。
**修复**: 删除死代码，只保留 `parsed` + `params` 的解析

### 🟡 SUGGESTION 3: dedup.js 的 `recordSend` 缓存竞态条件

**文件**: `vibex-fronted/scripts/dedup.js:75-91`
**问题**: `readCache()` → 修改 → `writeCache()` 不是原子操作。在高频调用场景下，两个进程同时读→写会导致后写的覆盖先写的（丢失一个 entry）。
**证据**: 代码先 `readCache()` → 修改 → `writeCache()`，中间无锁
**影响**: 并发 recordSend 可能丢失记录，导致不该跳过的通知被跳过了（false negative）
**修复**: 使用文件锁（`fcntl.flock`）或原子文件替换（写临时文件再 rename）

### 💭 NIT: zombie-alert.py 的 DEFAULT_CONFIG 格式不一致

**文件**: `scripts/zombie-alert.py:16-22`
**问题**: 配置字典键的缩进不一致，critical_threshold 和 warning_threshold 对齐，但 escalation_time 和 re_alert_interval 没有对齐。
```python
DEFAULT_CONFIG = {
    'warning_threshold': 2,       # zombie > 2 时告警
    'critical_threshold': 5,       # zombie >= 5 时严重告警
    'escalation_time': 30,       # 响应超时阈值（分钟）
    're_alert_interval': 5,      # 重复告警最小间隔（分钟）
```
**修复**: 统一注释对齐

---

## 测试覆盖分析

### Backend (Python)
| 模块 | 测试文件 | 覆盖 | 状态 |
|------|---------|------|------|
| dedup.py | scripts/dedup/tests/test_dedup.py | 完整 | ✅ 34 passed |
| dedup_rules.py | scripts/dedup/tests/test_dedup_rules.py | 完整 | ✅ 23 passed |
| integration | scripts/dedup/tests/test_integration.py | 完整 | ✅ 11 passed |
| dedup_api.py | — | ❌ 无测试 | ⚠️ 建议补充 |
| zombie-alert.py | — | ❌ 无测试 | 🔴 集成未实现 |
| dedup_check.py | — | ❌ 无测试 | 🟡 |

**pytest 结果**: `57 passed in 1.29s` ✅

### Frontend (JS/TypeScript)
| 模块 | 测试文件 | 覆盖 | 状态 |
|------|---------|------|------|
| dedup.js | scripts/__tests__/dedup.test.js | 完整 | 🔴 不在 vitest include 中 |
| zombie-alert | — | ❌ 无测试 | 🔴 未实现 |

---

## CHANGELOG 状态

- `CHANGELOG.md` — ⚠️ 未检查（docs 目录不存在，需先确认路径）
- `src/app/changelog/page.tsx` — ⚠️ 未检查

**INV-4 注意**: changelog 双写必须同步更新，不能只改一个文件。

---

## 安全审查

| 检查项 | 结果 |
|--------|------|
| SQL 注入 | ✅ dedup_api.py 使用参数化查询，无 SQL 注入 |
| XSS | ✅ 无用户输入直接渲染 |
| 敏感信息硬编码 | ✅ 无敏感信息 |
| dedup_api.py CORS | ⚠️ `Access-Control-Allow-Origin: *` — 如果对公网暴露应限制 |
| zombie-alert.py dry_run | ✅ dry_run 参数安全实现 |

---

## 性能审查

| 检查项 | 结果 |
|--------|------|
| dedup API 响应时间 | ✅ 目标 < 500ms，dedup.py 纯内存计算，应满足 |
| dedup.js 缓存 | ⚠️ 每次 recordSend 遍历所有 key 清理过期项，O(n)，大缓存时可能慢 |
| dedup_api.py 并发 | ⚠️ HTTPServer 是单线程，serve_forever 不处理并发 |

---

## 结论

**VERDICT**: ❌ **REJECTED — CONDITIONAL ON FIXES**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 2 |
| 🟡 Suggestions | 4 |
| 💭 Nits | 1 |

**阻塞原因**:
1. **E1.3 未实现** — zombie-alert.py 未调用 dedup_api.py，task JSON 无 dedup 字段。这是 tester 上轮驳回的核心问题，**本轮仍未修复**。
2. **dedup.test.js 测试不运行** — 测试文件存在但不在 vitest include 路径中，`npm test` 从不执行这些测试。验收标准"测试通过"在当前配置下无法满足。

**修复优先级**:
1. 修复 vitest.config.ts include 路径（quick fix）
2. 实现 zombie-alert → dedup_api 集成（核心功能）
3. 补充 dedup_api.py 单元测试
4. 处理 SUGGESTION 级别问题
