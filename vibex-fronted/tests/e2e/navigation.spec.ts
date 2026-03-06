import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// 登录辅助函数 - 带重试
async function login(page: any) {
  const maxRetries = 3
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(`${BASE_URL}/auth`)
      await page.waitForLoadState('domcontentloaded')
      
      // 检查是否有网络错误
      const errorMsg = page.locator('text=网络错误')
      if (await errorMsg.isVisible()) {
        console.log(`网络错误，重试 ${i + 1}/${maxRetries}`)
        await page.reload()
        await page.waitForTimeout(2000)
        continue
      }
      
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'y760283407@outlook.com')
      await page.fill('input[type="password"], input[name="password"]', '12345678')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard/, { timeout: 60000 })
      return true
    } catch (e) {
      console.log(`登录失败，重试 ${i + 1}/${maxRetries}`)
      if (i === maxRetries - 1) throw e
      await page.waitForTimeout(3000)
    }
  }
  return false
}

test.describe('公开页面导航测试', () => {
  test('公开页面 - 首页重定向', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const url = page.url()
    expect(url).toMatch(/\/auth\/|\/dashboard\/|\/landing\//)
  })

  test('公开页面 - 访问 landing 页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`)
    await expect(page).toHaveURL(/\/landing/)
    await expect(page.locator('body')).toContainText(/VibeX|AI/i)
  })

  test('公开页面 - 访问认证页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('h1')).toContainText(/欢迎|登录|Sign in/i)
  })

  test('公开页面 - 访问模板页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`)
    await expect(page).toHaveURL(/\/templates/)
    await expect(page.locator('h1')).toContainText(/模板|Templates/i)
  })
})

test.describe('认证与登录后导航测试', () => {
  test('认证 - 登录并跳转', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('登录后 - 导航到AI原型设计', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/confirm`)
    await expect(page).toHaveURL(/\/confirm/)
  })

  test('登录后 - 导航到领域模型', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/domain`)
    await expect(page).toHaveURL(/\/domain/)
  })

  test('登录后 - 导航到原型预览', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/prototype`)
    await expect(page).toHaveURL(/\/prototype/)
  })

  test('登录后 - 导航到导出页面', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/export`)
    await expect(page).toHaveURL(/\/export/)
  })

  test('登录后 - 导航到需求列表', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/requirements`)
    await expect(page).toHaveURL(/\/requirements/)
  })

  test('登录后 - 导航到流程图', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/flow`)
    await expect(page).toHaveURL(/\/flow/)
  })

  test('登录后 - 导航到页面管理', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/pagelist`)
    await expect(page).toHaveURL(/\/pagelist/)
  })

  test('登录后 - 导航到更新日志', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/changelog`)
    await expect(page).toHaveURL(/\/changelog/)
  })

  test('登录后 - 导航到用户设置', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/user-settings`)
    await expect(page).toHaveURL(/\/user-settings/)
  })

  test('登录后 - 导航到项目设置', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/project-settings`)
    await expect(page).toHaveURL(/\/project-settings/)
  })
})

test.describe('URL路由与安全测试', () => {
  test('未登录访问受保护页面重定向', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForURL(/\/auth/, { timeout: 15000 })
  })
})

test.describe('性能测试', () => {
  test('页面加载时间', async ({ page }) => {
    const start = Date.now()
    await page.goto(`${BASE_URL}/landing`)
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(10000)
  })
})
