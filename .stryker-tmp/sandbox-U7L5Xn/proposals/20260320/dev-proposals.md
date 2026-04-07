# Dev Agent 提案 — 2026-03-20

**Agent**: Dev  
**视角**: 代码质量 / TypeScript 安全 / 可维护性 / 性能

---

## 提案一：前端 TypeScript 严格化（P0）

### 现状问题
`vibex-fronted/tsconfig.json` 当前配置：
```json
"strict": false,
"noImplicitAny": false,
"strictNullChecks": false,
```
与后端 `strict: true` 严重不一致，形成"两套标准"的技术债务。

### 风险
- 运行时 `undefined is not iterable`、`Cannot read property of null` 错误频发
- 新人接手代码时类型推断不可信
- 重构风险极高，任何字段删除/重命名都难以静态发现影响

### 建议方案
1. 启用 `strict: true`、`strictNullChecks: true`、`noImplicitAny: true`
2. 分阶段灰度推进：按目录逐步迁移（`app/` → `components/` → `hooks/` → `stores/`）
3. 迁移过程中用 `// @ts-expect-error` / `// @ts-ignore` 标注，已知问题逐条清零

### 验收标准
- [ ] 前端 tsconfig 全部 strict 选项开启
- [ ] CI 中 `npm run build` 无 TS 错误
- [ ] 运行时 NullReference 错误减少 80%（通过监控基线对比）

### 工作量
- 扫描 + 修复：`~3d`
- CI 配置：`~0.5d`

---

## 提案二：Test Files 纳入 TypeScript 编译检查（P1）

### 现状问题
`tsconfig.json` exclude 配置：
```json
"exclude": ["node_modules", "**/*.test.ts", "**/*.test.tsx"]
```
- 项目存在 151 个测试文件，全部排除在 TS 类型检查之外
- `page.test.tsx` 等关键文件即使存在，编译时也不校验类型一致性
- 测试代码的类型错误不会在 CI build 阶段被发现

### 建议方案
1. 从 exclude 中移除 `**/*.test.ts` 和 `**/*.test.tsx`
2. 新增 `tsconfig.test.json` 专用于 Jest/Mocha 环境的宽松配置（允许 `skipLibCheck` 等）
3. 将测试文件纳入 `npm run build` 的类型检查流程

### 验收标准
- [ ] 测试文件不再被 exclude
- [ ] 测试文件 TS 编译错误被 CI 检测

### 工作量
- `~0.5d`

---

## 提案三：Eslint 规范化 — 消除硬编码 eslint-disable（P1）

### 现状问题
当前代码库存在 8 处 `eslint-disable` 注释，部分覆盖了整个文件或大段代码。
典型模式：
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```
等于"用 eslint-disable 绕过 ESLint"，而非"用类型重构修复问题"。

### 建议方案
1. 扫描所有 `eslint-disable` 用法，按类别（`no-explicit-any`、`@typescript-eslint/no-unused-vars` 等）分组
2. 优先用 TypeScript 类型修复，其次用 `eslint-disable-line` 精确标注单行
3. 长期目标：消除文件级 `eslint-disable`，保留单行精确标注

### 验收标准
- [ ] 无新增 `eslint-disable`（CI 钩子检测）
- [ ] 已有 `eslint-disable` 数量减少 50%

### 工作量
- `~1d`

---

## 提案四：前端 Bundle 性能基线建立（P1）

### 现状问题
- 无 Webpack/Vite bundle size 监控
- `next build` 输出无历史趋势追踪
- 大型依赖（如 `mermaid@11`、`monaco-editor@0.53`、`framer-motion@12`）未做 tree-shaking 验证

### 建议方案
1. 接入 `@next/bundle-analyzer` 或 `source-map-explorer`
2. 在 CI 中生成 bundle 报告并与历史基线对比（`coverage:diff` 脚本已有基础）
3. 设置关键阈值告警：vendor chunk > 500KB 触发失败

### 验收标准
- [ ] CI 报告包含各 chunk 大小
- [ ] 阈值告警机制就位
- [ ] 文档化各主要依赖的 size budget

### 工作量
- `~1d`

---

## 提案五：CI/CD 阶段完整性提升（P2）

### 现状问题
当前 `npm run build` 依赖 `noEmit: true` + Next.js 内部处理，缺乏独立的类型检查阶段。

### 建议方案
在 `package.json` scripts 中增加独立 TypeScript 检查：
```json
"typecheck": "tsc --noEmit",
"prebuild": "npm run typecheck"
```
确保 build 前强制类型检查。

### 工作量
- `~0.25d`

---

## 提案汇总

| 优先级 | 提案 | 工作量 | 风险 | 收益 |
|--------|------|--------|------|------|
| P0 | 前端 TypeScript 严格化 | 3.5d | 中（迁移改动量大） | 高（减少运行时错误） |
| P1 | 测试文件纳入 TS 编译 | 0.5d | 低 | 中（提升测试质量） |
| P1 | Eslint 规范化 | 1d | 低 | 中（代码一致性） |
| P1 | Bundle 性能基线 | 1d | 低 | 中（性能可观测） |
| P2 | CI 类型检查阶段 | 0.25d | 极低 | 中（质量门禁） |

---

*本提案由 Dev Agent 生成 · 2026-03-20*
