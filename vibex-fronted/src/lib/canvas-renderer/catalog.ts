/**
 * Canvas Renderer — Vibex Component Catalog
 * 
 * Defines Zod schemas for Canvas component types.
 * AI can only generate components defined here (Catalog as Guardrail).
 */
import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

// Define catalog using the React schema and Zod prop schemas.
// Cast to any to bypass Zod v4 type variance quirks with InferCatalogInput.
const rawCatalog = defineCatalog(schema, {
  components: {
    Page: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      description: '页面容器 (Canvas ComponentType: page)',
      slots: ['default'],
    },
    Form: {
      props: z.object({
        title: z.string(),
        fields: z.array(z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(['text', 'email', 'password', 'select', 'textarea', 'date', 'number']),
          placeholder: z.string().optional(),
          required: z.boolean().default(false),
        })),
        submitLabel: z.string().default('提交'),
      }),
      description: '表单容器 (Canvas ComponentType: form)',
      slots: ['default'],
    },
    DataTable: {
      props: z.object({
        title: z.string(),
        columns: z.array(z.object({ key: z.string(), label: z.string(), sortable: z.boolean().default(false) })),
        rows: z.number().default(10),
        searchable: z.boolean().default(false),
      }),
      description: '数据表格 (Canvas ComponentType: list)',
      slots: ['default'],
    },
    DetailView: {
      props: z.object({
        title: z.string(),
        fields: z.array(z.object({ label: z.string(), value: z.string() })),
        actions: z.array(z.object({ label: z.string(), variant: z.enum(['primary', 'secondary', 'danger']) })).optional(),
      }),
      description: '详情页 (Canvas ComponentType: detail)',
      slots: ['default'],
    },
    Modal: {
      props: z.object({
        title: z.string(),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
        content: z.string().optional(),
      }),
      description: '弹窗 (Canvas ComponentType: modal)',
      slots: ['default'],
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(['primary', 'secondary', 'danger', 'ghost']).default('primary'),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
        disabled: z.boolean().default(false),
      }),
    },
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
        footer: z.string().optional(),
      }),
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'success', 'warning', 'error', 'info']).default('default'),
      }),
    },
    StatCard: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        trend: z.string().optional(),
        trendDirection: z.enum(['up', 'down', 'neutral']).optional(),
      }),
    },
    Empty: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
    },
  },
} as Parameters<typeof defineCatalog>[1]);

// Re-export with proper type via cast-through-unknown
// MEMO: ESLint 豁免 - 2026-04-08
// Reason: rawCatalog 来自运行时 JSON import，无法静态类型推断，必须用 as any 中转
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const vibexCanvasCatalog = rawCatalog as any as ReturnType<typeof defineCatalog>;

export type VibexCanvasCatalog = typeof vibexCanvasCatalog;
