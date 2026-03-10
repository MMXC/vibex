/**
 * Login Page Object
 * 登录页面
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    
    this.emailInput = page.getByLabel('邮箱');
    this.passwordInput = page.getByLabel('密码');
    this.submitButton = page.getByRole('button', { name: '登录' });
    this.errorMessage = page.locator('[class*="error"]');
    this.forgotPasswordLink = page.getByRole('link', { name: '忘记密码' });
    this.registerLink = page.getByRole('button', { name: '立即注册' });
  }

  /**
   * 导航到登录页
   */
  async navigate(): Promise<void> {
    await super.navigate('/auth');
    await this.waitForLoad();
  }

  /**
   * 输入邮箱
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * 输入密码
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * 点击登录按钮
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * 执行登录流程
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * 获取错误信息
   */
  async getErrorMessage(): Promise<string> {
    return this.errorMessage.textContent() || '';
  }

  /**
   * 点击立即注册
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * 点击忘记密码
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}

export default LoginPage;
