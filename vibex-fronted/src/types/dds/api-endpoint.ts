/**
 * API Endpoint Card Type
 * E1-U1
 */

import type { BaseCard } from './base';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
  example?: string;
}

export interface APIResponse {
  status: number;
  description: string;
  schema?: string;
}

export interface APIEndpointCard extends BaseCard {
  type: 'api-endpoint';
  method: HTTPMethod;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: APIParameter[];
  requestBody?: {
    contentType: string;
    schema?: string;
    example?: string;
  };
  responses?: APIResponse[];
  security?: string[];
}
