# Next.js 安全漏洞修复报告

**时间**: 2026-03-19 12:47 GMT+8  
**项目**: vibex/landing-page  
**修复人**: tester  

## 漏洞信息

| 字段 | 值 |
|------|-----|
| **严重程度** | 高危 (High) |
| **受影响版本** | Next.js 9.5.0 - 16.1.6 |
| **问题类型** | DoS / HTTP请求反序列化 / 缓存耗尽 / HTTP请求走私 |

### 具体CVE
1. **GHSA-9g9p-9gw9-jx7f** — Image Optimizer remotePatterns 配置导致的 DoS
2. **GHSA-h25m-26qc-wcjf** — 不安全的 React Server Components 的 HTTP 请求反序列化 DoS
3. **GHSA-3x4c-7xq6-9pq8** — next/image 无限磁盘缓存增长
4. **GHSA-ggv3-7p47-pfv8** — rewrites 中的 HTTP 请求走私

## 修复方案

```bash
npm audit fix --force
```

- Next.js: `^14.0.0` → `^16.2.0`
- SemVer: 主版本升级（Breaking Change，已确认构建正常）

## 验证结果

| 检查项 | 状态 |
|--------|------|
| npm audit | ✅ 0 vulnerabilities |
| npm run build | ✅ 构建成功 |
| TypeScript 编译 | ✅ 3.4s |
| 静态页面生成 | ✅ 3/3 页面 |

## 遗留项

- ⚠️ Breaking Change: Next.js 16.2.0 为主版本升级，建议在 staging 环境充分测试后再合并主分支
- ⚠️ 建议 review `next.config.ts` 确保无废弃 API 使用
