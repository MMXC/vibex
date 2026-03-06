# Static Export Guide

> Guidelines for ensuring Next.js routes are compatible with static export (`next export`)

## Overview

When deploying to static hosting (e.g., Cloudflare Pages, Vercel), certain Next.js routes cannot be statically exported because they require runtime data.

## Problem

Routes with dynamic patterns will fail at build time when using static export:

```
Error: Dynamic route 'project/[id]' cannot be exported as a static page
```

## Routes Classification

### ✅ Static Compatible Routes

These routes can be statically exported:

| Route        | Description       |
| ------------ | ----------------- |
| `/`          | Landing page      |
| `/landing`   | Marketing landing |
| `/templates` | Template gallery  |
| `/changelog` | Version history   |
| `/pagelist`  | Page listing      |

### ⚠️ Dynamic Routes (NOT for static export)

These routes require runtime data and will fail with static export:

| Route               | Pattern    | Reason                   |
| ------------------- | ---------- | ------------------------ |
| `/project/[id]`     | `[id]`     | Project ID from database |
| `/requirements/new` | User input | Form submission          |
| `/confirm/*`        | User flow  | Dynamic state            |
| `/api/*`            | API routes | Server-side only         |

## Solutions

### Solution 1: Dynamic Import with SSR

For routes that need runtime data, ensure they're not prerendered:

```typescript
// app/project/[id]/page.tsx
export const dynamic = 'force-dynamic';

export default function ProjectPage({ params }) {
  // This will be rendered on-demand
}
```

### Solution 2: Check Script

Run the check script before building:

```bash
node scripts/check-static-export.js
```

### Solution 3: ESLint Rule

Add the custom ESLint rule to catch issues early:

```javascript
// eslint.config.mjs
import noStaticExport from './eslint-rules/no-static-export.js';

export default [
  {
    rules: {
      'no-static-export': 'error',
    },
  },
];
```

## CI Integration

Add to your build pipeline:

```yaml
# .github/workflows/build.yml
- name: Check static export compatibility
  run: node scripts/check-static-export.js
```

## References

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
