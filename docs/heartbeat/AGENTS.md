# 开发约束 (AGENTS.md): VibeX Sprint 8

> **项目**: heartbeat (VibeX Sprint 8)
> **阶段**: design-architecture
> **版本**: v1.1
> **日期**: 2026-04-25
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **前端** | Next.js 15.x + TypeScript + CSS Modules |
| **后端** | Hono 4.x + Prisma 5.x |
| **测试** | Playwright (E2E) + Vitest/Jest (单元) |
| **类型** | TypeScript `strict: true`，**禁止 `as any`** |
| **Firebase** | 需 P002-S1 可行性评审通过后方可引入 |

---

## 2. P001 TypeScript 约束

### ✅ 允许修改
| 文件 | 操作 |
|------|------|
| `vibex-backend/package.json` | 添加 @cloudflare/workers-types |
| `.github/workflows/test.yml` | 添加 tsc gate job |

### ❌ 禁止操作
- **不要** 在 `tsconfig.json` 中降低 `strict` 级别
- **不要** 使用 `// @ts-ignore` 绕过错误
- **不要** 使用 `as any` 掩盖类型问题
- CI tsc gate 触发条件：**push 到 main/develop**，不在 PR 阶段阻塞

### CI tsc gate 配置规范
```yaml
typecheck:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: cd vibex-backend && pnpm install --frozen-lockfile
    - run: cd vibex-backend && pnpm exec tsc --noEmit
    - run: cd vibex-fronted && pnpm install --frozen-lockfile
    - run: cd vibex-fronted && pnpm exec tsc --noEmit
```

---

## 3. P002 Firebase 约束

### ✅ 允许新建
| 文件 | 描述 |
|------|------|
| `vibex-backend/src/lib/firebase.ts` | Firebase Admin SDK 初始化封装 |
| `vibex-backend/src/lib/sse-bridge.ts` | SSE bridge 实现 |
| `vibex-backend/src/routes/presence-stream.ts` | SSE 端点路由 |
| `vibex-fronted/src/components/dashboard/AnalyticsWidget.tsx` | Analytics Widget 组件 |

### ❌ 禁止操作
- **不要** 在 P002-S1 可行性评审完成前引入 Firebase SDK 依赖
- **不要** 在 `package.json` 中添加 Firebase SDK 除非 E2-U1 结论为"可行"
- SSE bridge **必须** 处理客户端断开（`AbortSignal`），否则会造成连接泄漏
- Analytics Widget 必须实现**四态**：加载中 / 有数据 / 空数据 / 加载失败

### SSE Bridge 冷启动 Fallback 规范（TR-3）

SSE bridge 必须处理 Cloudflare Workers 冷启动场景：

```typescript
// sse-bridge.ts
const SSE_CONNECT_TIMEOUT = 5000; // 5s 冷启动超时

async function getPresenceStream(req: Request): Promise<Response> {
  const controller = new ReadableStreamDefaultController();
  
  try {
    const firebase = await Promise.race([
      initializeFirebaseAdmin(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('COLD_START_TIMEOUT')), SSE_CONNECT_TIMEOUT)
      )
    ]);
    // SSE 正常推送...
  } catch (e) {
    if (e.message === 'COLD_START_TIMEOUT' || e.message === 'FIREBASE_UNAVAILABLE') {
      // Fallback: 回退到现有 REST Presence API
      return fetch('/api/v1/presence');
    }
    controller.error(e);
  }
}
```

### Analytics Widget 四态规范

```tsx
// 加载中：骨架屏占位
{status === 'loading' && <AnalyticsSkeleton />}

// 有数据：正常展示
{status === 'success' && data.length > 0 && <AnalyticsCards data={data} />}

// 空数据：引导文案
{status === 'success' && data.length === 0 && (
  <div className="empty-state">暂无数据，开始使用 VibeX 后数据会自动生成</div>
)}

// 加载失败：错误提示 + 重试按钮
{status === 'error' && (
  <div className="error-state">
    数据加载失败，请检查网络连接
    <button onClick={refetch}>重试</button>
  </div>
)}
```

---

## 4. P003 Import/Export 约束

### ✅ 允许新建
| 文件 | 描述 |
|------|------|
| `vibex-fronted/e2e/import-export/json-roundtrip.spec.ts` | JSON round-trip E2E |
| `vibex-fronted/e2e/import-export/yaml-roundtrip.spec.ts` | YAML round-trip E2E |
| `vibex-fronted/e2e/import-export/filesize-limit.spec.ts` | 5MB 文件限制 E2E |
| `vibex-fronted/e2e/teams/teams-api.spec.ts` | Teams API E2E |

### 5MB 文件限制规范
```tsx
// ImportForm.tsx
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function handleFileChange(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    setError('文件大小超出 5MB 限制，请拆分文件或压缩后再试');
    return;
  }
  setError(null);
  // 继续上传流程
}
```

### Round-trip 测试规范
- **JSON**：使用 `JSON.stringify(parse(exported))` 对比序列化一致性
- **YAML**：重点验证 `:#|` 等特殊字符无额外转义
- **测试数据**：使用固定的 fixture JSON/YAML 文件，禁止依赖动态生成数据

### ❌ 禁止操作
- **不要** 在 E2E 测试中假设特定用户数据存在
- **不要** 绕过前端 5MB 限制（必须前端 + 后端双重校验）
- **不要** 在 round-trip 测试中删除生产数据（使用隔离的测试账户）

---

## 5. P004 PM 质量门禁约束

### ✅ 允许修改
| 文件 | 操作 |
|------|------|
| `vibex/docs/coord/review-checklist.md` | 新增神技检查点 |
| `vibex/docs/templates/prd-template.md` | 新增"本期不做"+神技指引 |
| `vibex/docs/templates/spec-template.md` | 新增四态表/Design Token/情绪地图引用 |

### Coord 评审检查点清单

```markdown
## PM 神技检查点

- [ ] **四态表**：提案是否定义了四态（默认/加载中/有数据/空状态/错误）
- [ ] **Design Token**：提案是否定义了 CSS 变量体系，无硬编码颜色/字号
- [ ] **情绪地图**：提案是否描述了用户情绪路径和兜底机制
```

### ❌ 禁止操作
- **不要** 修改现有 PRD/SPEC 模板结构，只新增章节
- **不要** 删除现有的评审检查点
- 模板更新后，**必须**告知全体团队成员新检查点

---

## 6. 通用约束

### 代码规范
- 所有 commit message 遵循 `type(scope): description` 格式
- `type`: `feat` | `fix` | `chore` | `docs` | `test` | `refactor`
- **禁止** 在代码中留下 `TODO` / `FIXME` 不注明 issue 链接

### 测试规范
- Playwright E2E 测试文件放在 `vibex-fronted/e2e/` 目录
- 测试描述使用中文，清晰描述测试场景
- 每个 E2E 测试文件必须包含 `test.describe` 标题

### 性能约束
- Firebase SDK init 时间 < 500ms（E2-U2 验证）
- Presence 更新延迟 < 1s（E2-U3 验证）
- 5MB 文件前端校验 < 10ms
- Analytics Widget 骨架屏超时 3s 显示"加载中"

### 安全约束
- API Key 不得硬编码，必须从环境变量读取
- Firebase credentials 必须使用 `FIREBASE_*` 环境变量
- 所有用户输入必须经过 Zod schema 验证

---

## 7. 文件操作速查表

| 任务 | 涉及目录 |
|------|----------|
| P001 | `vibex-backend/` `.github/workflows/` |
| P002 | `vibex-backend/src/lib/` `vibex-fronted/src/components/dashboard/` |
| P003 | `vibex-fronted/e2e/import-export/` `vibex-fronted/e2e/teams/` |
| P004 | `vibex/docs/coord/` `vibex/docs/templates/` |
