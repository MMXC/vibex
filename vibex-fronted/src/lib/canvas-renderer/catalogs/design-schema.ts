/**
 * design-schema.ts — StyleCatalog Zod Schema
 *
 * 定义从 awesome-design-md-cn 解析出的设计风格目录类型。
 * 用于 json-render 的 Canvas Renderer 组件选择合适的渲染策略。
 *
 * Phase 1 Step 2: 定义 StyleCatalog Zod Schema
 */
import { z } from 'zod';

/**
 * 设计风格定位
 */
export const StyleCategorySchema = z.enum([
  'modern',       // 现代简约 (Tailwind 友好)
  'classic',      // 经典传统
  'corporate',    // 企业级
  'creative',     // 创意设计
  'minimal',      // 极简
  'material',     // Material Design
  'glass',        // 毛玻璃/玻璃态
  'neumorphic',   // 新拟态
  'brutalist',    // 粗野主义
  'retro',        // 复古
  'futuristic',   // 未来感
  'natural',      // 自然/有机
]);

export type StyleCategory = z.infer<typeof StyleCategorySchema>;

/**
 * 组件类型映射
 */
export const ComponentTypeSchema = z.enum([
  'page',
  'form',
  'list',
  'detail',
  'modal',
  'button',
  'card',
  'navigation',
  'table',
  'input',
  'badge',
  'tag',
  'avatar',
  'alert',
  'tooltip',
  'dropdown',
]);

export type ComponentType = z.infer<typeof ComponentTypeSchema>;

/**
 * 设计风格条目
 */
export const DesignStyleSchema = z.object({
  /** 唯一标识 (slug) */
  slug: z.string(),
  /** 显示名称（英文） */
  name: z.string(),
  /** 显示名称（中文） */
  displayName: z.string(),
  /** 中文名称 */
  nameZh: z.string(),
  /** 风格分类 */
  category: StyleCategorySchema,
  /** 风格分组 */
  group: z.string(),
  /** 中文标签 */
  tagsZh: z.array(z.string()),
  /** 风格关键词 (Tailwind classes 等) */
  styleKeywords: z.array(z.string()),
  /** 中文描述 */
  descriptionZh: z.string(),
  /** 适用场景 */
  useCases: z.array(z.string()),
  /** 亮色预览路径 */
  previewLight: z.string().optional(),
  /** 暗色预览路径 */
  previewDark: z.string().optional(),
  /** README 路径 */
  readmePath: z.string().optional(),
  /** 设计说明路径 */
  designPath: z.string().optional(),
  /** 定位描述 */
  positioningZh: z.string().optional(),
  /** 适用场景 */
  bestFor: z.array(z.string()).optional(),
  /** 避免场景 */
  avoidFor: z.array(z.string()).optional(),
  /** 推荐 Prompt */
  recommendedPromptZh: z.string().optional(),
  /** 创建时间 */
  createdAt: z.string().optional(),
});

export type DesignStyle = z.infer<typeof DesignStyleSchema>;

/**
 * StyleCatalog — 设计风格目录根类型
 */
export const StyleCatalogSchema = z.object({
  /** 目录版本 */
  version: z.string().default('1.0.0'),
  /** 生成时间 */
  generatedAt: z.string(),
  /** 源数据路径 */
  sourcePath: z.string(),
  /** 设计风格列表 */
  styles: z.array(DesignStyleSchema),
  /** 按 category 分组的索引 */
  byCategory: z.record(StyleCategorySchema, z.array(z.string())).optional(),
});

export type StyleCatalog = z.infer<typeof StyleCatalogSchema>;
