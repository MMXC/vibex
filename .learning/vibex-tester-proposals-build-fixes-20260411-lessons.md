# 经验教训：Tester 视角 — 构建修复提案 + QA 验证体系（2026-04-11）

**项目**: `vibex-tester-proposals-vibex-build-fixes-20260411`
**角色**: Tester
**分析视角**: Tester 提案撰写人 + QA 体系设计者
**日期**: 2026-04-11
**关联项目**: `vibex-dev-proposals-vibex-build-fixes-20260411`（Epic 1 执行）, `vibex-architect-proposals-vibex-build-fixes-20260411`（Epic 2 CI 防护）

---

## 📋 项目概述

**任务一**：Tester 视角提案（提案输出角色）
- 输出了完整的 `proposal.md`（构建失败问题分析 + 8 个测试用例 + CI 自动化方案）
- 输出了 `QA_CRITERIA.md`（测试分层 + Canvas 模块清单 + P0/P1/P2 验收标准）
- 输出了 `IMPLEMENTATION_PLAN.md` + `feature-list.md`（Epic 1/2 划分，4+4=8 个 feature）

**任务二**：QA 验证体系设计（提案输出角色）
- 设计了前端三层测试架构（单元/集成/E2E）
- 规划了 CI 构建守护方案（ESLint + pre-commit + GitHub Actions）
- 设计了 Unicode 字符扫描脚本

**总工时**: 纯提案输出，未执行（implementation/ 目录为空）

---

## ✅ 做得好的地方

### 1. 测试用例编号体系规范（TC-001 ~ TC-008）

提案为每个测试用例分配了唯一编号，并在 feature-list 和回归检查清单中引用编号。这使得**测试用例可追踪、可交叉引用**，不依赖自然语言描述。

**模式固化**: 所有 Tester 提案的测试用例必须采用 TC-XXX 编号体系，并在文档顶部维护编号→测试内容映射表。

### 2. Unicode 字符扫描脚本直接可用

Python one-liner 检测 U+2018-U+201F 范围，逻辑正确且跨平台：

```python
for ch in line:
    if 0x2018 <= ord(ch) <= 0x201F:
        sys.exit(1)
```

这个脚本被 Dev 提案和 Architect 提案多次引用，证明了**可复用性设计**的价值——写一次，多个项目复用。

**模式固化**: 测试脚本必须做到"零配置可用"（hardcode 目标路径或接受参数），避免需要复杂的 setup 才能运行。

### 3. CI Pipeline YAML 配置模板完整

提案中的 GitHub Actions 配置覆盖了：
- Node.js setup + npm cache
- Frontend/Backend 分别构建
- Unicode 检测 job（带 `::error` annotation）

这是 DevOps 测试左移的典型实践——**在 CI 阶段拦截，而非等到上线后发现**。

### 4. 两阶段 Epic 依赖关系清晰

```
Epic 1（20min）: 紧急修复 + 构建验证
    ↓ 依赖
Epic 2（6h）: QA 验证体系（Smoke Test + 回归测试 + CI 守护）
```

这个划分逻辑正确：先解除阻塞，再建立防护。避免了"修完 bug 没留防护，过两周又复现"的问题（Dev 提案也提到了这个坑）。

**模式固化**: 所有构建修复类项目必须包含两阶段划分：Fix（解除阻塞）+ Guard（防止回归）。

### 5. QA_CRITERIA.md 做到了测试分层

| 层级 | 工具 | 覆盖率目标 | 频率 |
|------|------|-----------|------|
| 单元 | Vitest | ≥ 80% | CI every PR |
| 集成 | Vitest + MSW | ≥ 60% | CI every PR |
| E2E | Playwright | 关键路径全覆盖 | Nightly + Pre-release |

覆盖率目标数值化，而不是模糊地说"充分测试"。这是 tester 角色专业性的体现。

### 6. 回归检查清单（7 项）结构化且可执行

```
- [ ] 前端 `npm run build` 成功（退出码 0）
- [ ] 后端 `npm run build` 成功（退出码 0）
- [ ] `/api/agents` 返回 200 + Deprecation header
- [ ] `/api/pages` 返回 200
- [ ] `/api/prototype-snapshots` 返回 200
- [ ] Unicode 检测脚本执行通过（0 个弯引号）
- [ ] GitHub Actions `build` job 绿灯
```

每项都是**可验证的布尔条件**，不依赖主观判断。reviewer 可以对照清单逐项确认，不需要理解技术细节。

---

## ⚠️ 需要改进的地方

### 1. 提案依赖外部建议，缺乏 tester 独立立场

`analysis.md` 明确写道：

> Tester 角色本次**未提供独立提案**，但基于 Reviewer 提案的 PR 合入标准和 CI Storybook 构建建议，Tester 视角的验证方案完全可行。

这是 Tester 角色**自我矮化**。Reviewer 的建议是"提案 review"视角，不是"QA 测试设计"视角。Tester 应该：
- 独立分析构建失败对哪些功能路径有影响
- 设计针对性的 smoke test 而非泛泛的 API 回归
- 提出 Reviewer 没想到的边界条件（如：Unicode 作为数据内容 vs. Unicode 作为代码的区分）

**改进**: 即使与其他角色建议一致，Tester 也必须输出**独立命名的测试用例**（TC-XXX 编号），体现 tester 角色的专业判断。

### 2. feature-list 的 Epic 2 没有明确"由谁执行"

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 紧急修复与验证 | F1.1~F1.4 | 20 min |
| Epic 2 | QA 验证体系 | T2.1~T2.4 | 6h |

Epic 1 由 Dev 执行（已确认），但 **Epic 2 由谁执行没有明确**。6h 的 QA 验证体系工作：
- 如果由 Dev 执行 → Tester 没有做实际验证工作
- 如果由 Tester 执行 → 没有配套的执行 SOP

这导致 Epic 2 最终**悬空**（implementation/ 为空证明了这一点）。

**改进**: feature-list 必须明确每列 Epic 的执行角色。对于 6h 的 Epic 2，需要配套 test-run SOP 或 tester 执行脚本。

### 3. QA_CRITERIA.md 的 P2 项全部未完成，scope 边界不清

```
P0（必须通过）✅ — 全部完成
P1（高优先级）✅ — 全部完成
P2（回归保证）❌ — Playwright E2E 全部 pending
```

P2 的两个 E2E 测试（Canvas 三树 CRUD、登录/登出 redirect）是**真实有价值的**，但因为"本次 scope 太大"而被搁置。更重要的是：**这两个测试在 QA_CRITERIA.md 里列了，但从来没有被正式提上执行日程**。

**改进**: P2 项应该走单独的项目提案，而不是放在当前提案的"待完成"列表里。`QA_CRITERIA.md` 应该只包含**本次已执行或已承诺执行**的内容。

### 4. 提案覆盖范围超出了 Tester 角色的职责

proposal.md 中的"6.1 ESLint 规则增强"和"6.2 pre-commit Hook"是**Dev/DevOps 的工作范畴**。Tester 角色写到这里容易产生两个问题：
- Dev 看到 Tester 的 ESLint 配置后直接复制执行，缺少 lint 专业视角的 review
- CI pipeline 配置（GitHub Actions YAML）应该是 DevOps/Architect 提案的内容

**改进**: Tester 提案中的 CI 建议应该止步于**测试需求描述**（"需要 CI 检测 Unicode 弯引号"），而不是写出完整的 ESLint JSON 配置或 GitHub Actions YAML。前者 tester 有发言权，后者不是 tester 的专业范围。

### 5. 监控指标（"构建时长 < 5min"）没有实际基准数据

提案写道：
> 前端构建时长 | 目标 < 5min | 告警阈值 > 8min

但提案里**没有任何构建时长的历史数据**。5min 是拍脑袋数字，还是有数据支撑？

**改进**: 监控指标的数值必须基于历史数据或竞品基准。可以在提案中加一行：
```bash
# 在提交前运行获取基准
time npm run build  # 记录实际时长
```

### 6. "Tester 提案"与"Tester 分析"文档混淆

项目中有两份文档：
- `proposal.md` — Tester 的测试提案
- `analysis.md` — Analyst 对 Tester 提案的分析报告

这两份文档**在同一项目目录下**，但性质完全不同。`analysis.md` 是 Analyst 写的，不是 Tester 写的，混在一起容易让人误以为 Tester 的分析质量等同于 Dev/Architect/PM 的提案质量。

**改进**: `analysis.md` 应该只存在于跨角色提案汇总项目（`vibex-proposals-summary-xxx`）里，不应混入单一角色的提案目录。

---

## 🔁 可复用的模式

### 模式 1：TC-XXX 编号 + 独立验证的测试用例体系

```
TC-001: 前端全量构建成功
TC-002: 后端全量构建成功
TC-003: Storybook 构建（条件触发）
TC-004: Unicode 弯引号扫描
TC-005~007: API 功能回归
TC-008: Unicode 输入容错
```

**适用范围**: 所有涉及修复验证、回归测试的项目。TC 编号体系让 reviewer 和 coord 可以快速定位"哪个测试失败了"。

### 模式 2：Unicode 检测扫描脚本

```python
import glob, sys
for f in glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True):
    with open(f, 'rb') as fh:
        for i, line in enumerate(fh.read().decode('utf-8', errors='replace').split('\n'), 1):
            for ch in line:
                if 0x2018 <= ord(ch) <= 0x201F:
                    print(f'::error file={f},line={i}::Unicode curly quote U+{ord(ch):04X}')
                    sys.exit(1)
```

**适用范围**: 所有涉及国际化、API route、字符串处理的构建修复项目。直接复制使用。

### 模式 3：两阶段 Epic（Fix → Guard）

```
Epic 1: 紧急修复（< 30min, Dev 执行）
Epic 2: 回归防护（> 1h, Tester/DevOps 执行）
```

**适用范围**: 所有 P0/P1 构建修复项目。这个模式已被 Dev 和 Architect 提案共同验证，是团队共识。

### 模式 4：回归检查清单（7 项可布尔验证）

每项检查都是布尔条件，不需要技术理解就能确认。这让 reviewer、coord 甚至用户都可以做快速验收。

**适用范围**: 所有涉及多仓库、多接口的修复项目。

### 模式 5：构建验证的缓存清除 SOP

```bash
# 验证前强制清除缓存
rm -rf .next .turbo node_modules/.cache
# 在干净环境验证
npm run build
```

**适用范围**: 所有涉及前端构建的修复项目。这是 Dev 提案里的教训（"构建缓存导致验证不准确"），值得固化到 tester 的 SOP 里。

---

## 🚫 下次避免的坑

### 坑 1：提案写了 CI 配置，但没有配套的执行验证

ESLint JSON、GitHub Actions YAML 写完后，**没有人在 CI 里实际跑过**。这比不写还危险——因为"CI 里配置了"会产生虚假的安全感。

**避免**: Tester 的 CI 建议必须包含"验证步骤"：
> 在提交前，运行以下命令验证 CI 配置：`.github/workflows/build.yml` 的 `unicode-check` job 已在本地通过测试。

### 坑 2：Epic 2（6h）没有指定执行者，导致悬空

6h 的测试工作没有人认领。Dev 觉得这是 Tester 的活，Tester 觉得这是 DevOps 的活，最后没人干。

**避免**: feature-list 中每个 Epic 必须在 `plan` 阶段就明确执行者：
```
Epic 2: QA 验证体系 | 执行: tester | 工时: 6h | 状态: pending
```
coord 在派发任务时必须根据执行者分配，而不是假设"自然会有人做"。

### 坑 3：测试用例依赖"修复已实施"（状态混淆）

TC-001 ~ TC-008 的前置条件都写了"问题已修复"，但提案本身没有记录"修复什么时候完成的、谁来确认的"。

**避免**: 每个涉及修复验证的提案，feature-list 必须包含一个 **"修复完成确认"节点**，在这个节点之前，测试用例不能标记为 PASS。

### 坑 4：多角色提案混在同一目录（analysis.md 污染角色提案）

`analysis.md` 是 Analyst 写的，放在 Tester 提案目录里容易导致：
- 后来者以为 Tester 做了深度分析（实际是 Analyst 的视角）
- Tester 自己 review 时受到 Analyst 判断的锚定效应

**避免**: 单一角色的提案目录里**只能包含该角色的输出文档**。跨角色分析统一放在 `vibex-proposals-summary-xxx` 目录。

### 坑 5：P2 测试项长期 pending，无正式升级路径

Canvas 三树 CRUD E2E 测试被写在 QA_CRITERIA.md 里，然后被长期忽略，直到下次有人问"为什么没有 E2E 测试"时才发现它一直存在但未执行。

**避免**: P2 项应该走正式的项目化流程：
1. 在提案中识别 P2 项
2. 通过 coord 派发给 tester 正式执行
3. 或者明确标记为 `out-of-scope-for-this-proposal`，在 project board 单独建卡

---

## 📊 Tester 角色自评

| 维度 | 评分 | 说明 |
|------|------|------|
| 提案完整性 | ⭐⭐⭐⭐ | 8 个测试用例 + CI 配置，覆盖面广 |
| 提案独立性 | ⭐⭐ | 依赖 Reviewer 建议，缺乏 tester 独立立场 |
| 模式可复用性 | ⭐⭐⭐⭐⭐ | TC 编号体系 + Unicode 扫描脚本可直接复用 |
| 执行落地性 | ⭐⭐ | implementation/ 为空，Epic 2 悬空 |
| scope 边界管理 | ⭐⭐⭐ | Epic 1/2 划分合理，但 P2 项处理不当 |
| CI 配置合理性 | ⭐⭐⭐⭐ | GitHub Actions YAML 模板完整且正确 |
| **综合** | **⭐⭐⭐** | **提案质量高，但落地执行断链** |

---

## 📎 关联文件索引

- Tester 提案: `docs/vibex-tester-proposals-vibex-build-fixes-20260411/proposal.md`
- QA 验证体系: `docs/vibex-tester-proposals-vibex-build-fixes-20260411/QA_CRITERIA.md`
- Dev 经验教训: `.learning/vibex-dev-proposals-build-fixes-20260411-lessons.md`
- 团队综合经验: `.learning/vibex-build-fixes-20260411-lessons.md`
- Architect CI 防护: `docs/vibex-architect-proposals-vibex-build-fixes-20260411/`

---

## 🎯 对 Coord 的建议

1. **Epic 2 执行分配**：6h 的 QA 验证体系（TC 回归测试 + CI 守护部署）需要正式派发给 tester 执行，不能假设 Epic 1 修完就结束了。

2. **Unicode 扫描脚本推广**：将 Tester 提案中的 Unicode 检测脚本固化为团队 SOP（`scripts/check-unicode-quotes.sh`），在所有构建相关项目中使用。

3. **P2 测试项升级**：Canvas E2E 测试（TC-007/008）应该在 project board 单独建卡，作为独立 QA 项目推进，而不是埋在构建修复提案的"待完成"列表里。

4. **Tester 独立性要求**：coord 在派发 tester 任务时，应要求 tester 输出**独立分析**，禁止直接引用"基于其他角色建议"作为 Tester 提案的依据。
