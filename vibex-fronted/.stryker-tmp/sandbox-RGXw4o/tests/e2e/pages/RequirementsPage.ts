/**
 * Requirements Page Object
 * 需求页面
 */
// @ts-nocheck


import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RequirementsPage extends BasePage {
  readonly addButton: Locator;
  readonly requirementList: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.addButton = page.getByRole('button', { name: '添加需求' });
    this.requirementList = page.locator('[class*="requirementItem"], [class*="requirement-item"]');
    this.searchInput = page.getByPlaceholder('搜索需求');
    this.filterButton = page.getByRole('button', { name: '筛选' });
    this.exportButton = page.getByRole('button', { name: '导出' });
    this.importButton = page.getByRole('button', { name: '导入' });
  }

  /**
   * 导航到需求页
   */
  async navigate(): Promise<void> {
    await super.navigate('/requirements');
    await this.waitForLoad();
  }

  /**
   * 点击添加需求
   */
  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * 获取需求数量
   */
  async getRequirementCount(): Promise<number> {
    return this.requirementList.count();
  }

  /**
   * 搜索需求
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  /**
   * 点击导出
   */
  async export(): Promise<void> {
    await this.exportButton.click();
  }

  /**
   * 点击导入
   */
  async import(): Promise<void> {
    await this.importButton.click();
  }
}

export default RequirementsPage;
