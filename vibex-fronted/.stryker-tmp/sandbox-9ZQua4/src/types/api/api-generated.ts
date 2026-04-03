/**
 * API 类型自动生成文件占位
 * 实际类型应从 OpenAPI schema 生成
 */
// @ts-nocheck


export interface components {
  schemas: {
    BoundedContext: {
      id: string;
      name: string;
      description?: string;
    };
    BoundedContextResponse: {
      boundedContexts: components['schemas']['BoundedContext'][];
    };
    DomainModel: {
      id: string;
      name: string;
      type: string;
      attributes?: Record<string, unknown>[];
    };
    DomainModelResponse: {
      domainModels: components['schemas']['DomainModel'][];
    };
    BusinessFlow: {
      id: string;
      name: string;
      states: string[];
      transitions: { from: string; to: string; event: string }[];
    };
    BusinessFlowResponse: {
      businessFlow: components['schemas']['BusinessFlow'];
    };
  };
}

export interface paths {
  '/ddd/bounded-context': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            requirementText: string;
            projectId?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['BoundedContextResponse'];
          };
        };
      };
    };
  };
  '/ddd/domain-model': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            boundedContexts: components['schemas']['BoundedContext'][];
            requirementText: string;
            projectId?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['DomainModelResponse'];
          };
        };
      };
    };
  };
  '/ddd/business-flow': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            domainModels: components['schemas']['DomainModel'][];
            requirementText: string;
            projectId?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['BusinessFlowResponse'];
          };
        };
      };
    };
  };
}

export interface operations {
  generateBoundedContext: paths['/ddd/bounded-context']['post'];
  generateDomainModel: paths['/ddd/domain-model']['post'];
  generateBusinessFlow: paths['/ddd/business-flow']['post'];
}