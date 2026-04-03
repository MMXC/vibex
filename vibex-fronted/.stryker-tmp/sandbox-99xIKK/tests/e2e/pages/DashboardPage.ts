/**
 * Dashboard Page Object
 * Dashboard 页面
 */
// @ts-nocheck


import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly projectCards: Locator;
  readonly newProjectButton: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;

  constructor(page: Page) {
    super(page);
    
    this.projectCards = page.locator('[class*="projectCard"], [class*="project-card"]');
    this.newProjectButton = page.getByRole('button', { name: '新建项目' });
    this.userMenu = page.locator('[class*="userMenu"], [class*="user-menu"]');
    this.logoutButton = page.getByRole('button', { name: '退出登录' });
    this.searchInput = page.getByPlaceholder('搜索项目');
    this.filterDropdown = page.locator('[class*="filterDropdown"], [class*="filter-dropdown"]');
  }

  /**
   * 导航到 Dashboard
   */
  async navigate(): Promise<void> {
    await super.navigate('/dashboard');
    await this.waitForLoad();
  }

  /**
   * 获取项目卡片数量
   */
  async getProjectCount(): Promise<number> {
    return this.projectCards.count();
  }

  /**
   * 点击新建项目
   */
  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  /**
   * 搜索项目
   */
  async searchProject(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  /**
   * 点击用户菜单
   */
  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  /**
   * 点击退出登录
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /**
   * 获取项目列表文本
   */
  async getProjectNames(): Promise<string[]> {
    const cards = await this.projectCards.all();
    const names: string[] = [];
    for (const card of cards) {
      const text = await card.textContent();
      if (text) names.push(text);
    }
    return names;
  }
}

export default DashboardPage;
