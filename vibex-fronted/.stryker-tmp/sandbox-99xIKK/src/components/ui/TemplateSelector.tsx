// @ts-nocheck
import React from 'react';
import styles from './TemplateSelector.module.css';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
}

export interface TemplateSelectorProps {
  templates: Template[];
  selectedId?: string;
  onSelect?: (templateId: string) => void;
  title?: string;
  multiple?: boolean;
}

export default function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  title = '选择模板',
  multiple = false,
}: TemplateSelectorProps) {
  // Group templates by category
  const categories = templates.reduce(
    (acc, template) => {
      const category = template.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, Template[]>
  );

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}

      <div className={styles.grid}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`${styles.card} ${
              selectedId === template.id ? styles.selected : ''
            }`}
            onClick={() => onSelect?.(template.id)}
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={selectedId === template.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(template.id);
              }
            }}
          >
            {template.icon && (
              <div className={styles.icon}>{template.icon}</div>
            )}
            <div className={styles.name}>{template.name}</div>
            <div className={styles.description}>{template.description}</div>
            {selectedId === template.id && (
              <div className={styles.checkmark}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Common template presets
export const commonTemplates: Template[] = [
  {
    id: 'ecommerce',
    name: '电商系统',
    description: '商品展示、购物车、订单管理、支付集成',
    icon: '🛒',
    category: 'business',
  },
  {
    id: 'crm',
    name: 'CRM 系统',
    description: '客户管理、销售跟踪、数据分析报表',
    icon: '👥',
    category: 'business',
  },
  {
    id: 'cms',
    name: '内容管理系统',
    description: '文章发布、用户管理、权限控制',
    icon: '📝',
    category: 'content',
  },
  {
    id: 'saas',
    name: 'SaaS 平台',
    description: '多租户、订阅管理、计费系统',
    icon: '☁️',
    category: 'business',
  },
  {
    id: 'dashboard',
    name: '数据仪表盘',
    description: '数据可视化、图表展示、实时监控',
    icon: '📊',
    category: 'analytics',
  },
  {
    id: 'social',
    name: '社交平台',
    description: '用户动态、消息通知、好友关系',
    icon: '🌐',
    category: 'social',
  },
  {
    id: 'education',
    name: '在线教育',
    description: '课程管理、视频播放、学习进度追踪',
    icon: '🎓',
    category: 'education',
  },
  {
    id: 'custom',
    name: '自定义',
    description: '根据您的具体需求定制开发',
    icon: '⚙️',
    category: 'other',
  },
];
