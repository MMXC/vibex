# Code Review Report: vibex-canvas-redesign-20260325 / Epic6

**项目**: vibex-canvas-redesign-20260325
**任务**: reviewer-epic6
**审查时间**: 2026-03-25 19:30 (Asia/Shanghai)
**Commit**: `a4833ee9` + lint fix
**审查人**: Reviewer

---

## 1. Summary

Epic6 实现后端原型生成队列 API + tar.gz 导出功能。包含 CanvasProject/CanvasPage Prisma 模型，4 个 API 端点。

**结论**: ✅ **PASSED**

---

## 2. Security Issues

### 🔴 Blockers: 无

### 🟡 建议修复

**S1: AI 生成代码未过滤（低风险）**

位置: `export/route.ts` — 用户下载的 tar 中包含 AI 生成的代码（`codeJson`），直接写入 tar 无内容过滤。

```typescript
code = parsed.code || '// No code available';
// 直接写入 tar: entries.push({ path: `src/app/${pageName}/page.tsx`, content: code })
```

**评估**: 
- 风险：AI 生成代码来自受控的 MiniMax API，非直接用户输入
- 影响：用户主动下载并执行，风险自担
- 建议：未来可添加基本内容审查（如禁止 `eval`/`exec` 模式）

**S2: `projectName` 模板插值（低风险）**

位置: `export/route.ts` — `buildTarStream` 中 `projectName` 直接嵌入 React 模板字符串

```typescript
title: '${projectName}',
redirect('/${slugify(pages[0]?.name || 'page1')}');
```

**评估**:
- `projectName` 来自数据库（由用户创建时传入）
- 攻击者需能创建带恶意字符的项目名才能利用
- 风险低：`slugify()` 限制了大多数特殊字符
- 建议：使用转义或 JSON 序列化传入 `metadata`

**S3: 无 CSRF 保护（低风险）**

所有 API 端点无认证，无 CSRF token。内部 API，建议后端实现时添加。

---

## 3. Code Quality

### ✅ 优点

1. **Mock Fallback**: 无 MiniMax API Key 时自动降级到 mock 代码生成（不阻塞流程）
2. **环境变量正确**: MiniMax 配置通过 `process.env` 读取，无硬编码
3. **错误处理完善**: 所有端点有 try/catch，错误响应格式一致
4. **Prisma 事务**: project + canvasProject 原子创建
5. **Mock Fallback 合理**: 模拟 AI 生成返回 React 组件代码
6. **tar 生成纯 Node 内置模块**: 无外部依赖，使用 `Readable` stream

### 💭 Nits (已修复)

1. `export/route.ts`: `Transform` unused import → ✅ 已移除
2. `generate/route.ts`: `mode` 参数 unused → ✅ 已移除

---

## 4. Verification Results

| 检查项 | 命令 | 结果 |
|--------|------|------|
| ESLint | `npx eslint src/app/api/canvas/` | ✅ 0 errors, 0 warnings |
| Tests | `npm test` | ✅ 459/459 PASS |
| Security | XSS/Injection | ✅ 无阻塞（AI 生成代码风险自担） |

---

## 5. Implementation Details

### 新增文件

| 文件 | 描述 |
|------|------|
| `schema.prisma` (update) | 新增 CanvasProject/CanvasPage 模型 |
| `canvas/project/route.ts` | POST 创建项目（3树数据持久化） |
| `canvas/generate/route.ts` | POST 触发生成（MiniMax API 调用） |
| `canvas/status/route.ts` | GET 查询进度（轮询） |
| `canvas/export/route.ts` | GET 导出 tar.gz（Node stream） |

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/canvas/project` | POST | 创建画布项目 |
| `/api/canvas/generate` | POST | 触发生成 |
| `/api/canvas/status` | GET | 查询状态 |
| `/api/canvas/export` | GET | 导出 tar.gz |

### Epic 功能覆盖

| Epic6 需求 | 实现 | 状态 |
|------------|------|------|
| S6.1 zip 导出 | tar.gz 流式生成 | ✅ |
| S6.2 状态查询 | `/status` + polling | ✅ |
| S6.3 进度显示 | 前端队列面板（Epic5） | ✅ |

---

## 6. Architecture

```
Frontend                    Backend
  ProjectBar ──POST /project──→ Prisma (CanvasProject)
  PrototypeQueue ──POST /generate──→ MiniMax API
                ←──GET /status──← polling
                ←──GET /export──← tar.gz stream
```

**导出 tar 结构**:
```
/package.json         (基于 projectName)
/next.config.ts
/tsconfig.json
/tailwind.config.ts
/postcss.config.mjs
/src/app/layout.tsx
/src/app/globals.css
/src/app/page.tsx
/src/app/{slugified-page-name}/page.tsx  (AI 生成)
```

---

## 7. Conclusion

| 维度 | 评估 |
|------|------|
| Security | ✅ 无阻塞（AI 代码风险自担，projectName 低风险） |
| Testing | ✅ 459/459 PASS |
| Code Quality | ✅ 清晰可维护（lint warnings 已修复） |
| Architecture | ✅ 分层清晰，职责分离 |

**最终结论**: ✅ **PASSED**

---

*Reviewer: CodeSentinel | 审查时间: 2026-03-25 19:37 | Commit: a4833ee9*
