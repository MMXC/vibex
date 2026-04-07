# Spec: ADR-004 前端安全加固

**ADR**: ADR-004  
**状态**: 待实施  
**Sprint**: Sprint 0（L1立即）

---

## 1. 背景

**问题**: DOMPurify 间接依赖漏洞，可能导致 XSS 攻击。

---

## 2. 三层防护体系

```
L1: overrides (立即)     → package.json 锁定版本
L2: 输入验证 (Sprint 2)  → Zod safeParse + fallback
L3: CSP (规划)           → Content-Security-Policy header
```

---

## 3. L1: package.json overrides（立即执行）

### 3.1 实现

```json
{
  "overrides": {
    "dompurify": "3.1.6",
    "isomorphic-dompurify": {
      "dompurify": "3.1.6"
    }
  }
}
```

### 3.2 验证步骤

```bash
# 1. 更新 package.json overrides
# 2. 运行 npm install
npm install

# 3. 验证版本
npm list dompurify

# 4. 验证无漏洞
npm audit

# 5. 验证 DOMPurify 功能正常
npm run build
```

---

## 4. L2: 输入验证 (Sprint 2)

### 4.1 Zod safeParse 实现

```typescript
// utils/sanitize.ts
import { z } from 'zod';
import DOMPurify from 'dompurify';

const NodeSchema = z.object({
  id: z.string(),
  name: z.string().max(500),
  description: z.string().max(10000).optional(),
  type: z.enum(['boundedContext', 'flow', 'component']),
});

export const safeParseNode = (input: unknown): NodeSchema.Type | null => {
  const result = NodeSchema.safeParse(input);
  if (!result.success) {
    console.warn('[sanitize] Invalid node data:', result.error);
    return null;
  }
  return result.data;
};

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
    ALLOWED_ATTR: [],
  });
};
```

### 4.2 Fallback 策略

```typescript
// 解析失败时的降级处理
const parseNode = (input: unknown): NodeSchema.Type => {
  const result = safeParseNode(input);
  if (result) return result;
  
  // Fallback: 返回安全的默认值
  return {
    id: crypto.randomUUID(),
    name: 'Unknown Node',
    type: 'boundedContext',
  };
};
```

---

## 5. L3: CSP (规划中)

### 5.1 CSP Header 规划

```nginx
# Nginx/反向代理配置
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.vibex.com;
" always;
```

---

## 6. 验收标准

### L1 (Sprint 0)
- [ ] `package.json` overrides 已添加
- [ ] `npm install` 成功
- [ ] `npm audit` 无 DOMPurify 相关漏洞
- [ ] 构建正常

### L2 (Sprint 2)
- [ ] Zod schema 定义完成
- [ ] E5 文件使用 safeParse
- [ ] 解析失败时有 fallback
- [ ] 单元测试覆盖

### L3 (规划中)
- [ ] CSP header 规划文档
- [ ] 测试环境验证

---

## 7. DoD

- [ ] L1: overrides 立即执行，CI 通过
- [ ] L2: Sprint 2 执行，测试覆盖
- [ ] L3: 规划完成，待实施
