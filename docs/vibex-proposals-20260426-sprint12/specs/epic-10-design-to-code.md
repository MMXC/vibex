# Spec — E10: 设计稿自动生成组件代码

## 核心函数签名

```typescript
// frontend/src/lib/codeGenerator.ts

interface GeneratedFiles {
  'types.d.ts': string
  'Component.tsx': string
  'Component.module.css': string
  'index.ts': string
}

function generateTypeDefinitions(flow: Flow): string
function generateComponentSkeleton(flow: Flow): GeneratedFiles
function packageAsZip(files: GeneratedFiles, flowName: string): Buffer
```

## S10-S1: TypeScript 类型生成

```typescript
// 输出: types.d.ts
// 示例
export interface Flow {
  id: string
  name: string
  nodes: CanvasNode[]
  chapters: Chapter[]
  createdAt: string
  updatedAt: string
}

export type CanvasNodeType = 'chapter' | 'requirement' | 'context' | 'flow' | 'api' | 'business-rules' | 'image' | 'text' | 'connector'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface Chapter {
  id: string
  type: 'requirement' | 'context' | 'flow' | 'api' | 'business-rules'
  content: string
  metadata?: Record<string, unknown>
}
```

## S10-S2: TSX 骨架 + CSS Module

```typescript
// Component.tsx 模板
// 使用 DESIGN.md 设计变量（禁止硬编码）
export interface Props {
  className?: string
}

// TODO: {node.label} component
// TODO: Add business logic here
export default function {ComponentName}({ className }: Props) {
  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* TODO: Implement component structure */}
    </div>
  )
}
```

```css
/* Component.module.css 模板 */
/* 使用 DESIGN.md CSS 变量 */
.container {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-4, 16px);
  background-color: var(--color-bg-secondary, #12121a);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-primary, #f0f0f5);
  font-family: var(--font-sans, system-ui, sans-serif);
}
```

```typescript
// index.ts
export { default } from './Component'
export type { Props } from './Component'
```

## 验证规则

```typescript
// types.d.ts 语法正确性
function validateTypeDefinitions(code: string): boolean {
  // 使用 tsc --noEmit 或 @typescript-eslint/parser
  // 返回是否可解析
}

// TSX 骨架无硬编码颜色
function validateNoHardcodedColors(code: string): boolean {
  const forbidden = [/#([0-9a-fA-F]{3}){1,2}/, /rgba?\(/, /rgb\(/]
  return !forbidden.some(r => r.test(code))
}
```

## S10-S3: ZIP 下载

```typescript
// frontend/src/lib/downloadUtils.ts
import JSZip from 'jszip'

async function downloadComponentZip(flow: Flow): Promise<void> {
  const files = generateComponentSkeleton(flow)
  const zip = new JSZip()
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${flow.name.replace(/\s+/g, '-').toLowerCase()}-generated-${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
```

## 页面集成

```typescript
// vibex-frontend/src/components/Canvas/ToolPanel.tsx
// 添加按钮
<Button
  onClick={() => openModal('code-generator')}
  icon={<CodeIcon />}
  label="生成代码"
/>

// CodeGeneratorModal.tsx
// 1. 加载 Canvas Flow 数据
// 2. 调用 generateComponentSkeleton
// 3. 预览文件列表（可切换查看每个文件）
// 4. 点击「下载 ZIP」触发下载
```

## E2E 测试

```typescript
// tests/e2e/design-to-code.spec.ts

it('E10: ZIP download contains correct files', async () => {
  await page.goto('/canvas/test-flow')
  await page.click('[data-testid="generate-code-btn"]')
  await page.waitForSelector('[data-testid="code-generator-modal"]')
  
  // preview each file
  await page.click('text=types.d.ts')
  expect(page.locator('[data-testid="file-preview"]')).toContainText('interface Flow')
  
  await page.click('text=Component.tsx')
  expect(page.locator('[data-testid="file-preview"]')).toContainText('export default function')
  
  // download
  const downloadPromise = page.waitForEvent('download')
  await page.click('[data-testid="download-zip-btn"]')
  const download = await downloadPromise
  
  // verify zip contents
  const path = await download.path()
  const zip = await JSZip.loadAsync(fs.readFileSync(path))
  expect(Object.keys(zip.files)).toContain('types.d.ts')
  expect(Object.keys(zip.files)).toContain('Component.tsx')
  expect(Object.keys(zip.files)).toContain('Component.module.css')
  expect(Object.keys(zip.files)).toContain('index.ts')
})
```

## 依赖

- `jszip` — npm，添加到 frontend
- `@types/jszip` — npm dev dependency
