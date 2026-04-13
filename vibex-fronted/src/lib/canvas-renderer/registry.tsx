/**
 * Canvas Renderer — Vibex Component Registry
 * 
 * React implementations for components defined in vibexCanvasCatalog.
 * Each component uses Tailwind CSS matching the Vibex design system.
 * 
 * These components use the signature expected by defineRegistry from @json-render/react:
 * ({ props, children }) => ReactElement
 * where props is the catalog component's props object (not the full render props).
 */
'use client';

import React from 'react';
import { defineRegistry } from '@json-render/react';
import { vibexCanvasCatalog } from './catalog';

// Type for props passed by defineRegistry to each component
type RegistryComponentProps<P> = { props: P; children?: React.ReactNode };

// Button component
const ButtonImpl = ({ props, emit, elementId }: RegistryComponentProps<{ label: string; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean }> & { emit?: (event: string, params?: Record<string, unknown>) => void; elementId?: string }) => {
  const { label, variant = 'primary', size = 'md', disabled = false } = props;
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]}`} disabled={disabled} onClick={() => emit?.('press', { nodeId: elementId, type: 'button' })}>
      {label}
    </button>
  );
};

// Card component  
const CardImpl = ({ props }: RegistryComponentProps<{ title: string; description?: string; footer?: string }>) => {
  const { title, description, footer } = props;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {footer && <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">{footer}</div>}
    </div>
  );
};

// Badge component
const BadgeImpl = ({ props }: RegistryComponentProps<{ text: string; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }>) => {
  const { text, variant = 'default' } = props;
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{text}</span>;
};

// StatCard component
const StatCardImpl = ({ props }: RegistryComponentProps<{ label: string; value: string; trend?: string; trendDirection?: 'up' | 'down' | 'neutral' }>) => {
  const { label, value, trend, trendDirection } = props;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {trend && <p className={`mt-1 text-xs ${trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{trend}</p>}
    </div>
  );
};

// Page component
const PageImpl = ({ props, children }: RegistryComponentProps<{ title: string; description?: string }> & { children?: React.ReactNode }) => {
  const { title } = props;
  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </header>
      <main className="p-6 flex-1 overflow-auto">{children}</main>
    </div>
  );
};

// Form component
const FormImpl = ({ props, children }: RegistryComponentProps<{ title?: string; fields?: Array<{ name: string; label: string; type: string; placeholder?: string; required?: boolean }>; submitLabel?: string }> & { children?: React.ReactNode }) => {
  const { title, fields = [], submitLabel = '提交' } = props;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>}
      <form className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea name={field.name} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
            ) : field.type === 'select' ? (
              <select name={field.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">请选择</option>
              </select>
            ) : (
              <input type={field.type} name={field.name} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
          </div>
        ))}
        <ButtonImpl {...({ props: { label: submitLabel, variant: 'primary' as const } })} />
        {children}
      </form>
    </div>
  );
};

// DataTable component
const DataTableImpl = ({ props }: RegistryComponentProps<{ title?: string; columns?: Array<{ key: string; label: string; sortable?: boolean }>; rows?: number; searchable?: boolean }>) => {
  const { title, columns = [], rows = 10, searchable = false } = props;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">{title || '数据表格'}</h3>
        {searchable && <input type="search" placeholder="搜索..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{columns.map((col) => <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-500">{col.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: Math.min(rows, 3) }).map((_, i) => (
              <tr key={i}>{columns.map((col) => <td key={col.key} className="px-4 py-2 text-gray-700">—</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// DetailView component
const DetailViewImpl = ({ props }: RegistryComponentProps<{ title: string; fields?: Array<{ label: string; value: string }>; actions?: Array<{ label: string; variant?: 'primary' | 'secondary' | 'danger' }> }>) => {
  const { title, fields = [], actions } = props;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <dl className="space-y-3">
        {fields?.map((f, i) => (
          <div key={i} className="flex"><dt className="w-24 text-sm text-gray-500 flex-shrink-0">{f.label}</dt><dd className="text-sm text-gray-900">{f.value}</dd></div>
        ))}
      </dl>
      {actions && <div className="mt-4 flex gap-2">{actions.map((a, i) => <ButtonImpl key={i} {...({ props: { label: a.label, variant: a.variant, size: 'sm' } })} />)}</div>}
    </div>
  );
};

// Modal component
const ModalImpl = ({ props, children }: RegistryComponentProps<{ title: string; size?: 'sm' | 'md' | 'lg'; content?: string }> & { children?: React.ReactNode }) => {
  const { title, size = 'md' } = props;
  const sizes: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={() => {}} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// Empty component
const EmptyImpl = ({ props }: RegistryComponentProps<{ title: string; description?: string }>) => {
  const { title, description } = props;
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <span className="text-gray-400 text-xl">📭</span>
      </div>
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
};

// Create registry using defineRegistry (handles { props } signature transformation)
const { registry: rawRegistry } = defineRegistry(vibexCanvasCatalog, {
  components: {
    Page: PageImpl,
    Form: FormImpl,
    DataTable: DataTableImpl,
    DetailView: DetailViewImpl,
    Modal: ModalImpl,
    Button: ButtonImpl,
    Card: CardImpl,
    Badge: BadgeImpl,
    StatCard: StatCardImpl,
    Empty: EmptyImpl,
  },
});

// MEMO: ESLint 豁免 - 2026-04-08
// Reason: rawRegistry 来自运行时 JSON import，类型系统无法推断 Registry 类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const vibexCanvasRegistry = rawRegistry as any;
