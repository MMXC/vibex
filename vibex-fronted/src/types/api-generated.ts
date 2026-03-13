/**
 * Auto-generated API Types
 * 
 * This file is auto-generated from OpenAPI spec.
 * Run `pnpm generate:types` to regenerate.
 * 
 * Note: If this file shows errors, run the dev server and execute:
 *   pnpm generate:types
 */

export interface paths {
  // Placeholder - run generate:types to populate
}

export interface components {
  schemas: {
    // Placeholder types - will be populated by generate:types
    BoundedContext: {
      id: string;
      name: string;
      description?: string;
      type?: 'core' | 'supporting' | 'generic';
    };
    BoundedContextResponse: {
      success: boolean;
      contexts: components['schemas']['BoundedContext'][];
      mermaidCode?: string;
    };
    DomainModel: {
      id: string;
      name: string;
      type: string;
      properties?: Array<{ name: string; type: string }>;
    };
    DomainModelResponse: {
      success: boolean;
      domainModels: components['schemas']['DomainModel'][];
    };
    BusinessFlow: {
      id: string;
      name: string;
      mermaidCode?: string;
    };
    BusinessFlowResponse: {
      success: boolean;
      businessFlow: components['schemas']['BusinessFlow'];
    };
  };
}

export type operations = Record<string, unknown>;
