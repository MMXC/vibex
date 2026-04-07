/**
 * Base Page Object
 * 所有页面对象的基类
 */

import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * 导航到页面
   */
  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 获取元素
   */
  protected getByRole(role: string, options?: { name?: string }): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * 获取文本输入框
   */
  protected getByLabel(label: string): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * 获取按钮
   */
  protected getByText(text: string): Locator {
    return this.page.getByText(text);
  }

  /**
   * 获取链接
   */
  protected getByHref(href: string): Locator {
    return this.page.locator(`a[href="${href}"]`);
  }

  /**
   * 截图
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png` 
    });
  }
}
