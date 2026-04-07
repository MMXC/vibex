# F5: E2E 测试覆盖规格说明

**功能域**: Canvas 完整流程 E2E 测试  
**PRD ID**: F5  
**状态**: 待开发

---

## 1. 规格详情

### F5.1 完整流程 E2E 测试

**测试目标**: 覆盖 Canvas 完整用户流程（contexts → flows → components）

**测试用例**:

```typescript
// e2e/canvas-api-standardization.spec.ts
describe('Canvas API Standardization E2E', () => {
  it('F5.1: 完整流程 - contexts → flows → components', async ({ page }) => {
    // 1. 访问 Canvas 页面
    await page.goto('/canvas');
    
    // 2. 输入需求描述
    await page.fill('[data-testid="requirement-input"]', '创建一个简单的博客系统');
    
    // 3. 点击生成上下文按钮
    await page.click('[data-testid="generate-contexts-btn"]');
    
    // 4. 等待 contexts 生成
    await page.waitForSelector('[data-testid="contexts-result"]');
    
    // 5. 选择上下文
    await page.click('[data-testid="context-item"]:first-child');
    
    // 6. 点击生成流程按钮
    await page.click('[data-testid="generate-flows-btn"]');
    
    // 7. 等待 flows 生成
    await page.waitForSelector('[data-testid="flows-result"]');
    
    // 8. 选择流程
    await page.click('[data-testid="flow-item"]:first-child');
    
    // 9. 点击生成组件按钮
    await page.click('[data-testid="generate-components-btn"]');
    
    // 10. 等待 components 生成
    await page.waitForSelector('[data-testid="components-result"]');
    
    // 11. 验证 sessionId 链路
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('vibex_canvas_session_id');
    });
    expect(sessionId).toBeTruthy();
  });

  it('F5.2: API 路由验证 - 无硬编码 URL', async () => {
    // 验证 canvasApi.ts 无硬编码 URL
    const canvasApiContent = await fs.readFile(
      'src/lib/canvas/api/canvasApi.ts',
      'utf-8'
    );
    
    // 不应包含完整 URL
    expect(canvasApiContent).not.toMatch(/fetch\s*\(\s*['"']https?:\/\//);
    
    // 应使用 getApiUrl
    expect(canvasApiContent).toMatch(/getApiUrl\(\)/);
  });

  it('F5.3: SSE 端点集成验证', async ({ page }) => {
    await page.goto('/canvas');
    
    // 验证 dddApi 已迁移
    const hasSseApi = await page.evaluate(() => {
      try {
        require('@/lib/canvas/api/canvasSseApi');
        return true;
      } catch {
        return false;
      }
    });
    
    expect(hasSseApi).toBe(true);
  });
});
```

**运行命令**:
```bash
npm run e2e -- --grep "Canvas API Standardization"
```

---

### F5.2 主页无 404 验证

**测试目标**: 确保标准化后 VibeX Canvas 页面加载正常，无资源 404

**测试用例**:
```typescript
it('F5.2: Canvas 页面加载无 404', async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() === 404) {
      failedRequests.push(response.url());
    }
  });
  
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');
  
  // 验证无 404 请求
  expect(failedRequests).toEqual([]);
  
  // 验证无控制台错误
  expect(consoleErrors).toEqual([]);
});
```

**运行命令**:
```bash
npm run e2e -- --grep "404"
```

---

## 2. 测试数据

| 测试场景 | 输入 | 期望输出 |
|----------|------|----------|
| 正常流程 | "创建一个博客系统" | contexts → flows → components 完整生成 |
| sessionId 验证 | 无 sessionId 调用 flows | 返回错误提示 |
| 路由验证 | 检查所有 fetch 调用 | 无硬编码 URL |

---

## 3. 相关文件

| 文件路径 | 职责 |
|----------|------|
| `e2e/canvas-api-standardization.spec.ts` | E2E 测试文件（新建） |
| `src/lib/canvas/api/canvasApi.ts` | 被测试文件 |
| `src/lib/canvas/api/canvasSseApi.ts` | SSE 集成测试 |

---

## 4. 验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-E2E-1 | Canvas 完整流程测试通过 | `npm run e2e` |
| AC-E2E-2 | 无 404 资源请求 | 监控网络请求 |
| AC-E2E-3 | 无控制台错误 | 监控 console |
| AC-E2E-4 | sessionId 链路正确 | E2E 测试断言 |

---

## 5. 前置条件

- F1 (API 路由标准化) 已完成
- F2 (SSE 端点整合) 已完成
- F3 (后端旧路由废弃) 已完成
- F4 (sessionId 链路) 已完成
- 本地 dev server 已启动: `npm run dev`
