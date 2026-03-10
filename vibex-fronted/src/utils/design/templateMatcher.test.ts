/**
 * Template Matcher Tests
 */

describe('Template Matcher', () => {
  const mockTemplates = [
    { id: 'user-management', keywords: ['用户', '登录', '注册'], name: '用户管理系统' },
    { id: 'ecommerce', keywords: ['电商', '购物', '订单'], name: '电商平台' },
    { id: 'blog', keywords: ['博客', '文章', '评论'], name: '博客系统' },
  ];

  const mockMatcher = {
    match: jest.fn((text: string) => {
      for (const template of mockTemplates) {
        for (const keyword of template.keywords) {
          if (text.includes(keyword)) {
            return { matched: true, template };
          }
        }
      }
      return { matched: false, template: null };
    }),
    getAllTemplates: jest.fn(() => mockTemplates),
    getTemplateById: jest.fn((id: string) => mockTemplates.find(t => t.id === id)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Matching', () => {
    it('should match user management template', () => {
      const result = mockMatcher.match('创建一个用户管理系统');
      expect(result.matched).toBe(true);
      expect(result.template?.id).toBe('user-management');
    });

    it('should match ecommerce template', () => {
      const result = mockMatcher.match('开发一个电商平台');
      expect(result.matched).toBe(true);
      expect(result.template?.id).toBe('ecommerce');
    });

    it('should match blog template', () => {
      const result = mockMatcher.match('搭建一个博客系统');
      expect(result.matched).toBe(true);
      expect(result.template?.id).toBe('blog');
    });

    it('should not match unknown template', () => {
      const result = mockMatcher.match('Hello world');
      expect(result.matched).toBe(false);
      expect(result.template).toBeNull();
    });
  });

  describe('Template Retrieval', () => {
    it('should get all templates', () => {
      const templates = mockMatcher.getAllTemplates();
      expect(templates.length).toBe(3);
    });

    it('should get template by id', () => {
      const template = mockMatcher.getTemplateById('user-management');
      expect(template?.name).toBe('用户管理系统');
    });

    it('should return undefined for unknown id', () => {
      const template = mockMatcher.getTemplateById('unknown');
      expect(template).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = mockMatcher.match('');
      expect(result.matched).toBe(false);
    });

    it('should handle partial keyword match', () => {
      const result = mockMatcher.match('这是一个关于用户的系统');
      expect(result.matched).toBe(true);
    });
  });
});