# Sprint 7 Fix — Feature List

## Epic E2: Firebase Presence

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| E2-F1 | 安装 firebase@^10.0.0 依赖 | 在 vibex-frontend 添加 firebase 依赖，仅导入 firebase/database 子模块（降低 bundle size） | B1: package.json 无 firebase 依赖 | 0.5h |
| E2-F2 | 重构 presence.ts 真实 RTDB | 实现真实 Firebase RTDB 写入：initializeApp + getDatabase + ref/set + onDisconnect().remove() | B1: presence.ts 只有 mock 实现 | 0.5h |
| E2-F3 | visibilitychange 兜底清除 | beforeunload 在移动端不可靠，改为监听 visibilitychange 在 hidden 时清除 presence | B1: onDisconnect 兜底 | 0.5h |
| E4-F4 | 自动降级 mock | isFirebaseConfigured() 返回 false 时自动降级 mock 并 console.warn | B1: Firebase 凭证未配置时需优雅降级 | 0.25h |
| E2-F5 | E2E 测试覆盖真实 Firebase | presence-mvp.spec.ts 新增测试：SDK 初始化无 404、RTDB 写入验证、多 tab 同步 | B1: 当前 E2E 不测真实 Firebase | 0.5h |

**Epic E2 合计: 2.25h**

## Epic E5: Batch Export with Real DB + KV

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| E5-F1 | 创建 ZipArchiveService.ts | 从 route.ts 提取，generateAsync('blob') → ArrayBuffer → Uint8Array，return 类型为 Uint8Array | B2: Buffer API Workers 不兼容 | 0.5h |
| E5-F2 | 重构 batch-export/route.ts 真实 DB | Prisma component.findMany 查询，字段映射为 ComponentExport，移除 mock 数据 | B2: batch-export/route.ts mock 数据 | 0.5h |
| E5-F3 | KV 暂存 + 5min TTL | 使用 env.EXPORT_KV 存储 Uint8Array zip，expirationTtl: 300，返回 download URL | B2: 无 signed URL 实现 | 0.5h |
| E5-F4 | 新建 download/route.ts | KV get arrayBuffer → 一次性删除 key → 返回 application/zip 响应 | B2: download 端点缺失 | 0.5h |
| E5-F5 | 5MB size 校验 | 生成 ZIP 后校验字节数，超过 5*1024*1024 返回 413 | B2: 无 size 限制 | 0.25h |
| E5-F6 | 100 组件边界校验 | Prisma take: 100，请求 >100 个 ID 返回 400 "Max 100 components" | B2: 无组件数边界 | 0.25h |
| E5-F7 | E2E 测试覆盖真实导出 | batch-export.spec.ts 新增测试：真实 DB 导出解压验证 manifest、5min 过期验证、100 边界验证 | B2: 当前无真实 DB 测试 | 0.5h |
| E5-F8 | Wrangler EXPORT_KV binding | wrangler.json 新增 EXPORT_KV namespace 绑定 | B2: KV binding 缺失 | 0.25h |

**Epic E5 合计: 3.25h**

## Epic E1: CI TypeScript Gate

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| E1-F1 | 建立 CI tsc gate | .github/workflows/ci.yml 添加 `pnpm exec tsc --noEmit`，退出码非 0 则 CI 失败 | B3: E1-U4 CI gate 待实现 | 0.5h |
| E1-F2 | 建立 as any 基线 | grep 统计当前 as any 用法 = 59 处，写入 .tsc-baseline.json，后续 CI 检查不增加 | B3: 无基线记录 | 0.25h |
| E1-F3 | CI as any 不增加检查 | 每次 PR 检查 grep "as any" 数量 ≤ 59，超出则 CI fail | B3: 无 as any 门禁 | 0.25h |

**Epic E1 合计: 1h**

---

## 总计

| Epic | 功能点数 | 工时 |
|------|---------|------|
| E2: Firebase Presence | 5 | 2.25h |
| E5: Batch Export | 8 | 3.25h |
| E1: CI TypeScript Gate | 3 | 1h |
| **合计** | **16** | **6.5h** |

---

## Definition of Done

- [ ] `pnpm exec tsc --noEmit` 在 Sprint 7 相关文件（E1-E6）上退出码为 0
- [ ] Firebase SDK 初始化无 404，RTDB 数据写入可验证
- [ ] Batch export 真实 DB 导出解压后 manifest.json 匹配实际组件数
- [ ] KV download URL 5 分钟后返回 404
- [ ] CI tsc gate + as any 基线已上线
- [ ] 所有 E2E 测试通过
