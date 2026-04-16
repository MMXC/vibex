# IMPLEMENTATION_PLAN — vibex-sprint-0415

**项目**: vibex-sprint-0415 — DDS 动态路由与 output:export 冲突修复  
**产出日期**: 2026-04-16  
**规划人**: architect  
**状态**: active

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: DDS 路由构建修复 | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |
| E2: 部署适配 | E2-U1 | 0/1 | E2-U1 |

---

## E1: DDS 路由构建修复

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 修改 package.json build 脚本 | ✅ | — | `package.json` 的 `build` 字段包含 `NEXT_OUTPUT_MODE=standalone`；`wrangler.toml` 不含 `pages_build_output_dir` |
| E1-U2 | 验证构建成功 | ✅ | E1-U1 | `pnpm build` 退出码为 0；产物 `.next/standalone` 存在；DDS 路由标记为 `ƒ Dynamic` |

### E1-U1 详细说明

**文件变更**: 
- `vibex-fronted/package.json`
- `vibex-fronted/wrangler.toml`

**实现步骤**:
1. 修改 `package.json` 的 `scripts.build` 字段：将 `"build": "next build"` 改为 `"build": "NEXT_OUTPUT_MODE=standalone next build"`
2. 修改 `wrangler.toml`：将 `pages_build_output_dir = "./out"` 行删除（或注释），使 wrangler 自动检测 `.next/standalone` 产物目录
3. **保留** `src/app/api/v1/dds/[...path]/route.ts` 中的 `export const dynamic = "force-static"` 和 `generateStaticParams() { return []; }`（standalone 模式下无害，作为静态分析声明保留）

**⚠️ 强制合入同一 PR**：package.json + wrangler.toml 必须同时修改。若单独合并 package.json 而 wrangler.toml 未更新，`wrangler deploy` 会从 `./out` 目录（静态 Pages 产物）部署，而非 `.next/standalone/`。

**风险**: 无。`next.config.ts` 第 25 行已有条件逻辑 `output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : 'export'`，配置接口已预留。

**Verification**:
```bash
grep 'NEXT_OUTPUT_MODE=standalone' package.json
grep 'pages_build_output_dir' wrangler.toml  # 应无输出
```

---

### E1-U2 详细说明

**文件变更**: 无代码变更，执行构建验证

**实现步骤**:
1. 在 `vibex-fronted` 目录执行 `NEXT_OUTPUT_MODE=standalone pnpm build`
2. 确认退出码为 0
3. 确认 `.next/standalone` 目录存在
4. 确认 `.next/server/app/api/v1/dds/[...path]` 存在且标记为 `ƒ Dynamic`
5. 确认 `feedback/route.ts` 和 `quality/metrics/route.ts` 产物不受影响

**风险**: 无回归。其他 API 路由（feedback、quality/metrics）均为非 catch-all 路由，standalone 模式不影响。

**Verification**:
```bash
# 构建退出码
NEXT_OUTPUT_MODE=standalone pnpm build && echo "BUILD_OK"

# 产物检查
ls .next/standalone/server/app/api/v1/dds/
ls .next/standalone/server/app/api/v1/feedback/
ls .next/standalone/server/app/api/v1/quality/metrics/
```

---

## E2: 部署适配

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | 更新部署文档（standalone + Workers 部署） | ✅ | E1-U2 | `docs/output/deployment-checklist.md` 包含 standalone 构建步骤 + Workers 部署命令 |

### E2-U1 详细说明

**文件变更**: `docs/output/deployment-checklist.md`

**现状问题**:
- deployment-checklist.md 仍描述 Pages 静态部署流程，未提及 standalone + Workers
- **wrangler.toml 已随 E1-U1 一起修改**（删除了 `pages_build_output_dir` 行），此处只需更新文档

**实现步骤**:
1. 在 deployment-checklist.md 添加 standalone 构建 + Workers 部署章节

```markdown
## 三、standalone 构建 + Workers 部署（推荐）

### 3.1 前端 standalone 构建
```bash
cd vibex-fronted
NEXT_OUTPUT_MODE=standalone pnpm build
```
- 产物输出到 `.next/standalone/`

### 3.2 Workers 部署
```bash
wrangler deploy
# 或指定环境
wrangler deploy --env production
```

### 3.3 注意事项
- standalone 构建产物已包含 Node.js 兼容层，可直接部署为 Cloudflare Worker
- `.next/standalone/server/` 下的文件为运行时需要，不需要全部上传（wrangler 自动处理）
- 环境变量通过 `wrangler secret put` 配置
```

**风险**: 低。Cloudflare Workers + Next.js standalone 是官方支持的组合。

**Verification**:
```bash
grep -c "standalone" docs/output/deployment-checklist.md  # 应 >= 3
grep -c "Worker" docs/output/deployment-checklist.md     # 应 >= 2
```

---

## 回滚计划

| Unit | 回滚方式 |
|------|---------|
| E1-U1 | `git checkout package.json wrangler.toml` |
| E1-U2 | 无代码变更，无需回滚 |
| E2-U1 | `git checkout docs/output/deployment-checklist.md` |

---

## 依赖关系图

```
E1-U1 (package.json 修改)
  ↓
E1-U2 (构建验证) —————┐
  ↓                    ↓
E2-U1 (部署文档更新) ← (E1-U2 通过后解锁)
```

---

## 执行顺序

1. **E1-U1** → 修改 package.json build 脚本
2. **E1-U2** → 执行 `NEXT_OUTPUT_MODE=standalone pnpm build` 验证
3. **E2-U1** → 更新部署文档 + wrangler.toml

预计总工时: 约 40 分钟（E2-U1 文档更新占 30 分钟）

---

*Plan 版本: v1.0 | 最后更新: 2026-04-16*
