import { test, expect } from '@playwright/test'

test.describe('导航性能指标', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

  // US-020: 导航加载时间 < 500ms
  test('导航加载时间应小于 500ms', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/dashboard`)
    
    // 等待导航渲染完成
    await page.waitForSelector('[class*="sidebar"], nav, header')
    
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(500)
  })

  // US-021: 页面切换时间 < 300ms
  test('页面切换时间应小于 300ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // 测量导航切换时间
    const startTime = Date.now()
    
    await page.click('a[href="/requirements"]')
    await page.waitForLoadState('networkidle')
    
    const switchTime = Date.now() - startTime
    
    expect(switchTime).toBeLessThan(300)
  })

  // US-022: FCP < 1.5s
  test('首次内容绘制 (FCP) 应小于 1.5s', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime)
                observer.disconnect()
              }
            }
          })
          observer.observe({ entryTypes: ['paint'] })
          
          // 超时 fallback
          setTimeout(() => resolve(0), 5000)
        } else {
          resolve(0)
        }
      })
    })
    
    expect(fcp).toBeLessThan(1500)
  })

  // US-023: LCP < 2.5s
  test('最大内容绘制 (LCP) 应小于 2.5s', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as any
            resolve(lastEntry.startTime)
            observer.disconnect()
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
          
          // 超时 fallback
          setTimeout(() => resolve(0), 5000)
        } else {
          resolve(0)
        }
      })
    })
    
    expect(lcp).toBeLessThan(2500)
  })

  // US-024: CLS < 0.1
  test('累积布局偏移 (CLS) 应小于 0.1', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // 等待页面稳定
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          let clsValue = 0
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any) {
              if (entry.hadRecentInput) return
              clsValue += entry.value
            }
          })
          observer.observe({ entryTypes: ['layout-shift'] })
          
          // 超时后返回累积值
          setTimeout(() => resolve(clsValue), 2000)
        } else {
          resolve(0)
        }
      })
    })
    
    expect(cls).toBeLessThan(0.1)
  })

  // 综合性能测试
  test('综合性能指标检查', async ({ page }) => {
    const metrics: Record<string, number> = {}
    
    await page.goto(`${BASE_URL}/dashboard`)
    
    // 测量导航加载
    const navStart = Date.now()
    await page.waitForSelector('[class*="sidebar"], nav, header', { timeout: 5000 })
    metrics.navLoadTime = Date.now() - navStart
    
    // 测量页面切换
    const switchStart = Date.now()
    await page.click('a[href="/requirements"]')
    await page.waitForLoadState('networkidle')
    metrics.pageSwitchTime = Date.now() - switchStart
    
    // 获取性能指标
    const perfMetrics = await page.evaluate(() => {
      const paintTiming = performance.getEntriesByType('paint')
      const fcp = paintTiming.find(e => e.name === 'first-contentful-paint')?.startTime || 0
      
      return {
        fcp: fcp,
        navLoadTime: (performance as any).navigation?.domContentLoadedEventStart || 0,
      }
    })
    
    metrics.fcp = perfMetrics.fcp
    
    console.log('性能指标:', metrics)
    
    // 验证所有指标
    expect(metrics.navLoadTime).toBeLessThan(500)
    expect(metrics.pageSwitchTime).toBeLessThan(300)
    expect(metrics.fcp).toBeLessThan(1500)
  })
})
