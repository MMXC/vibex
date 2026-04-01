# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas.spec.ts >> Canvas Accessibility >> canvas page has zero critical violations
- Location: vibex-fronted/tests/a11y/canvas.spec.ts:6:7

# Error details

```
Error: Found 2 critical violations

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 2
Received array:  [{"description": "Ensure each HTML document contains a non-empty <title> element", "help": "Documents must have <title> element to aid in navigation", "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/document-title?application=playwright", "id": "document-title", "impact": "serious", "nodes": [{"all": [], "any": [{"data": null, "id": "doc-has-title", "impact": "serious", "message": "Document does not have a non-empty <title> element", "relatedNodes": []}], "failureSummary": "Fix any of the following:
  Document does not have a non-empty <title> element", "html": "<html>", "impact": "serious", "none": [], "target": ["html"]}], "tags": ["cat.text-alternatives", "wcag2a", "wcag242", "TTv5", "TT12.a", "EN-301-549", "EN-9.2.4.2", "ACT", "RGAAv4", "RGAA-8.5.1"]}, {"description": "Ensure every HTML document has a lang attribute", "help": "<html> element must have a lang attribute", "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/html-has-lang?application=playwright", "id": "html-has-lang", "impact": "serious", "nodes": [{"all": [], "any": [{"data": {"messageKey": "noLang"}, "id": "has-lang", "impact": "serious", "message": "The <html> element does not have a lang attribute", "relatedNodes": []}], "failureSummary": "Fix any of the following:
  The <html> element does not have a lang attribute", "html": "<html>", "impact": "serious", "none": [], "target": ["html"]}], "tags": ["cat.language", "wcag2a", "wcag311", "TTv5", "TT11.a", "EN-301-549", "EN-9.3.1.1", "ACT", "RGAAv4", "RGAA-8.3.1"]}]
```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - link "Next.js 16.2.0 (stale) Turbopack" [ref=e16] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e17]
            - generic "There is a newer version (16.2.2) available, upgrade recommended!" [ref=e19]: Next.js 16.2.0 (stale)
            - generic [ref=e20]: Turbopack
          - img
      - dialog "Build Error" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Build Error
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - link "Go to related documentation" [ref=e34] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/building-your-application/rendering/client-components
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: You’re importing a class component. It only works in a Client Component but none of its parents are marked with "use client", so they're Server Components by default.
          - generic [ref=e49]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e56]: ./vibex/vibex-fronted/src/components/common/AppErrorBoundary.tsx (1:17)
              - button "Open in editor" [ref=e57] [cursor=pointer]:
                - img [ref=e59]
            - generic [ref=e62]:
              - generic [ref=e63]:
                - text: "You’re importing a class component. It only works in a Client Component but none of its parents are marked with \"use client\", so they're Server Components by default. Learn more:"
                - link "https://nextjs.org/docs/app/building-your-application/rendering/client-components" [ref=e64] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/building-your-application/rendering/client-components
              - text: ">"
              - generic [ref=e65]: 1 |
              - text: import React
              - generic [ref=e66]: ", {"
              - text: Component
              - generic [ref=e67]: ","
              - text: ErrorInfo
              - generic [ref=e68]: ","
              - text: ReactNode
              - generic [ref=e69]: "}"
              - text: from 'react'
              - generic [ref=e70]: ;
              - generic [ref=e71]: "|"
              - text: ^^^^^^^^^
              - generic [ref=e72]: 2 |
              - generic [ref=e73]: 3 |
              - text: interface Props
              - generic [ref=e74]: "{"
              - generic [ref=e75]: 4 |
              - generic [ref=e76]: "children:"
              - text: ReactNode
              - generic [ref=e77]: "; Ecmascript file had an error Generated code of loaders [next/dist/build/babel/loader] transform of file content of vibex/vibex-fronted/src/components/common/AppErrorBoundary.tsx: ./vibex/vibex-fronted/src/components/common/AppErrorBoundary.tsx:1:17"
              - text: ">"
              - generic [ref=e78]: 1 |
              - text: import React
              - generic [ref=e79]: ", {"
              - text: Component
              - generic [ref=e80]: "}"
              - text: from 'react'
              - generic [ref=e81]: ;
              - generic [ref=e82]: "|"
              - text: ^^^^^^^^^
              - generic [ref=e83]: 2 |
              - text: import
              - generic [ref=e84]: "{ jsx"
              - text: as
              - generic [ref=e85]: _jsx, jsxs
              - text: as
              - generic [ref=e86]: "_jsxs }"
              - text: from "react/jsx-runtime"
              - generic [ref=e87]: ;
              - generic [ref=e88]: 3 |
              - text: export default class AppErrorBoundary extends Component
              - generic [ref=e89]: "{"
              - generic [ref=e90]: 4 |
              - generic [ref=e91]: "constructor(props) { Import trace: Server Component: ./vibex/vibex-fronted/src/components/common/AppErrorBoundary.tsx ./vibex/vibex-fronted/src/app/layout.tsx"
        - generic [ref=e92]: "1"
        - generic [ref=e93]: "2"
    - generic [ref=e98] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e99]:
        - img [ref=e100]
      - button "Open issues overlay" [ref=e104]:
        - generic [ref=e105]:
          - generic [ref=e106]: "0"
          - generic [ref=e107]: "1"
        - generic [ref=e108]: Issue
  - alert [ref=e109]
```

# Test source

```ts
  1  | // @ci-blocking
  2  | import { test, expect } from '@playwright/test';
  3  | import { runAxe } from './helpers';
  4  | 
  5  | test.describe('Canvas Accessibility', () => {
  6  |   test('canvas page has zero critical violations', async ({ page }) => {
  7  |     await page.goto('/canvas');
  8  |     await page.waitForLoadState('networkidle');
  9  | 
  10 |     const result = await runAxe(page);
  11 | 
  12 |     expect(
  13 |       result.criticalViolations,
  14 |       `Found ${result.criticalViolations.length} critical violations`
> 15 |     ).toHaveLength(0);
     |       ^ Error: Found 2 critical violations
  16 |   });
  17 | });
  18 | 
```