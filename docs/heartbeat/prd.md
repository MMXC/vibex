# VibeX Sprint 8 — 产品需求文档（PRD）

**项目**: VibeX Sprint 8
**版本**: v1.0
**日期**: 2026-04-25
**状态**: 草稿（待 Coord 评审）
**产出路径**: `/root/.openclaw/vibex/docs/heartbeat/prd.md`

---

## 1. 执行摘要

### 背景

VibeX 已完成 Sprint 1–7 交付，涵盖 Canvas 三树、Delivery 交付中心、Dashboard、Firebase Presence（REST）、Teams API、Import/Export、批量导出等核心功能。Sprint 8 定位为**债务清理 + 质量门禁 + 可行性验证**冲刺，不引入新功能架构。

当前存在三类债务：
- **技术债**：143 个 TypeScript 编译错误，Cloudflare Workers 类型缺失，CI `tsc --noEmit` gate 形同虚设
- **质量债**：PM 神技（Design Token / 四态表 / 情绪地图）落地系统性失败，每次提案质量参差不齐
- **功能风险**：Firebase SDK 升级未经验证；Import/Export 无 round-trip E2E，数据丢失风险未量化

### 目标

| 目标 | 衡量指标 |
|------|----------|
| TS 编译零错误 | `tsc --noEmit` exit code = 0，CI gate 100% 通过 |
| Firebase SDK 可行性明确 | Architect 产出可行性报告，含冷启动性能数据 |
| Import/Export round-trip 覆盖 | JSON/YAML 关键路径 Playwright E2E 通过 |
| PM 评审质量门禁建立 | Coord 评审清单含四态表/Design Token/情绪地图检查点 |
| Analytics Dashboard 可用 | `/dashboard` 页面 Analytics widget 可见 |

### 成功指标

- P001：143 个 TS 错误归零，CI 构建稳定
- P002：Firebase SDK 冷启动 < 500ms，Presence 延迟 < 1s，或 Architect 明确给出"不可行"结论
- P003：JSON/YAML round-trip E2E 覆盖率 100%，5MB 文件限制前端拦截率 100%
- P004：Coord 评审清单更新完成，所有新提案强制走新检查点

---

## 2. Feature List（功能清单）

> 基于 `analysis.md` 的 Epic/Story 结构提取。

| ID | 功能点 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F1.1 | 安装 @cloudflare/workers-types 类型包 | 安装 `@cloudflare/workers-types@^4.20250415.0`，覆盖 Cloudflare Workers API 类型 | TS 编译错误 | 0.5d |
| F1.2 | 批量修复 TS 编译错误 | 按错误类型分批修复（WebSocketPair/API Response/PrismaClient/unknown/any/枚举），Batch 1 快速止血 | TS 编译错误 | 2d |
| F1.3 | CI tsc gate 验证 | GitHub Actions CI 配置 `tsc --noEmit` gate，确保通过率 100% | TS 编译错误 | 0.5d |
| F2.1 | Architect Firebase SDK 可行性评审 | 评估 Firebase Admin SDK 在 Cloudflare Workers 环境的冷启动性能和可行性 | Firebase SDK 升级风险 | 1d |
| F2.2 | Firebase SDK 冷启动性能测试 | 实测 Firebase SDK init 时间，Playwright E2E 测量，目标 < 500ms | Firebase SDK 升级风险 | 1d |
| F2.3 | Presence 更新延迟验证 | 单用户 Presence 更新延迟实测，目标 < 1s | Firebase SDK 升级风险 | 1d |
| F2.4 | Analytics Dashboard 页面集成 | `/dashboard` 页面 Analytics widget 集成，含用户行为数据（页面访问/组件创建/导出） | Analytics 看板缺失 | 1.5d |
| F2.5 | SSE bridge 改造 | 将现有 EventSource 改造为 SSE bridge，支持 Firebase SDK 推送 | Firebase SDK 升级风险 | 0.5d |
| F3.1 | Teams API E2E 验证 | Teams API 关键路径 Playwright E2E 测试覆盖 | Teams API 功能验证缺失 | 1d |
| F3.2 | JSON round-trip E2E 测试 | 导出 → 删除 → 导入 → JSON.stringify 对比，内容完全一致 | Import/Export 数据丢失风险 | 1d |
| F3.3 | YAML round-trip E2E 测试 | 含特殊字符（`: # | 多行）边界测试，round-trip 无转义丢失 | Import/Export 数据丢失风险 | 1d |
| F3.4 | 5MB 文件大小限制 | 前端拦截超大文件上传，提示"文件大小超出 5MB 限制" | Import/Export 文件大小风险 | 0.5d |
| F4.1 | Coord 评审检查点更新 | Coord 评审清单新增四态表/Design Token/情绪地图检查点 | PM 神技落地失败 | 1d |
| F4.2 | PRD 模板更新 | PRD 模板新增"本期不做"清单章节、神技（剥洋葱/极简主义/老妈测试）指引 | PM 神技落地失败 | 0.5d |
| F4.3 | SPEC 模板更新 | SPEC 模板新增四态表、Design Token 规范、情绪地图路径引用 | PM 神技落地失败 | 0.5d |

**工时合计**: 13.5d

---

## 3. Epic 拆分

### P001 TypeScript 债务清理（3d）

| Story | 描述 | 工时 | 优先级 |
|-------|------|------|--------|
| P001-S1 安装类型包 | 安装 `@cloudflare/workers-types@^4.20250415.0` | 0.5d | P0 |
| P001-S2 批量修复 TS 错误 | 按 Batch 1/2/3 分批修复 143 个错误 | 2d | P0 |
| P001-S3 CI tsc gate 验证 | GitHub Actions 配置 tsc gate，通过率 100% | 0.5d | P0 |

#### 2a. 本质需求穿透（神技1）

- **用户的底层动机**：开发团队需要**信任 CI**——每次 commit 都能得到快速的类型安全反馈，而不是面对形同虚设的 tsc gate
- **去掉现有方案，理想解法**：理想状态是 `git push` → CI 自动运行 `tsc --noEmit` → 零错误 → 合流。去掉 TS gate，等于去掉团队的类型安全网
- **解决的本质问题**：CI 失去了类型检查这一层安全网，`as any` 和 `unknown` 泛滥，编译错误积累到 143 个

#### 2b. 最小可行范围（神技2）

- **本期必做**：类型包安装 + 全部 143 个错误修复 + CI gate 配置
- **本期不做**：无
- **暂缓**：`tsconfig.json` 严格模式升级（`strict: true`）、新引入的 TS 规则（如 `noUncheckedIndexedAccess`），留待后续 Sprint

#### 用户情绪地图

| 场景 | 进入情绪 | 引导文案 | 兜底机制 |
|------|----------|----------|----------|
| dev 运行 `tsc --noEmit` 看到大量错误 | 焦虑/挫败 | "正在安装类型包，预计 60% 错误自动消除" | Batch 1 修复后立即提交，减少错误积压感知 |
| CI 失败通知 | 紧张/不安 | "TSC gate 失败，请检查类型错误" | 提供错误数量趋势图，连续降低则安心 |

---

### P002 Firebase 实时协作可行性验证（5d）

| Story | 描述 | 工时 | 优先级 |
|-------|------|------|--------|
| P002-S1 Architect 评审 | Firebase Admin SDK 在 Cloudflare Workers 可行性 + 冷启动性能评估 | 1d | P0 |
| P002-S2 Firebase SDK 冷启动 | Playwright E2E 测量 SDK init 时间，目标 < 500ms | 1d | P1 |
| P002-S3 Presence 更新延迟 | Presence 更新延迟实测，目标 < 1s | 1d | P1 |
| P002-S4 Analytics Dashboard 页面集成 | `/dashboard` 页面 Analytics widget（含页面访问/组件创建/导出数据） | 1.5d | P1 |
| P002-S5 SSE bridge 改造 | EventSource → SSE bridge 改造 | 0.5d | P2 |

#### 2a. 本质需求穿透（神技1）

- **用户的底层动机**：团队需要知道 Firebase SDK 升级是否可行、是否值得迁移。不接受未知风险
- **去掉现有方案，理想解法**：理想状态是 Firebase SDK 在 Cloudflare Workers 环境下冷启动 < 500ms，支持高级特性（离线持久化、Firestore），同时保持 REST API 的零 bundle 体积优势
- **解决的本质问题**：不知道 Firebase SDK 在边缘计算环境下是否可用，这个不确定性阻塞了协作功能的扩展路线图

#### 2b. 最小可行范围（神技2）

- **本期必做**：S1 Architect 评审（阻塞其他 P002 Story）+ S4 Analytics Dashboard
- **本期不做**：S5 SSE bridge 改造（如果 S1 结论为"不可行"则全部暂缓）
- **暂缓**：Firebase Firestore 集成、离线持久化特性

#### 2c. 用户情绪地图（神技3）+ 2d. UI状态规范（神技4）

> Analytics Dashboard 详细规格见 `specs/p002-s4-analytics-dashboard.md`

| 页面 | 进入情绪 | 引导文案 | 兜底机制 |
|------|----------|----------|----------|
| `/dashboard` Analytics widget 加载中 | 期待/好奇 | 骨架屏占位，不显示 loading spinner | 超时 3s 显示"数据加载中，请稍候" |
| Analytics 数据为空 | 困惑/失望 | "暂无数据，开始使用 VibeX 后数据会自动生成" | 提供引导教程链接 |
| Analytics 数据加载失败 | 焦虑/挫败 | "数据加载失败，请检查网络连接" | 重试按钮 + 错误日志 ID |
| Firebase SDK 冷启动超 500ms | 不安 | （内部指标，用户无感知） | Architect 评审报告记录，触发降级到 REST API |

---

### P003 Teams + Import/Export 测试覆盖（3.5d）

| Story | 描述 | 工时 | 优先级 |
|-------|------|------|--------|
| P003-S1 Teams API E2E 验证 | Teams API 关键路径 Playwright E2E 测试 | 1d | P1 |
| P003-S2 JSON round-trip E2E | 导出 → 删除 → 导入，JSON 内容完全一致 | 1d | P0 |
| P003-S3 YAML round-trip E2E | 含特殊字符边界测试，round-trip 无转义丢失 | 1d | P0 |
| P003-S4 5MB 文件大小限制 | 前端拦截超大文件，提示限制 | 0.5d | P1 |

#### 2a. 本质需求穿透（神技1）

- **用户的底层动机**：团队需要**确认 Export 出去的数据 Import 回来是完整且一致的**，不能有数据丢失
- **去掉现有方案，理想解法**：每次 Import/Export 操作都有自动化 round-trip 测试保障，任何格式不兼容在 CI 阶段暴露，而不是在生产环境中被发现
- **解决的本质问题**：Export 数据和 Import 数据的格式一致性没有自动化保障，数据丢失风险是未知的未知

#### 2b. 最小可行范围（神技2）

- **本期必做**：S2 JSON round-trip + S3 YAML round-trip + S4 5MB 限制
- **本期不做**：XML round-trip 测试、压缩包内多文件 round-trip
- **暂缓**：Export 到第三方格式（CSV/Excel）、Import 历史版本回溯

#### 用户情绪地图

| 场景 | 进入情绪 | 引导文案 | 兜底机制 |
|------|----------|----------|----------|
| JSON 导出成功 | 满足/安心 | "导出成功，文件已准备下载" | 提供文件名 + 文件大小预览 |
| JSON 导出后 Import 失败 | 恐慌/焦虑 | "Import 失败，请检查文件格式或联系支持" | 显示错误详情 + 错误 ID |
| 文件超过 5MB | 困惑 | "文件大小超出 5MB 限制，请拆分文件或压缩后再试" | 提供 5MB 以内导出的操作指引 |

---

### P004 PM 神技质量门禁建立（2d）

| Story | 描述 | 工时 | 优先级 |
|-------|------|------|--------|
| P004-S1 Coord 评审检查点更新 | Coord 评审清单新增神技检查点（四态表/Design Token/情绪地图） | 1d | P0 |
| P004-S2 PRD 模板更新 | PRD 模板新增神技指引 + "本期不做"章节 | 0.5d | P1 |
| P004-S3 SPEC 模板更新 | SPEC 模板新增四态表 + Design Token 规范 + 情绪地图引用 | 0.5d | P1 |

#### 2a. 本质需求穿透（神技1）

- **用户的底层动机**：Coord 需要一个**可操作的检查清单**，而不是每次都要人工检查四态表/Design Token/情绪地图是否存在
- **去掉现有方案，理想解法**：提案提交时自动检查关键章节存在性，不合规的提案在 Coord 入口就被拦截
- **解决的本质问题**：PM 神技（Design Token/四态表/情绪地图）没有强制落地机制，每次提案质量参差不齐，Coord 重复劳动

#### 2b. 最小可行范围（神技2）

- **本期必做**：S1 Coord 检查点更新（阻塞性）+ S2 PRD 模板
- **本期不做**：自动检查工具（Script/Regex）开发
- **暂缓**：SPEC 模板的 Design Token 自动化校验工具

#### 用户情绪地图

| 场景 | 进入情绪 | 引导文案 | 兜底机制 |
|------|----------|----------|----------|
| PM 提交提案等待 Coord 评审 | 期待/紧张 | "正在检查提案质量..." | 显示检查点进度 |
| 提案缺少四态表被拦截 | 困惑/轻微挫败 | "提案缺少四态表定义，请补充后重新提交" | 提供四态表模板引用 |
| 提案通过 Coord 评审 | 满足/安心 | "提案通过评审，已进入开发队列" | 发送 Slack 通知 |

---

## 4. 验收标准

### P001 TypeScript 债务清理

**P001-S1 安装类型包**
```javascript
expect(
  execSync('cd vibex-backend && pnpm exec tsc --noEmit 2>&1 || true', {encoding: 'utf8'}),
  'to contain',
  '@cloudflare/workers-types installed'
)
// 验证：pnpm list @cloudflare/workers-types 显示已安装
expect(
  execSync('cd vibex-backend && pnpm list @cloudflare/workers-types --depth 0', {encoding: 'utf8'}),
  'to contain',
  '@cloudflare/workers-types'
)
```

**P001-S2 批量修复 TS 错误**
```javascript
// Batch 1 快速止血（预期消除约 60% 错误）
const output = execSync('cd vibex-backend && pnpm exec tsc --noEmit 2>&1 || true', {encoding: 'utf8'})
const errorCount = (output.match(/error TS\d+:/g) || []).length
expect(errorCount, 'to be', 0)
```

**P001-S3 CI tsc gate 验证**
```javascript
// GitHub Actions CI 中验证
expect(process.env.CI, 'to be', 'true')
expect(
  execSync('cd vibex-backend && pnpm exec tsc --noEmit; echo $?', {encoding: 'utf8'}).trim(),
  'to be',
  '0'
)
```

### P002 Firebase 实时协作可行性验证

**P002-S1 Architect 评审**
```javascript
// 验证：文档存在且包含性能数据
expect(
  fs.existsSync('/root/.openclaw/vibex/docs/architecture/firebase-feasibility-review.md'),
  'to be',
  true
)
const doc = fs.readFileSync('/root/.openclaw/vibex/docs/architecture/firebase-feasibility-review.md', 'utf8')
expect(doc, 'to contain', '冷启动')
expect(doc, 'to contain', 'ms')
```

**P002-S2 Firebase SDK 冷启动性能测试**
```javascript
// Playwright E2E 测量
const start = Date.now()
await page.goto('/dashboard')
await page.waitForSelector('.analytics-widget', {timeout: 5000})
const duration = Date.now() - start
expect(duration, 'to be less than', 500)
```

**P002-S3 Presence 更新延迟验证**
```javascript
// Playwright E2E
await page.goto('/presence')
const presenceStart = Date.now()
await page.waitForSelector('.presence-indicator', {timeout: 2000})
const latency = Date.now() - presenceStart
expect(latency, 'to be less than', 1000)
```

**P002-S4 Analytics Dashboard 页面集成**【需页面集成】
```javascript
expect(isVisible('.analytics-widget'), 'to be', true)
expect(
  await page.locator('.analytics-widget .stat-card').count(),
  'to be greater than',
  0
)
```

**P002-S5 SSE bridge 改造**
```javascript
// 验证：EventSource 替换为 SSE 端点
const response = await fetch('/api/presence/stream')
expect(response.headers.get('content-type'), 'to contain', 'text/event-stream')
```

### P003 Teams + Import/Export 测试覆盖

**P003-S1 Teams API E2E 验证**
```javascript
// Playwright E2E
await page.goto('/teams')
await page.waitForSelector('.teams-list')
const teamCount = await page.locator('.team-item').count()
expect(teamCount, 'to be greater than', 0)
```

**P003-S2 JSON round-trip E2E 测试**
```javascript
// Playwright E2E
await page.goto('/export')
await page.click('[data-testid="export-json"]')
const exportedJson = await downloadFile('export.json')
const parsed = JSON.parse(exportedJson)
// 删除原数据
await deleteAllData()
// Import
await page.goto('/import')
await page.setInputFiles('[data-testid="import-file"]', exportedJson)
await page.click('[data-testid="import-submit"]')
// 验证内容一致
const reExported = await downloadFile('export-after-import.json')
expect(JSON.stringify(JSON.parse(reExported)), 'to equal', JSON.stringify(parsed))
```

**P003-S3 YAML round-trip E2E 测试**
```javascript
// 特殊字符测试：`:#| 多行
const yamlContent = `key: "value:with:colons"
special: "hash#comment"
multiline: |
  line1
  line2
emoji: "🎉🚀"
`
// round-trip 后无转义丢失
const roundTripped = yaml.load(yaml.stringify(yaml.load(yamlContent)))
expect(roundTripped.multiline, 'to contain', 'line1')
expect(roundTripped.emoji, 'to equal', '🎉🚀')
```

**P003-S4 5MB 文件大小限制**【需页面集成】
```javascript
// Playwright E2E
const hugeFile = Buffer.alloc(6 * 1024 * 1024) // 6MB
await page.goto('/import')
await page.setInputFiles('[data-testid="import-file"]', {
  name: 'large.json',
  buffer: hugeFile,
  mimeType: 'application/json'
})
await page.click('[data-testid="import-submit"]')
const errorMsg = await page.locator('.error-message').textContent()
expect(errorMsg, 'to contain', '5MB')
```

### P004 PM 神技质量门禁建立

**P004-S1 Coord 评审检查点更新**
```javascript
// 验证：评审清单包含神技检查点
const checklist = fs.readFileSync('/root/.openclaw/vibex/docs/coord/review-checklist.md', 'utf8')
expect(checklist, 'to contain', '四态表')
expect(checklist, 'to contain', 'Design Token')
expect(checklist, 'to contain', '情绪地图')
```

**P004-S2 PRD 模板更新**
```javascript
const prdTemplate = fs.readFileSync('/root/.openclaw/vibex/docs/templates/prd-template.md', 'utf8')
expect(prdTemplate, 'to contain', '本期不做')
expect(prdTemplate, 'to contain', '剥洋葱')
expect(prdTemplate, 'to contain', '极简主义')
expect(prdTemplate, 'to contain', '老妈测试')
```

**P004-S3 SPEC 模板更新**
```javascript
const specTemplate = fs.readFileSync('/root/.openclaw/vibex/docs/templates/spec-template.md', 'utf8')
expect(specTemplate, 'to contain', '四态')
expect(specTemplate, 'to contain', 'Design Token')
expect(specTemplate, 'to contain', '情绪地图')
```

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

所有 Epic 的 DoD 通用标准：
- [ ] 所有代码变更已 commit，commit message 遵循 `feat/fix/chore: description` 格式
- [ ] CHANGELOG.md 已更新（Epic 名称 + 主要变更描述）
- [ ] CI pipeline 全部通过（无 red build）
- [ ] 无未关闭的 TODO/FIXME
- [ ] 相关文档已更新

### P001 DoD
- [ ] `cd vibex-backend && pnpm exec tsc --noEmit` exit code = 0
- [ ] GitHub Actions CI 中 `tsc --noEmit` gate 通过率 100%
- [ ] 143 个 TS 编译错误归零
- [ ] `@cloudflare/workers-types@^4.20250415.0` 已添加到 `package.json` dependencies

### P002 DoD
- [ ] `docs/architecture/firebase-feasibility-review.md` 存在且包含冷启动性能数据
- [ ] Firebase SDK init 时间 < 500ms（Playwright E2E 验证）或 Architect 评审结论为"不可行"
- [ ] Presence 更新延迟 < 1s（Playwright E2E 验证）
- [ ] `/dashboard` 页面 Analytics widget 可见且数据正常展示
- [ ] SSE bridge 改造完成（EventSource → SSE 端点）

### P003 DoD
- [ ] JSON round-trip E2E：导出 → 删除 → 导入，JSON 内容完全一致
- [ ] YAML round-trip E2E：含特殊字符 round-trip 无转义丢失
- [ ] 5MB 文件上传被前端拦截，显示正确错误提示
- [ ] Teams API E2E 关键路径测试通过

### P004 DoD
- [ ] Coord 评审清单包含四态表/Design Token/情绪地图检查点
- [ ] PRD 模板包含"本期不做"清单章节
- [ ] SPEC 模板包含四态表/Design Token/情绪地图路径引用
- [ ] 所有团队成员已知悉新的评审流程

---

## 6. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 安装 @cloudflare/workers-types 类型包 | 安装类型包覆盖 Workers API | expect(pnpm list, 'to contain', '@cloudflare/workers-types') | 否 |
| F1.2 | 批量修复 TS 编译错误 | 分 Batch 修复 143 个错误 | expect(tsc --noEmit errorCount, 'to be', 0) | 否 |
| F1.3 | CI tsc gate 验证 | CI 配置 tsc gate | expect(ci_exit_code, 'to be', 0) | 否 |
| F2.1 | Architect Firebase SDK 评审 | 产出可行性报告 | expect(fs.existsSync(firebase-feasibility-review.md)) | 否 |
| F2.2 | Firebase SDK 冷启动测试 | SDK init < 500ms | expect(init_duration, 'to be less than', 500) | 否 |
| F2.3 | Presence 更新延迟验证 | 延迟 < 1s | expect(presence_latency, 'to be less than', 1000) | 否 |
| F2.4 | Analytics Dashboard 页面集成 | widget 可见且数据正常 | expect(isVisible('.analytics-widget'), 'to be', true) | 【需页面集成】 |
| F2.5 | SSE bridge 改造 | EventSource → SSE | expect(content-type, 'to contain', 'text/event-stream') | 否 |
| F3.1 | Teams API E2E 验证 | 关键路径测试覆盖 | expect(teamCount, 'to be greater than', 0) | 【需页面集成】 |
| F3.2 | JSON round-trip E2E 测试 | 导出/导入内容一致 | expect(JSON.stringify(exported), 'to equal', JSON.stringify(reimported)) | 【需页面集成】 |
| F3.3 | YAML round-trip E2E 测试 | 特殊字符 round-trip 无丢失 | expect(multiline_content, 'to contain', 'line1') | 【需页面集成】 |
| F3.4 | 5MB 文件大小限制 | 前端拦截超大文件 | expect(errorMsg, 'to contain', '5MB') | 【需页面集成】 |
| F4.1 | Coord 评审检查点更新 | 清单含神技检查点 | expect(checklist, 'to contain', '四态表') | 否 |
| F4.2 | PRD 模板更新 | 模板含神技指引 | expect(prdTemplate, 'to contain', '本期不做') | 否 |
| F4.3 | SPEC 模板更新 | 模板含四态表 | expect(specTemplate, 'to contain', '四态') | 否 |

---

## 7. 优先级矩阵

| Epic | Story | 优先级 | 工时 | 依赖 |
|------|-------|--------|------|------|
| P001 | S1 安装类型包 | P0 | 0.5d | 无 |
| P001 | S2 批量修复 TS 错误 | P0 | 2d | S1 |
| P001 | S3 CI tsc gate | P0 | 0.5d | S2 |
| P002 | S1 Architect 评审 | P0 | 1d | 无（先于其他 P002 Story） |
| P002 | S4 Analytics Dashboard | P1 | 1.5d | S1 结论为"可行" |
| P002 | S2 Firebase 冷启动 | P1 | 1d | S1 结论为"可行" |
| P002 | S3 Presence 延迟 | P1 | 1d | S2 |
| P002 | S5 SSE bridge | P2 | 0.5d | S2/S3 |
| P003 | S2 JSON round-trip | P0 | 1d | 无（可并行） |
| P003 | S3 YAML round-trip | P0 | 1d | 无（可并行） |
| P003 | S1 Teams API E2E | P1 | 1d | 无（可并行） |
| P003 | S4 5MB 限制 | P1 | 0.5d | 无（可并行） |
| P004 | S1 Coord 检查点更新 | P0 | 1d | 无（可并行，2d内完成） |
| P004 | S2 PRD 模板 | P1 | 0.5d | S1 |
| P004 | S3 SPEC 模板 | P1 | 0.5d | S2 |

---

## 8. 风险与依赖

| ID | 风险 | 可能性 | 影响 | 缓解 |
|----|------|--------|------|------|
| R1 | P002-S1 评审结论为"不可行" | 中 | 高 | S1 先于其他 P002 Story 执行；若不可行，P002 降级 |
| R2 | P001-S2 修复超 2d | 高 | 中 | Batch 1 快速止血（预计消除 60% 错误）|
| R3 | P003 round-trip 发现格式不兼容 | 低 | 高 | 先用真实数据跑一遍 round-trip 再写测试 |
| R4 | P004 检查点更新影响现有流程 | 低 | 低 | S1 作为第一优先级，评审清单更新后告知全体 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 无（Coord 决策后绑定）
- **执行日期**: 待定

---

## 附录

### 依赖关系图

```
P001-S1 ──→ P001-S2 ──→ P001-S3
P002-S1 ──→ P002-S2 ──→ P002-S3 ──→ P002-S5
         └─→ P002-S4
P003-S1, S2, S3, S4 (可并行)
P004-S1 ──→ P004-S2 ──→ P004-S3
```

### 工时汇总

| Epic | 合计 |
|------|------|
| P001 | 3d |
| P002 | 5d |
| P003 | 3.5d |
| P004 | 2d |
| **总计** | **13.5d** |
