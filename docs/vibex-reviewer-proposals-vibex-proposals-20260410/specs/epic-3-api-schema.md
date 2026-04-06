# Spec: Epic 3 — API Schema 类型修复

**Epic**: E3  
**优先级**: P0  
**预计工时**: 0.5h  
**关联 Issue**: R-P0-4

---

## 概述

为 UI Schema API 响应建立完整的 TypeScript 类型，消除 `messages: any[]` 硬编码。

---

## Story S3.1: ui-schema.ts messages 类型定义

### 目标
修复 `ui-schema.ts:61` 的 `messages: any[]` 类型硬编码问题。

### 修改文件
- `ui-schema.ts`（具体路径待确认，建议 `src/types/ui-schema.ts` 或 `schemas/ui-schema.ts`）

### 实现

```typescript
// 修复前
export interface UISchemaResponse {
  id: string;
  messages: any[];  // ❌ 硬编码 any
  // ...
}

// 修复后
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface UISchemaResponse {
  id: string;
  messages: AIMessage[];  // ✅ 强类型
  // ...
}
```

### 验收标准

```typescript
// spec/s3.1-api-schema.spec.ts

import { readFileSync, execSync } from 'fs';
import { glob } from 'glob';

describe('S3.1 UI Schema 类型修复', () => {
  const schemaFile = glob.sync('**/ui-schema.ts', { ignore: ['node_modules/**'] })[0];

  it('AIMessage 接口已定义', () => {
    const content = readFileSync(schemaFile, 'utf-8');
    expect(content).toMatch(/interface AIMessage/);
  });

  it('无 messages: any[]', () => {
    const content = readFileSync(schemaFile, 'utf-8');
    expect(content).not.toMatch(/messages:\s*any\[\]/);
  });

  it('messages 字段使用 AIMessage[]', () => {
    const content = readFileSync(schemaFile, 'utf-8');
    expect(content).toMatch(/messages:\s*AIMessage\[\]/);
  });

  it('tsc 编译无错误', () => {
    const result = execSync(`npx tsc --noEmit "${schemaFile}"`, { encoding: 'utf-8' });
    expect(result).toBe('');
  });
});

describe('E3 集成验收', () => {
  it('所有 schema 文件无 any[]', () => {
    const schemaFiles = glob.sync('**/*schema*.ts', { ignore: ['node_modules/**'] });
    for (const file of schemaFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/: any\[\]/);
    }
  });
});
```

---

## 变更范围

| 文件 | 行号 | 原类型 | 修复后 |
|------|------|--------|--------|
| ui-schema.ts | 61 | `messages: any[]` | `messages: AIMessage[]` |
