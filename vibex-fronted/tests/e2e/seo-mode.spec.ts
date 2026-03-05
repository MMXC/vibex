import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://vibex-app.pages.dev'

test.describe('SEO URL参数测试', () => {
  
  test('?mode=register 应自动切换到注册表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth?mode=register`)
    
    // 截图：准备阶段
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/seo-mode-register.png',
      fullPage: true 
    })
    
    // 验证显示注册表单
    await expect(page.locator('h1')).toContainText('创建账号')
    await expect(page.locator('button[type="submit"]')).toContainText('注册')
  })

  test('?mode=login 应保持登录表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth?mode=login`)
    
    // 截图：准备阶段
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/seo-mode-login.png',
      fullPage: true 
    })
    
    // 验证显示登录表单
    await expect(page.locator('h1')).toContainText('欢迎回来')
    await expect(page.locator('button[type="submit"]')).toContainText('登录')
  })

  test('默认访问应显示登录表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    
    // 截图
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/seo-default.png',
      fullPage: true 
    })
    
    // 验证默认是登录
    await expect(page.locator('h1')).toContainText('欢迎回来')
  })

  test('无效mode参数应默认显示登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth?mode=invalid`)
    
    // 验证默认行为不受影响
    await expect(page.locator('h1')).toContainText('欢迎回来')
  })
})