/**
 * UI Schema Service
 * 
 * Parses UI Schema and generates React component code.
 * Supports component definitions, property validation, and code generation.
 */

/**
 * UI Schema Component Types
 */
export type UIComponentType = 
  | 'form'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'button'
  | 'card'
  | 'list'
  | 'grid'
  | 'flex'
  | 'text'
  | 'image'
  | 'divider'
  | 'modal'
  | 'drawer'
  | 'tabs'
  | 'table'
  | 'datepicker'
  | 'upload';

/**
 * UI Schema Field Types
 */
export type UIFieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'array'
  | 'object'
  | 'textarea';

/**
 * UI Component Property
 */
export interface UIProperty {
  name: string;
  type: UIFieldType;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  options?: { label: string; value: unknown }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/**
 * UI Schema Component Definition
 */
export interface UIComponent {
  id: string;
  name: string;
  type: UIComponentType;
  description?: string;
  props?: Record<string, unknown>;
  children?: UIComponent[];
  events?: {
    onClick?: string;
    onChange?: string;
    onSubmit?: string;
    onBlur?: string;
    [key: string]: string | undefined;
  };
  styles?: Record<string, unknown>;
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: unknown;
  };
}

/**
 * UI Schema Form Field
 */
export interface UIFormField {
  id: string;
  name: string;
  label?: string;
  type: UIFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  helpText?: string;
  condition?: UIComponent['condition'];
}

/**
 * UI Schema Form Definition
 */
export interface UIFormSchema {
  id: string;
  name: string;
  title?: string;
  description?: string;
  fields: UIFormField[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  submitLabel?: string;
  resetLabel?: string;
  onSubmit?: string;
  onReset?: string;
}

/**
 * UI Schema Page Definition
 */
export interface UIPageSchema {
  id: string;
  name: string;
  title?: string;
  description?: string;
  components: UIComponent[];
  layout?: {
    type: 'flex' | 'grid' | 'stack';
    gap?: number;
    direction?: 'row' | 'column';
    columns?: number;
  };
  styles?: Record<string, unknown>;
}

/**
 * UI Schema Root
 */
export interface UISchema {
  version: string;
  type: 'page' | 'form' | 'component';
  data: UIPageSchema | UIFormSchema | UIComponent;
}

/**
 * Component Registry for Code Generation
 */
interface ComponentConfig {
  type: UIComponentType;
  componentName: string;
  propTypes: string;
  defaultProps?: Record<string, unknown>;
}

const COMPONENT_REGISTRY: ComponentConfig[] = [
  { type: 'form', componentName: 'Form', propTypes: 'React.FormHTMLAttributes<HTMLFormElement>' },
  { type: 'input', componentName: 'Input', propTypes: 'React.InputHTMLAttributes<HTMLInputElement>' },
  { type: 'textarea', componentName: 'Textarea', propTypes: 'React.TextareaHTMLAttributes<HTMLTextAreaElement>' },
  { type: 'select', componentName: 'Select', propTypes: 'React.SelectHTMLAttributes<HTMLSelectElement>' },
  { type: 'checkbox', componentName: 'Checkbox', propTypes: 'React.InputHTMLAttributes<HTMLInputElement>' },
  { type: 'radio', componentName: 'Radio', propTypes: 'React.InputHTMLAttributes<HTMLInputElement>' },
  { type: 'switch', componentName: 'Switch', propTypes: 'SwitchProps' },
  { type: 'button', componentName: 'Button', propTypes: 'React.ButtonHTMLAttributes<HTMLButtonElement>' },
  { type: 'card', componentName: 'Card', propTypes: 'CardProps' },
  { type: 'list', componentName: 'List', propTypes: 'ListProps' },
  { type: 'grid', componentName: 'Grid', propTypes: 'GridProps' },
  { type: 'flex', componentName: 'Flex', propTypes: 'FlexProps' },
  { type: 'text', componentName: 'Text', propTypes: 'TextProps' },
  { type: 'image', componentName: 'Image', propTypes: 'React.ImgHTMLAttributes<HTMLImageElement>' },
  { type: 'divider', componentName: 'Divider', propTypes: 'DividerProps' },
  { type: 'modal', componentName: 'Modal', propTypes: 'ModalProps' },
  { type: 'drawer', componentName: 'Drawer', propTypes: 'DrawerProps' },
  { type: 'tabs', componentName: 'Tabs', propTypes: 'TabsProps' },
  { type: 'table', componentName: 'Table', propTypes: 'TableProps' },
  { type: 'datepicker', componentName: 'DatePicker', propTypes: 'DatePickerProps' },
  { type: 'upload', componentName: 'Upload', propTypes: 'UploadProps' },
];

/**
 * Validate UI Schema
 */
export function validateUISchema(schema: UISchema): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema.version) {
    errors.push('Schema version is required');
  }

  if (!schema.type) {
    errors.push('Schema type is required');
  }

  if (!schema.data) {
    errors.push('Schema data is required');
  }

  // Validate based on type
  if (schema.type === 'form') {
    const formData = schema.data as UIFormSchema;
    if (!formData.fields || formData.fields.length === 0) {
      errors.push('Form must have at least one field');
    }
    formData.fields?.forEach((field, index) => {
      if (!field.name) {
        errors.push(`Field at index ${index} must have a name`);
      }
      if (!field.type) {
        errors.push(`Field ${field.name || index} must have a type`);
      }
    });
  } else if (schema.type === 'page') {
    const pageData = schema.data as UIPageSchema;
    if (!pageData.components || pageData.components.length === 0) {
      errors.push('Page must have at least one component');
    }
  } else if (schema.type === 'component') {
    const componentData = schema.data as UIComponent;
    if (!componentData.type) {
      errors.push('Component must have a type');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate React Component Code from UI Schema
 */
export function generateComponentCode(schema: UISchema): string {
  const { type, data } = schema;

  if (type === 'form') {
    return generateFormCode(data as UIFormSchema);
  } else if (type === 'page') {
    return generatePageCode(data as UIPageSchema);
  } else if (type === 'component') {
    return generateSingleComponentCode(data as UIComponent);
  }

  return '// Unknown schema type';
}

/**
 * Generate Form Component Code
 */
function generateFormCode(form: UIFormSchema): string {
  const fieldImports = new Set<string>(['React']);
  const fieldCode = form.fields.map(field => generateFieldCode(field)).join('\n\n');

  return `import React, { useState } from 'react';
${generateImports(form)}

/**
 * ${form.title || form.name} Form Component
 * Generated from UI Schema
 */
${form.description ? `// ${form.description}` : ''}
export function ${pascalCase(form.name)}Form({ 
  initialValues, 
  onSubmit, 
  onReset 
}: {
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void;
  onReset?: () => void;
}) {
  const [values, setValues] = useState(initialValues || {});

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const handleReset = () => {
    setValues({});
    onReset?.();
  };

  return (
    <form onSubmit={handleSubmit} className="${form.layout || 'vertical'}-form">
      ${form.title ? `<h2>${form.title}</h2>` : ''}
      ${form.description ? `<p className="form-description">${form.description}</p>` : ''}
      
      ${fieldCode}
      
      <div className="form-actions">
        ${form.submitLabel ? `<button type="submit">${form.submitLabel}</button>` : '<button type="submit">Submit</button>'}
        ${form.resetLabel ? `<button type="button" onClick={handleReset}>${form.resetLabel}</button>` : ''}
      </div>
    </form>
  );
}

export default ${pascalCase(form.name)}Form;
`;
}

/**
 * Generate Field Code
 */
function generateFieldCode(field: UIFormField): string {
  const required = field.required ? ' *' : '';
  const label = field.label || pascalCase(field.name);
  
  let inputCode = '';
  switch (field.type) {
    case 'select':
      inputCode = `
        <select
          name="${field.name}"
          value={values.${field.name} || ''}
          onChange={(e) => handleChange('${field.name}', e.target.value)}
          disabled={${field.disabled || false}}
        >
          <option value="">Select...</option>
          ${field.options?.map(opt => `<option key="${opt.value}" value="${opt.value}">${opt.label}</option>`).join('\n          ') || ''}
        </select>`;
      break;
    case 'textarea':
      inputCode = `
        <textarea
          name="${field.name}"
          value={values.${field.name} || ''}
          onChange={(e) => handleChange('${field.name}', e.target.value)}
          placeholder="${field.placeholder || ''}"
          disabled={${field.disabled || false}}
        />`;
      break;
    case 'boolean':
      inputCode = `
        <input
          type="checkbox"
          name="${field.name}"
          checked={values.${field.name} || false}
          onChange={(e) => handleChange('${field.name}', e.target.checked)}
          disabled={${field.disabled || false}}
        />`;
      break;
    case 'multiselect':
      inputCode = `
        <select
          name="${field.name}"
          multiple
          value={values.${field.name} || []}
          onChange={(e) => handleChange('${field.name}', Array.from(e.target.selectedOptions, option => option.value))}
          disabled={${field.disabled || false}}
        >
          ${field.options?.map(opt => `<option key="${opt.value}" value="${opt.value}">${opt.label}</option>`).join('\n          ') || ''}
        </select>`;
      break;
    default:
      inputCode = `
        <input
          type="${field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}"
          name="${field.name}"
          value={values.${field.name} || ''}
          onChange={(e) => handleChange('${field.name}', ${field.type === 'number' ? 'Number(e.target.value)' : 'e.target.value'})}
          placeholder="${field.placeholder || ''}"
          disabled={${field.disabled || false}}
        />`;
  }

  return `      <div className="form-field">
        <label htmlFor="${field.name}">
          ${label}${required}
        </label>
        ${inputCode}
        ${field.helpText ? `<span className="help-text">${field.helpText}</span>` : ''}
      </div>`;
}

/**
 * Generate Page Component Code
 */
function generatePageCode(page: UIPageSchema): string {
  const componentCode = page.components.map(comp => generateSingleComponentCode(comp)).join('\n\n');

  return `import React from 'react';
${generatePageImports(page)}

/**
 * ${page.title || page.name} Page Component
 * Generated from UI Schema
 */
${page.description ? `// ${page.description}` : ''}
export function ${pascalCase(page.name)}Page() {
  return (
    <div className="${kebabCase(page.name)}-page"${page.styles ? ` style={${JSON.stringify(page.styles)}}` : ''}>
      ${page.title ? `<h1>${page.title}</h1>` : ''}
      
      ${componentCode}
    </div>
  );
}

export default ${pascalCase(page.name)}Page;
`;
}

/**
 * Generate Single Component Code
 */
function generateSingleComponentCode(component: UIComponent): string {
  const config = COMPONENT_REGISTRY.find(c => c.type === component.type);
  const componentName = config?.componentName || pascalCase(component.type);
  
  const props = component.props ? `{ ${Object.entries(component.props).map(([k, v]) => `${k}={${JSON.stringify(v)}}`).join(', ')} }` : '';
  const children = component.children?.map(child => generateSingleComponentCode(child)).join('\n      ') || '';
  
  const events = component.events ? Object.entries(component.events)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}={${v}}`)
    .join(' ') : '';

  if (component.children && component.children.length > 0) {
    return `      <${componentName} ${props} ${events}>
        ${children}
      </${componentName}>`;
  }

  return `      <${componentName} ${props} ${events} />`;
}

/**
 * Generate imports for form
 */
function generateImports(form: UIFormSchema): string {
  const imports = ['React'];
  
  form.fields.forEach(field => {
    if (field.type === 'select' || field.type === 'multiselect') {
      imports.push('Select');
    } else if (field.type === 'textarea') {
      imports.push('Textarea');
    } else if (field.type === 'date') {
      imports.push('DatePicker');
    }
  });

  return `// Components: ${[...new Set(imports)].join(', ')}\n// Add your component imports here`;
}

/**
 * Generate imports for page
 */
function generatePageImports(page: UIPageSchema): string {
  const componentTypes = new Set<string>();
  
  page.components.forEach(comp => {
    componentTypes.add(comp.type);
    comp.children?.forEach(child => componentTypes.add(child.type));
  });

  const config = COMPONENT_REGISTRY.filter(c => componentTypes.has(c.type));
  const imports = config.map(c => c.componentName);

  return `// Components: ${imports.join(', ')}\n// Add your component imports here`;
}

/**
 * Convert string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, char => char.toUpperCase());
}

/**
 * Convert string to kebab-case
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert UI Schema to component tree for rendering
 */
export function parseUISchema(schema: UISchema): {
  type: string;
  name: string;
  components: unknown[];
  fields?: unknown[];
} {
  const { type, data } = schema;

  if (type === 'form') {
    const formData = data as UIFormSchema;
    return {
      type: 'form',
      name: formData.name,
      components: [],
      fields: formData.fields,
    };
  }

  if (type === 'page') {
    const pageData = data as UIPageSchema;
    return {
      type: 'page',
      name: pageData.name,
      components: pageData.components,
    };
  }

  if (type === 'component') {
    const compData = data as UIComponent;
    return {
      type: 'component',
      name: compData.name,
      components: compData.children || [],
    };
  }

  return { type: 'unknown', name: '', components: [] };
}

/**
 * Extract all field names from UI Schema
 */
export function extractFieldNames(schema: UISchema): string[] {
  if (schema.type === 'form') {
    const formData = schema.data as UIFormSchema;
    return formData.fields?.map(f => f.name) || [];
  }
  return [];
}

/**
 * Extract all component types from UI Schema
 */
export function extractComponentTypes(schema: UISchema): UIComponentType[] {
  const types: UIComponentType[] = [];
  
  function traverse(data: unknown) {
    if (data.type) {
      types.push(data.type);
    }
    if (data.components) {
      data.components.forEach(traverse);
    }
    if (data.children) {
      data.children.forEach(traverse);
    }
  }

  traverse(schema.data);
  return [...new Set(types)];
}

/**
 * Get component registry
 */
export function getComponentRegistry(): ComponentConfig[] {
  return COMPONENT_REGISTRY;
}

/**
 * Find component config by type
 */
export function getComponentConfig(type: UIComponentType): ComponentConfig | undefined {
  return COMPONENT_REGISTRY.find(c => c.type === type);
}

export default {
  validateUISchema,
  generateComponentCode,
  parseUISchema,
  extractFieldNames,
  extractComponentTypes,
  getComponentRegistry,
  getComponentConfig,
};
