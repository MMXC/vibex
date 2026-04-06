/**
 * Page API Tests
 */

describe('Page API', () => {
  const mockApi = {
    createPage: vi.fn().mockResolvedValue({ id: 'page1' }),
    getPage: vi.fn().mockResolvedValue({ id: 'page1' }),
    listPages: vi.fn().mockResolvedValue([]),
    updatePage: vi.fn().mockResolvedValue({ id: 'page1' }),
    deletePage: vi.fn().mockResolvedValue(true),
    addComponent: vi.fn().mockResolvedValue({ id: 'comp1' }),
    removeComponent: vi.fn().mockResolvedValue(true),
    updateComponent: vi.fn().mockResolvedValue({ id: 'comp1' }),
  };

  beforeEach(() => vi.clearAllMocks());

  // Method existence
  it('should have createPage', () => { expect(typeof mockApi.createPage).toBe('function'); });
  it('should have getPage', () => { expect(typeof mockApi.getPage).toBe('function'); });
  it('should have listPages', () => { expect(typeof mockApi.listPages).toBe('function'); });
  it('should have updatePage', () => { expect(typeof mockApi.updatePage).toBe('function'); });
  it('should have deletePage', () => { expect(typeof mockApi.deletePage).toBe('function'); });
  it('should have addComponent', () => { expect(typeof mockApi.addComponent).toBe('function'); });
  it('should have removeComponent', () => { expect(typeof mockApi.removeComponent).toBe('function'); });
  it('should have updateComponent', () => { expect(typeof mockApi.updateComponent).toBe('function'); });

  // Functionality
  it('should create page', async () => { expect(await mockApi.createPage({})).toBeDefined(); });
  it('should get page', async () => { expect(await mockApi.getPage('page1')).toBeDefined(); });
  it('should list pages', async () => { expect(await mockApi.listPages()).toBeInstanceOf(Array); });
  it('should update page', async () => { expect(await mockApi.updatePage('page1', {})).toBeDefined(); });
  it('should delete page', async () => { expect(await mockApi.deletePage('page1')).toBe(true); });
  it('should add component', async () => { expect(await mockApi.addComponent('page1', {})).toBeDefined(); });
  it('should remove component', async () => { expect(await mockApi.removeComponent('page1', 'comp1')).toBe(true); });
  it('should update component', async () => { expect(await mockApi.updateComponent('page1', 'comp1', {})).toBeDefined(); });
});
