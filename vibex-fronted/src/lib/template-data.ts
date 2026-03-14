/**
 * Template Data
 * 
 * 10 个预置行业模板数据
 */

import type { Template } from '@/types/template';

export const TEMPLATE_DATA: Template[] = [
  {
    id: 'tpl-001',
    name: '在线教育平台',
    description: '完整的在线教育解决方案，包含课程管理、学员管理、在线支付、直播课堂等功能。适合教育机构和培训公司。',
    category: 'education',
    tags: ['在线课程', '直播教学', '学员管理', '支付集成'],
    thumbnail: '/templates/education/thumbnail.jpg',
    previewImages: [
      '/templates/education/preview-1.jpg',
      '/templates/education/preview-2.jpg',
    ],
    author: {
      name: 'VibeX Team',
      avatar: '/avatars/vibex-team.jpg',
    },
    price: 'free',
    difficulty: 'intermediate',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '首页展示课程和特色' },
      { id: 'courses', name: '课程列表', route: '/courses', description: '课程列表页' },
      { id: 'course-detail', name: '课程详情', route: '/courses/[id]', description: '课程详情页' },
      { id: 'profile', name: '个人中心', route: '/profile', description: '用户个人中心' },
    ],
    components: [],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    downloads: 1520,
    rating: 4.8,
    featured: true,
  },
  {
    id: 'tpl-002',
    name: '电商独立站',
    description: '功能完善的电商网站模板，支持商品展示、购物车、订单管理、支付集成、会员系统等核心功能。',
    category: 'ecommerce',
    tags: ['网上商店', '购物车', '支付网关', '会员系统'],
    thumbnail: '/templates/ecommerce/thumbnail.jpg',
    previewImages: [
      '/templates/ecommerce/preview-1.jpg',
      '/templates/ecommerce/preview-2.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'premium',
    difficulty: 'advanced',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '首页展示商品和促销' },
      { id: 'products', name: '商品列表', route: '/products', description: '商品列表页' },
      { id: 'product-detail', name: '商品详情', route: '/products/[id]', description: '商品详情页' },
      { id: 'cart', name: '购物车', route: '/cart', description: '购物车页面' },
      { id: 'checkout', name: '结账', route: '/checkout', description: '结账页面' },
    ],
    components: [],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
    downloads: 2340,
    rating: 4.9,
    featured: true,
  },
  {
    id: 'tpl-003',
    name: '医疗健康平台',
    description: '专业的医疗健康服务平台模板，包含预约挂号、医生介绍、在线问诊、健康资讯等功能。',
    category: 'healthcare',
    tags: ['预约挂号', '在线问诊', '医生团队', '健康资讯'],
    thumbnail: '/templates/healthcare/thumbnail.jpg',
    previewImages: [
      '/templates/healthcare/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'free',
    difficulty: 'intermediate',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '首页展示服务和医生' },
      { id: 'doctors', name: '医生团队', route: '/doctors', description: '医生列表' },
      { id: 'booking', name: '预约挂号', route: '/booking', description: '预约页面' },
    ],
    components: [],
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: '2026-03-08T00:00:00Z',
    downloads: 890,
    rating: 4.7,
  },
  {
    id: 'tpl-004',
    name: '金融理财平台',
    description: '专业的金融理财网站模板，支持产品展示、收益计算、在线开户、账户管理等功能。',
    category: 'finance',
    tags: ['理财产品', '收益计算', '用户中心', '数据分析'],
    thumbnail: '/templates/finance/thumbnail.jpg',
    previewImages: [
      '/templates/finance/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'premium',
    difficulty: 'advanced',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '首页展示产品和收益' },
      { id: 'products', name: '理财产品', route: '/products', description: '产品列表' },
      { id: 'account', name: '用户中心', route: '/account', description: '用户账户管理' },
    ],
    components: [],
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: '2026-03-09T00:00:00Z',
    downloads: 756,
    rating: 4.6,
  },
  {
    id: 'tpl-005',
    name: '社交社区',
    description: '功能丰富的社交社区平台模板，包含动态发布、点赞评论、关注、私信、话题等功能。',
    category: 'social',
    tags: ['社交网络', '动态发布', '用户互动', '话题社区'],
    thumbnail: '/templates/social/thumbnail.jpg',
    previewImages: [
      '/templates/social/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'free',
    difficulty: 'intermediate',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '动态信息流' },
      { id: 'profile', name: '个人主页', route: '/profile/[id]', description: '用户主页' },
      { id: 'messages', name: '私信', route: '/messages', description: '私信聊天' },
    ],
    components: [],
    createdAt: '2026-03-03T00:00:00Z',
    updatedAt: '2026-03-11T00:00:00Z',
    downloads: 1100,
    rating: 4.5,
    featured: true,
  },
  {
    id: 'tpl-006',
    name: '企业官网',
    description: '专业的企业官网模板，适合各类企业使用。包含关于我们、解决方案、产品展示、新闻动态、联系等常规页面。',
    category: 'enterprise',
    tags: ['企业官网', '公司介绍', '产品展示', '新闻动态'],
    thumbnail: '/templates/enterprise/thumbnail.jpg',
    previewImages: [
      '/templates/enterprise/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'free',
    difficulty: 'beginner',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '企业首页' },
      { id: 'about', name: '关于我们', route: '/about', description: '公司介绍' },
      { id: 'products', name: '产品服务', route: '/products', description: '产品服务列表' },
      { id: 'contact', name: '联系我们', route: '/contact', description: '联系方式' },
    ],
    components: [],
    createdAt: '2026-03-03T00:00:00Z',
    updatedAt: '2026-03-05T00:00:00Z',
    downloads: 3200,
    rating: 4.9,
    featured: true,
  },
  {
    id: 'tpl-007',
    name: '个人博客',
    description: '简洁优雅的个人博客模板，支持文章发布、分类标签、评论互动、主题切换等功能。',
    category: 'blog',
    tags: ['个人博客', '文章发布', '评论系统', '标签分类'],
    thumbnail: '/templates/blog/thumbnail.jpg',
    previewImages: [
      '/templates/blog/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'free',
    difficulty: 'beginner',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '博客首页' },
      { id: 'articles', name: '文章列表', route: '/articles', description: '文章列表' },
      { id: 'article-detail', name: '文章详情', route: '/articles/[slug]', description: '文章详情' },
      { id: 'about', name: '关于', route: '/about', description: '博主介绍' },
    ],
    components: [],
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-06T00:00:00Z',
    downloads: 2800,
    rating: 4.8,
  },
  {
    id: 'tpl-008',
    name: '作品集展示',
    description: '精美的作品集展示模板，适合设计师、摄影师、艺术家展示个人作品。',
    category: 'portfolio',
    tags: ['作品集', '图片展示', '作品分类', '个人品牌'],
    thumbnail: '/templates/portfolio/thumbnail.jpg',
    previewImages: [
      '/templates/portfolio/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'free',
    difficulty: 'beginner',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '作品展示首页' },
      { id: 'works', name: '作品列表', route: '/works', description: '作品列表' },
      { id: 'work-detail', name: '作品详情', route: '/works/[id]', description: '单个作品详情' },
    ],
    components: [],
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-07T00:00:00Z',
    downloads: 1650,
    rating: 4.7,
  },
  {
    id: 'tpl-009',
    name: '预约预订系统',
    description: '完整的预约预订系统模板，支持多场景预约、时间管理、订单处理、提醒通知等功能。',
    category: 'booking',
    tags: ['预约系统', '时间管理', '订单处理', '提醒通知'],
    thumbnail: '/templates/booking/thumbnail.jpg',
    previewImages: [
      '/templates/booking/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'premium',
    difficulty: 'intermediate',
    pages: [
      { id: 'home', name: '首页', route: '/', description: '服务展示首页' },
      { id: 'booking', name: '预约', route: '/booking', description: '选择服务和时间' },
      { id: 'confirmation', name: '确认', route: '/confirmation', description: '预约确认' },
      { id: 'my-bookings', name: '我的预约', route: '/my-bookings', description: '预约列表' },
    ],
    components: [],
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-13T00:00:00Z',
    downloads: 980,
    rating: 4.6,
  },
  {
    id: 'tpl-010',
    name: 'SaaS 管理后台',
    description: '现代化的 SaaS 应用管理后台模板，包含仪表盘、数据分析、用户管理、设置配置等功能。',
    category: 'saas',
    tags: ['管理后台', '数据分析', '用户管理', '系统设置'],
    thumbnail: '/templates/saas/thumbnail.jpg',
    previewImages: [
      '/templates/saas/preview-1.jpg',
    ],
    author: {
      name: 'VibeX Team',
    },
    price: 'premium',
    difficulty: 'advanced',
    pages: [
      { id: 'dashboard', name: '仪表盘', route: '/dashboard', description: '数据概览' },
      { id: 'users', name: '用户管理', route: '/users', description: '用户列表和操作' },
      { id: 'analytics', name: '数据分析', route: '/analytics', description: '数据统计图表' },
      { id: 'settings', name: '系统设置', route: '/settings', description: '系统配置' },
    ],
    components: [],
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
    downloads: 1340,
    rating: 4.8,
    featured: true,
  },
];

/**
 * 获取所有模板
 */
export function getAllTemplates(): Template[] {
  return TEMPLATE_DATA;
}

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATE_DATA.filter(t => t.category === category);
}

/**
 * 获取推荐模板
 */
export function getFeaturedTemplates(): Template[] {
  return TEMPLATE_DATA.filter(t => t.featured);
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATE_DATA.find(t => t.id === id);
}

/**
 * 搜索模板
 */
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATE_DATA.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
