# SPEC — Epic 2: Error Handling Normalization

**Epic ID**: EP-002  
**Epic 名称**: 错误处理规范化（Error Handling Normalization）  
**所属项目**: vibex-proposals-20260411  
**优先级**: P1  
**工时**: 1.5h  
**依赖 Epic**: 无（可与 Epic 1 并行）

---

## 1. Overview

消除代码库中的空 catch 块，确保所有异常捕获路径均有可观测的日志输出，支持生产环境静默故障的快速排查。

---

## 2. 文件修复清单

### S2.1 — `services/NotificationService.ts:50`

**问题代码**:
```typescript
} catch {
  // 空 catch，异常静默吞噬
}
```

**修复策略**: 添加结构化日志，优先使用 logger（如有），否则使用 console.error。

```typescript
// Before
} catch {
}

// After
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[NotificationService] Failed to send notification:', {
    error: message,
    timestamp: new Date().toISOString(),
  });
  // 可选：上报至 Sentry / 日志服务
  // Sentry?.captureException(err);
}
```

**验收**: catch 块包含非空日志语句。

---

### S2.2 — `vibex-fronted/tests/e2e/pages/PrototypePage.ts:126`

**问题代码**:
```typescript
} catch {
}
```

**修复策略**: 测试文件中的空 catch 通常用于容错处理，添加 console.error 记录异常以便调试。

```typescript
// Before
} catch {
}

// After
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error('[PrototypePage] Action failed:', err.message);
  }
  // 测试不应因此中断，继续执行
}
```

**验收**: catch 块包含 console.error 或类似日志输出。

---

### S2.3 — 全面扫描验证

**验证命令**:
```bash
grep -rn '} catch {' vibex-fronted/src vibex-backend/src services \
  --include='*.ts' --include='*.tsx' \
  | grep -v 'console.error\|logger\|log\|Sentry\|captureException\|report\|console.warn'
```

**要求**: 上述命令输出 0 行。

---

## 3. 验收标准

| Story | 验收条件 |
|-------|---------|
| S2.1 | NotificationService.ts catch 块包含结构化日志 |
| S2.2 | PrototypePage.ts catch 块包含错误日志 |
| S2.3 | 全量扫描无遗漏空 catch（grep 命令输出 0 行）|
| 整体 | 异常场景下，日志输出包含模块名 + 错误信息 + 时间戳 |
