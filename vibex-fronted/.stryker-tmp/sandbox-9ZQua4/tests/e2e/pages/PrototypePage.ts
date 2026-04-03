// @ts-nocheck
import { Page, Locator } from '@playwright/test';

export class PrototypePage {
  readonly page: Page;
  readonly baseUrl: string;

  // Main elements
  readonly prototypeContainer: Locator;
  readonly sidebar: Locator;
  readonly pageList: Locator;
  
  // Device controls
  readonly desktopButton: Locator;
  readonly tabletButton: Locator;
  readonly mobileButton: Locator;
  
  // Zoom controls
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly zoomLevel: Locator;
  
  // Preview area
  readonly previewFrame: Locator;
  readonly previewContent: Locator;
  
  // Component interaction
  readonly componentList: Locator;

  constructor(page: Page, baseUrl: string = process.env.E2E_BASE_URL || 'http://localhost:3000') {
    this.page = page;
    this.baseUrl = baseUrl;

    // Main containers
    this.prototypeContainer = page.locator('[data-testid="prototype-container"]');
    this.sidebar = page.locator('[data-testid="prototype-sidebar"]');
    this.pageList = page.locator('[data-testid="page-list"]');
    
    // Device switching buttons
    this.desktopButton = page.locator('[data-testid="device-desktop"]');
    this.tabletButton = page.locator('[data-testid="device-tablet"]');
    this.mobileButton = page.locator('[data-testid="device-mobile"]');
    
    // Zoom controls
    this.zoomInButton = page.locator('[data-testid="zoom-in"]');
    this.zoomOutButton = page.locator('[data-testid="zoom-out"]');
    this.zoomLevel = page.locator('[data-testid="zoom-level"]');
    
    // Preview area
    this.previewFrame = page.locator('[data-testid="preview-frame"]');
    this.previewContent = page.locator('[data-testid="preview-content"]');
    
    // Component list in sidebar
    this.componentList = page.locator('[data-testid="component-list"]');
  }

  async navigate(projectId?: string): Promise<void> {
    const url = projectId 
      ? `${this.baseUrl}/prototype?projectId=${projectId}`
      : `${this.baseUrl}/prototype`;
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the prototype page to be ready
    await this.page.waitForSelector('[data-testid="prototype-container"], .prototypePreview, .prototype-preview', {
      timeout: 10000
    }).catch(() => {
      // If no test id, just wait a bit
      return this.page.waitForLoadState('networkidle');
    });
  }

  async selectDevice(device: 'desktop' | 'tablet' | 'mobile'): Promise<void> {
    switch (device) {
      case 'desktop':
        await this.desktopButton.click();
        break;
      case 'tablet':
        await this.tabletButton.click();
        break;
      case 'mobile':
        await this.mobileButton.click();
        break;
    }
    await this.page.waitForLoadState('networkidle');
  }

  async zoomIn(): Promise<void> {
    await this.zoomInButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async zoomOut(): Promise<void> {
    await this.zoomOutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentZoom(): Promise<number> {
    const zoomText = await this.zoomLevel.textContent();
    return parseInt(zoomText?.replace('%', '') || '100', 10);
  }

  async selectPage(pageName: string): Promise<void> {
    const pageItem = this.pageList.locator(`[data-testid="page-item-${pageName}"]`);
    await pageItem.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getComponentCount(): Promise<number> {
    const components = this.componentList.locator('[data-testid="component-item"]');
    return await components.count();
  }

  async clickComponent(componentName: string): Promise<void> {
    const component = this.componentList.locator(`[data-testid="component-${componentName}"]`);
    await component.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isPreviewVisible(): Promise<boolean> {
    try {
      await this.previewFrame.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getPreviewWidth(): Promise<number> {
    const box = await this.previewFrame.boundingBox();
    return box?.width || 0;
  }
}
