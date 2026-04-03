# 开发检查清单: vibex-homepage-thinking-panel/impl-api-url-fix

**项目**: vibex-homepage-thinking-panel
**任务**: impl-api-url-fix
**日期**: 2026-03-13
**开发者**: Dev Agent

---

## PRD 功能点对照

### F1: API URL 修复

| 验收标准 | 实现情况 | 验证方法 |
|----------|----------|----------|
| F1.1 环境变量配置 | ✅ 已实现 | NEXT_PUBLIC_API_BASE_URL |
| F1.2 useDDDStream 修复 | ✅ 已实现 | 使用环境变量构建完整 URL |
| F1.3 跨环境兼容 | ✅ 已实现 | 开发/生产环境正确切换 |

---

## 实现位置

**文件**: `vibex-fronted/src/hooks/useDDDStream.ts`

**核心修改**:
```typescript
const apiBaseURL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api')
  : '';
const fullURL = apiBaseURL ? `${apiBaseURL}/ddd/bounded-context/stream` : '/api/ddd/bounded-context/stream';
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| NEXT_PUBLIC_API_BASE_URL | API 基础 URL | https://api.vibex.top/api |

---

## 构建验证

| 验证项 | 结果 |
|--------|------|
| Frontend build | ✅ PASSED |
| Commit | 2df917a |

---

## 下一步

- F2: ThinkingPanel 首页集成
