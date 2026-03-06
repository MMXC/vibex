/**
 * OpenAPI Generator for VibeX Backend
 * Generates OpenAPI 3.0 spec from Hono routes
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ==================== Types ====================

interface OpenAPIPath {
  [method: string]: {
    summary?: string;
    tags?: string[];
    responses: {
      [statusCode: string]: {
        description: string;
        content?: {
          [mediaType: string]: {
            schema?: object;
          };
        };
      };
    };
  };
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: {
    url: string;
    description: string;
  }[];
  paths: OpenAPIPath;
  components?: {
    schemas?: object;
  };
}

// ==================== Route Metadata ====================
// Manual mapping of routes to OpenAPI spec since we can't auto-detect from Hono at runtime

const ROUTE_METADATA: OpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'VibeX API',
    version: '1.0.0',
    description: 'VibeX Backend API - AI-Powered Application Builder',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
    {
      url: 'https://api.vibex.dev',
      description: 'Production server',
    },
  ],
  paths: {
    // Auth routes
    '/api/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'User registration',
        tags: ['Auth'],
        responses: {
          '201': {
            description: 'Registration successful',
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'User logout',
        tags: ['Auth'],
        responses: {
          '200': {
            description: 'Logout successful',
          },
        },
      },
    },
    // Projects routes
    '/api/projects': {
      get: {
        summary: 'List all projects',
        tags: ['Projects'],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new project',
        tags: ['Projects'],
        responses: {
          '201': {
            description: 'Project created',
          },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        summary: 'Get project by ID',
        tags: ['Projects'],
        responses: {
          '200': {
            description: 'Project details',
          },
        },
      },
      put: {
        summary: 'Update project',
        tags: ['Projects'],
        responses: {
          '200': {
            description: 'Project updated',
          },
        },
      },
      delete: {
        summary: 'Delete project',
        tags: ['Projects'],
        responses: {
          '200': {
            description: 'Project deleted',
          },
        },
      },
    },
    // Requirements routes
    '/api/requirements': {
      get: {
        summary: 'List all requirements',
        tags: ['Requirements'],
        responses: {
          '200': {
            description: 'List of requirements',
          },
        },
      },
      post: {
        summary: 'Create a new requirement',
        tags: ['Requirements'],
        responses: {
          '201': {
            description: 'Requirement created',
          },
        },
      },
    },
    '/api/requirements/{id}': {
      get: {
        summary: 'Get requirement by ID',
        tags: ['Requirements'],
        responses: {
          '200': {
            description: 'Requirement details',
          },
        },
      },
      put: {
        summary: 'Update requirement',
        tags: ['Requirements'],
        responses: {
          '200': {
            description: 'Requirement updated',
          },
        },
      },
      delete: {
        summary: 'Delete requirement',
        tags: ['Requirements'],
        responses: {
          '200': {
            description: 'Requirement deleted',
          },
        },
      },
    },
    // Domain Models routes
    '/api/domain-models': {
      get: {
        summary: 'List all domain models',
        tags: ['Domain Models'],
        responses: {
          '200': {
            description: 'List of domain models',
          },
        },
      },
      post: {
        summary: 'Create a new domain model',
        tags: ['Domain Models'],
        responses: {
          '201': {
            description: 'Domain model created',
          },
        },
      },
    },
    '/api/domain-models/{id}': {
      get: {
        summary: 'Get domain model by ID',
        tags: ['Domain Models'],
        responses: {
          '200': {
            description: 'Domain model details',
          },
        },
      },
      put: {
        summary: 'Update domain model',
        tags: ['Domain Models'],
        responses: {
          '200': {
            description: 'Domain model updated',
          },
        },
      },
      delete: {
        summary: 'Delete domain model',
        tags: ['Domain Models'],
        responses: {
          '200': {
            description: 'Domain model deleted',
          },
        },
      },
    },
    // Pages routes
    '/api/pages': {
      get: {
        summary: 'List all pages',
        tags: ['Pages'],
        responses: {
          '200': {
            description: 'List of pages',
          },
        },
      },
      post: {
        summary: 'Create a new page',
        tags: ['Pages'],
        responses: {
          '201': {
            description: 'Page created',
          },
        },
      },
    },
    '/api/pages/{id}': {
      get: {
        summary: 'Get page by ID',
        tags: ['Pages'],
        responses: {
          '200': {
            description: 'Page details',
          },
        },
      },
      put: {
        summary: 'Update page',
        tags: ['Pages'],
        responses: {
          '200': {
            description: 'Page updated',
          },
        },
      },
      delete: {
        summary: 'Delete page',
        tags: ['Pages'],
        responses: {
          '200': {
            description: 'Page deleted',
          },
        },
      },
    },
    // Chat routes
    '/api/chat': {
      post: {
        summary: 'Send chat message',
        tags: ['Chat'],
        responses: {
          '200': {
            description: 'Chat response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Flows routes
    '/api/flows': {
      get: {
        summary: 'List all flows',
        tags: ['Flows'],
        responses: {
          '200': {
            description: 'List of flows',
          },
        },
      },
      post: {
        summary: 'Create a new flow',
        tags: ['Flows'],
        responses: {
          '201': {
            description: 'Flow created',
          },
        },
      },
    },
    '/api/flows/{flowId}': {
      get: {
        summary: 'Get flow by ID',
        tags: ['Flows'],
        responses: {
          '200': {
            description: 'Flow details',
          },
        },
      },
      put: {
        summary: 'Update flow',
        tags: ['Flows'],
        responses: {
          '200': {
            description: 'Flow updated',
          },
        },
      },
      delete: {
        summary: 'Delete flow',
        tags: ['Flows'],
        responses: {
          '200': {
            description: 'Flow deleted',
          },
        },
      },
    },
    // Users routes
    '/api/users': {
      get: {
        summary: 'List all users',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'List of users',
          },
        },
      },
    },
    '/api/users/me': {
      get: {
        summary: 'Get current user',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'Current user details',
          },
        },
      },
    },
    // Messages routes
    '/api/messages': {
      get: {
        summary: 'List messages',
        tags: ['Messages'],
        responses: {
          '200': {
            description: 'List of messages',
          },
        },
      },
      post: {
        summary: 'Create a message',
        tags: ['Messages'],
        responses: {
          '201': {
            description: 'Message created',
          },
        },
      },
    },
    // Agents routes
    '/api/agents': {
      get: {
        summary: 'List all agents',
        tags: ['Agents'],
        responses: {
          '200': {
            description: 'List of agents',
          },
        },
      },
    },
    '/api/agents/{id}': {
      get: {
        summary: 'Get agent by ID',
        tags: ['Agents'],
        responses: {
          '200': {
            description: 'Agent details',
          },
        },
      },
    },
    // Prototype routes
    '/api/prototype/versions': {
      get: {
        summary: 'List prototype versions',
        tags: ['Prototype'],
        responses: {
          '200': {
            description: 'List of prototype versions',
          },
        },
      },
      post: {
        summary: 'Create prototype version',
        tags: ['Prototype'],
        responses: {
          '201': {
            description: 'Prototype version created',
          },
        },
      },
    },
    '/api/prototype/versions/{id}': {
      get: {
        summary: 'Get prototype version',
        tags: ['Prototype'],
        responses: {
          '200': {
            description: 'Prototype version details',
          },
        },
      },
      delete: {
        summary: 'Delete prototype version',
        tags: ['Prototype'],
        responses: {
          '200': {
            description: 'Prototype version deleted',
          },
        },
      },
    },
    '/api/prototype/snapshots': {
      get: {
        summary: 'List prototype snapshots',
        tags: ['Prototype'],
        responses: {
          '200': {
            description: 'List of snapshots',
          },
        },
      },
      post: {
        summary: 'Create prototype snapshot',
        tags: ['Prototype'],
        responses: {
          '201': {
            description: 'Snapshot created',
          },
        },
      },
    },
    // Component Generator routes
    '/api/component/generate': {
      post: {
        summary: 'Generate component from prompt',
        tags: ['Component Generator'],
        responses: {
          '200': {
            description: 'Generated component',
          },
        },
      },
    },
    // UI Generation routes
    '/api/ui/generate': {
      post: {
        summary: 'Generate UI from requirements',
        tags: ['UI Generation'],
        responses: {
          '200': {
            description: 'Generated UI',
          },
        },
      },
    },
    // Confirmation routes
    '/api/confirm/projects': {
      get: {
        summary: 'List confirmation projects',
        tags: ['Confirmation'],
        responses: {
          '200': {
            description: 'List of confirmation projects',
          },
        },
      },
    },
    // Clarification routes
    '/api/clarification/questions': {
      get: {
        summary: 'List clarification questions',
        tags: ['Clarification'],
        responses: {
          '200': {
            description: 'List of questions',
          },
        },
      },
      post: {
        summary: 'Submit clarification answer',
        tags: ['Clarification'],
        responses: {
          '200': {
            description: 'Answer submitted',
          },
        },
      },
    },
    // Requirements Analysis routes
    '/api/requirements/analyze': {
      post: {
        summary: 'Analyze requirements',
        tags: ['Requirements Analysis'],
        responses: {
          '200': {
            description: 'Analysis result',
          },
        },
      },
    },
    // Domain-Driven Design routes
    '/api/ddd/contexts': {
      get: {
        summary: 'List bounded contexts',
        tags: ['DDD'],
        responses: {
          '200': {
            description: 'List of bounded contexts',
          },
        },
      },
      post: {
        summary: 'Create bounded context',
        tags: ['DDD'],
        responses: {
          '201': {
            description: 'Bounded context created',
          },
        },
      },
    },
    '/api/ddd/entities': {
      get: {
        summary: 'List domain entities',
        tags: ['DDD'],
        responses: {
          '200': {
            description: 'List of entities',
          },
        },
      },
    },
    '/api/ddd/relations': {
      get: {
        summary: 'List entity relations',
        tags: ['DDD'],
        responses: {
          '200': {
            description: 'List of relations',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Requirement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
      DomainModel: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          entities: { type: 'array' },
          relationships: { type: 'array' },
        },
      },
      Page: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          components: { type: 'array' },
        },
      },
      Flow: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          nodes: { type: 'array' },
          edges: { type: 'array' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
        },
      },
    },
  },
};

// ==================== Export ====================

export default ROUTE_METADATA;

// CLI execution
if (import.meta.main) {
  const fs = require('fs');
  const path = require('path');
  
  const outputPath = process.argv[2] || 'openapi.json';
  
  fs.writeFileSync(outputPath, JSON.stringify(ROUTE_METADATA, null, 2));
  console.log(`✅ OpenAPI spec generated: ${outputPath}`);
}
