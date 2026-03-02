import { Context, Next } from 'hono';
import { ValidationError } from './errorHandler';

/**
 * Validation Rules
 */
export type ValidationRule = 
  | { type: 'required' }
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: RegExp }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'enum'; values: readonly string[] }
  | { type: 'email' }
  | { type: 'uuid' }
  | { type: 'array'; itemType?: ValidationRule }
  | { type: 'object'; schema: Record<string, ValidationRule> };

export interface FieldValidation {
  field: string;
  rules: ValidationRule[];
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorItem[];
  data?: Record<string, any>;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
  rule: string;
}

/**
 * Validate a single value against a rule
 */
function validateValue(value: any, rule: ValidationRule): ValidationErrorItem | null {
  // Handle undefined/null for non-required fields
  if (value === undefined || value === null) {
    if (rule.type === 'required') {
      return { field: '', message: 'Field is required', rule: 'required' };
    }
    return null;
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') {
        return { field: '', message: 'Must be a string', rule: 'string' };
      }
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return { field: '', message: `Must be at least ${rule.minLength} characters`, rule: 'string.minLength' };
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return { field: '', message: `Must be at most ${rule.maxLength} characters`, rule: 'string.maxLength' };
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return { field: '', message: 'Invalid format', rule: 'string.pattern' };
      }
      break;
    }

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return { field: '', message: 'Must be a number', rule: 'number' };
      }
      if (rule.integer && !Number.isInteger(num)) {
        return { field: '', message: 'Must be an integer', rule: 'number.integer' };
      }
      if (rule.min !== undefined && num < rule.min) {
        return { field: '', message: `Must be at least ${rule.min}`, rule: 'number.min' };
      }
      if (rule.max !== undefined && num > rule.max) {
        return { field: '', message: `Must be at most ${rule.max}`, rule: 'number.max' };
      }
      break;
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        // Also accept string 'true'/'false'
        if (value !== 'true' && value !== 'false') {
          return { field: '', message: 'Must be a boolean', rule: 'boolean' };
        }
      }
      break;
    }

    case 'enum': {
      if (!rule.values.includes(value)) {
        return { field: '', message: `Must be one of: ${rule.values.join(', ')}`, rule: 'enum' };
      }
      break;
    }

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { field: '', message: 'Must be a valid email', rule: 'email' };
      }
      break;
    }

    case 'uuid': {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        return { field: '', message: 'Must be a valid UUID', rule: 'uuid' };
      }
      break;
    }

    case 'array': {
      if (!Array.isArray(value)) {
        return { field: '', message: 'Must be an array', rule: 'array' };
      }
      if (rule.itemType) {
        for (let i = 0; i < value.length; i++) {
          const itemError = validateValue(value[i], rule.itemType);
          if (itemError) {
            return { 
              field: `[${i}]`, 
              message: itemError.message, 
              rule: `array.item.${itemError.rule}` 
            };
          }
        }
      }
      break;
    }

    case 'object': {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { field: '', message: 'Must be an object', rule: 'object' };
      }
      // Validate nested object
      const nestedResult = validateObject(value, rule.schema as unknown as ValidationSchema);
      if (!nestedResult.valid && nestedResult.errors.length > 0) {
        return { field: nestedResult.errors[0].field, message: nestedResult.errors[0].message, rule: 'object.nested' };
      }
      break;
    }
  }

  return null;
}

/**
 * Validate an object against a schema
 */
export function validateObject(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    for (const rule of rules) {
      const error = validateValue(value, rule);
      if (error) {
        errors.push({
          field,
          message: error.message,
          rule: error.rule,
        });
        // Only report first error per field
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined,
  };
}

/**
 * Hono middleware for validating request body
 */
export const validateBody = (schema: ValidationSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = validateObject(body, schema);

      if (!result.valid) {
        const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        throw new ValidationError(errorMessages, { fields: result.errors });
      }

      // Attach validated data to context
      c.set('validatedBody', result.data);
      await next();
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ValidationError('Invalid request body');
    }
  };
};

/**
 * Hono middleware for validating query parameters
 */
export const validateQuery = (schema: ValidationSchema) => {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = validateObject(query, schema);

    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      throw new ValidationError(errorMessages, { fields: result.errors });
    }

    // Attach validated query to context
    c.set('validatedQuery', result.data);
    await next();
  };
};

/**
 * Hono middleware for validating URL parameters
 */
export const validateParams = (schema: ValidationSchema) => {
  return async (c: Context, next: Next) => {
    const params = c.req.param();
    const result = validateObject(params, schema);

    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
      throw new ValidationError(errorMessages, { fields: result.errors });
    }

    // Attach validated params to context
    c.set('validatedParams', result.data);
    await next();
  };
};

/**
 * Combined validation middleware
 */
export const validate = (options: {
  body?: ValidationSchema;
  query?: ValidationSchema;
  params?: ValidationSchema;
}) => {
  return async (c: Context, next: Next) => {
    if (options.params) {
      const params = c.req.param();
      const result = validateObject(params, options.params);
      if (!result.valid) {
        const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        throw new ValidationError(errorMessages, { fields: result.errors });
      }
      c.set('validatedParams', result.data);
    }

    if (options.query) {
      const query = c.req.query();
      const result = validateObject(query, options.query);
      if (!result.valid) {
        const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        throw new ValidationError(errorMessages, { fields: result.errors });
      }
      c.set('validatedQuery', result.data);
    }

    if (options.body) {
      try {
        const body = await c.req.json();
        const result = validateObject(body, options.body);
        if (!result.valid) {
          const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ');
          throw new ValidationError(errorMessages, { fields: result.errors });
        }
        c.set('validatedBody', result.data);
      } catch (err) {
        if (err instanceof ValidationError) {
          throw err;
        }
        throw new ValidationError('Invalid request body');
      }
    }

    await next();
  };
};

/**
 * Helper to get validated data from context
 */
export const getValidatedBody = (c: Context): Record<string, any> | undefined => {
  return c.get('validatedBody');
};

export const getValidatedQuery = (c: Context): Record<string, any> | undefined => {
  return c.get('validatedQuery');
};

export const getValidatedParams = (c: Context): Record<string, any> | undefined => {
  return c.get('validatedParams');
};

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // ID validation
  id: {
    id: [{ type: 'string' as const, minLength: 1 }],
  },
  
  uuid: {
    id: [{ type: 'uuid' as const }],
  },

  // Pagination
  pagination: {
    page: [{ type: 'number' as const, min: 1 }],
    pageSize: [{ type: 'number' as const, min: 1, max: 100 }],
  },

  // Email
  email: {
    email: [{ type: 'email' as const }],
  },

  // Boolean
  boolean: {
    enabled: [{ type: 'boolean' as const }],
  },
};

/**
 * Pre-defined validation schemas for common routes
 */
export const routeSchemas = {
  // Chat API
  chat: {
    body: {
      message: [{ type: 'string' as const, minLength: 1 }],
      conversationId: [{ type: 'string' as const }],
    },
  },

  // Agent routes
  agentId: {
    params: {
      id: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  agentUpdate: {
    params: {
      id: [{ type: 'string' as const, minLength: 1 }],
    },
    body: {
      name: [{ type: 'string' as const, maxLength: 255 }],
      prompt: [{ type: 'string' as const }],
      model: [{ type: 'string' as const }],
      temperature: [{ type: 'number' as const, min: 0, max: 2 }],
    },
  },

  // Domain Entity routes
  domainEntityList: {
    query: {
      projectId: [{ type: 'string' as const }],
      requirementId: [{ type: 'string' as const }],
    },
  },

  domainEntityCreate: {
    body: {
      projectId: [{ type: 'string' as const, minLength: 1 }],
      name: [{ type: 'string' as const, minLength: 1, maxLength: 255 }],
      type: [{ type: 'string' as const, minLength: 1 }],
      description: [{ type: 'string' as const }],
      properties: [{ type: 'string' as const }],
      requirementId: [{ type: 'string' as const }],
    },
  },

  // Flow routes
  flowId: {
    params: {
      flowId: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  // Project routes
  projectId: {
    params: {
      id: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  projectCreate: {
    body: {
      name: [{ type: 'string' as const, minLength: 1, maxLength: 255 }],
      description: [{ type: 'string' as const }],
    },
  },

  // Page routes
  pageId: {
    params: {
      id: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  // Message routes
  messageId: {
    params: {
      messageId: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  // Requirement routes
  requirementId: {
    params: {
      id: [{ type: 'string' as const, minLength: 1 }],
    },
  },

  requirementCreate: {
    body: {
      projectId: [{ type: 'string' as const, minLength: 1 }],
      title: [{ type: 'string' as const, minLength: 1, maxLength: 500 }],
      description: [{ type: 'string' as const }],
      priority: [{ type: 'enum' as const, values: ['low', 'medium', 'high', 'critical'] as readonly string[] }],
      status: [{ type: 'enum' as const, values: ['draft', 'active', 'completed', 'archived'] as readonly string[] }],
    },
  },

  // Prototype snapshot routes
  prototypeSnapshotCreate: {
    body: {
      projectId: [{ type: 'string' as const, minLength: 1 }],
      flowId: [{ type: 'string' as const, minLength: 1 }],
      snapshot: [{ type: 'string' as const }],
    },
  },
};
