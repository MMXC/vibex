# Spec: Epic 2 — 404 资源修复（Bug-2 修复）

**Epic**: Epic 2: 404 资源修复
**Bug**: Bug-2: 4 个 404 资源请求
**Baseline**: `79ebe010`
**Status**: ⚠️ **待 Story 2.1 gstack 验证后才能填写具体修复方案**

---

## 1. 背景与目标

### 问题描述

页面加载后 1.5s 内有 4 个资源返回 HTTP 404，导致：
- UI 资源（图片/图标/字体）可能缺失
- 用户体验不完整

### 当前已知信息（待 gstack 验证）

| 潜在 404 来源 | 路径 | 分析 | 确认状态 |
|---------------|------|------|----------|
| 模板路径不一致 | `/templates/ecommerce/` vs `/templates/e-commerce/` | `template-data.ts` 引用 `ecommerce/`（无连字符），但 `public/templates/` 下存在 `e-commerce/`（有连字符）| ⚠️ 待验证 |
| Google Fonts | `fonts.googleapis.com` / `fonts.gstatic.com` | 字体文件在某些地区/网络环境可能 404 | ⚠️ 待验证 |
| Sentry / Firebase SDK | `*.sentry.io` / `*.firebaseio.com` | 外部 SDK 加载可能超时或 404 | ⚠️ 待验证 |
| 动态 import | `@/lib/canvas/templateLoader` | 路径解析可能有问题 | ⚠️ 待验证 |

### 目标

定位并修复所有 404 资源请求，保证页面加载完整性。

---

## 2. Story 2.1: gstack 验证（前置条件）

### 目标

使用 gstack browser 访问 `/canvas`，捕获所有 404 网络请求，记录具体 URL。

### 验证步骤

```bash
# 1. 访问 canvas 页面
gstack goto /canvas

# 2. 等待页面加载完成（1.5s 后）
sleep 2

# 3. 检查 console 错误
snapshot console

# 4. 截图看 UI
screenshot

# 5. 多次刷新确认可复现（排除缓存导致的假阳性）
gstack goto /canvas
sleep 2
snapshot console
gstack goto /canvas
sleep 2
snapshot console
```

### 预期产出

一份 `docs/vibex-canvas-urgent-bugs/404-verification-report.md`，包含：

1. **按 URL 分组的 404 列表**：
   - URL
   - 请求时间（页面加载后 Xms）
   - 触发该请求的代码位置（文件:行号）
   - 资源类型（图片/字体/JSON/JS）

2. **截图标注**：标注缺失资源在 UI 中的位置

3. **复现性确认**：是否 3 次刷新中有 3 次/2次/1次/0次复现

### 通过标准

- [ ] Story 2.1 报告已产出，包含所有具体 404 URL
- [ ] 404 请求已按 URL 分组并标注来源代码位置
- [ ] 复现性已确认（至少 2/3 次刷新可复现）

---

## 3. Story 2.2: 针对性修复（TBD — 待 Story 2.1 产出后补充）

> ⚠️ **TBD 声明**：以下修复方案基于分析报告的推测。Story 2.1 gstack 验证完成后，必须根据实际 404 URL 填写具体的文件变更和验收标准。

### 3.1 推测修复方案 A（template-data.ts 路径不一致）

**问题**: `lib/template-data.ts` 中引用 `/templates/ecommerce/`（无连字符），实际目录为 `e-commerce/`（有连字符）

**修复**: 统一路径为 `e-commerce`（含连字符）

```tsx
// lib/template-data.ts
// Before:
thumbnail: '/templates/ecommerce/thumbnail.jpg',
previewImages: ['/templates/ecommerce/preview-1.jpg'],

// After:
thumbnail: '/templates/e-commerce/thumbnail.jpg',
previewImages: ['/templates/e-commerce/preview-1.jpg'],
```

**验收标准（推测，待 gstack 验证后确认）**:
```ts
expect(fetch('/templates/e-commerce/thumbnail.jpg')).resolves.toMatchObject({ status: 200 });
expect(fetch('/templates/e-commerce/preview-1.jpg')).resolves.toMatchObject({ status: 200 });
```

### 3.2 推测修复方案 B（无效 import 清理）

**问题**: `template-data.ts` 可能不在 CanvasPage 的 import 链中，但存在其他无效引用。

**修复**: 确认 import 链，移除不必要引用。

**验收标准（推测，待确认）**:
```ts
// 验证 canvas 页面加载后无 /templates/ecommerce/ 相关请求
expect(networkRequests.filter(r => r.url.includes('/templates/ecommerce/') && r.status === 404)).toHaveLength(0);
```

### 3.3 推测修复方案 C（动态 import 路径）

**问题**: `TemplateSelector.tsx` 使用 `await import('@/lib/canvas/templateLoader')`

**修复**: 确认 `@` alias 在构建后正确解析。

**验收标准（推测，待确认）**:
```ts
// 验证 TemplateSelector 动态加载成功
expect(screen.getByRole('region', { name: /template/i })).toBeInTheDocument();
```

---

## 4. 修复后验证流程

Story 2.2 修复完成后，执行以下验证：

```bash
# 1. 访问 /canvas
gstack goto /canvas

# 2. 等待加载
sleep 2

# 3. 检查 console 无 404 错误
snapshot console
# expect: 无 "Failed to load resource" 或 "net::ERR_NAME_NOT_RESOLVED"

# 4. 截图验证 UI 完整
screenshot

# 5. 验证 Network 面板 404 数量 = 0
# expect: 404 count === 0

# 6. 多次刷新确认稳定
gstack goto /canvas
sleep 2
gstack goto /canvas
sleep 2
```

---

## 5. 验收标准（待 gstack 验证后补充）

| ID | 验收标准 | 测试方法 | 状态 |
|----|----------|----------|------|
| AC-2.1.1 | gstack 验证报告已产出（包含具体 404 URL 列表） | 人工审查报告 | **前置条件** |
| AC-2.2.1 | **待 gstack 验证后补充** | 待补充 | **TBD** |
| AC-2.2.2 | **待 gstack 验证后补充** | 待补充 | **TBD** |
| AC-2.2.3 | Network 面板 404 数量 = 0 | gstack | **待修复后验证** |
| AC-2.2.4 | Console 无 `Failed to load resource` 错误 | gstack | **待修复后验证** |

---

## 6. 关键文件（推测，待 Story 2.1 确认）

| 文件 | 变更类型 | 推测变更 |
|------|----------|----------|
| `vibex-fronted/src/lib/template-data.ts` | 待定 | 路径修正（待验证） |
| `vibex-fronted/src/components/canvas/features/TemplateSelector.tsx` | 待定 | import 路径检查（待验证） |
| `vibex-fronted/public/templates/` | 待定 | 可能需补全资源文件（待验证） |

---

## 7. DoD Checklist

- [ ] Story 2.1 gstack 验证报告已产出
- [ ] 所有 404 URL 已确认来源代码位置
- [ ] 具体文件变更已完成
- [ ] gstack 验证：Network 面板 404 数量 = 0
- [ ] gstack 截图对比：UI 完整
- [ ] Console 无资源加载错误
- [ ] Code review 通过
