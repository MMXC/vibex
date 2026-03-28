import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { CloudflareEnv, getLocalEnv } from './lib/env';
import projects from './routes/projects';
import projectId from './routes/projects.$id';
import pages from './routes/pages';
import pageIdComponents from './routes/pages.$id.components';
import agents from './routes/agents';
import chat from './routes/chat';
import auth from './routes/auth';
import users from './routes/users';
import messages from './routes/messages';
import flows from './routes/flows';
import flowData from './routes/flow-data';
import requirements from './routes/requirements';
import requirementId from './routes/requirements.$id';
import prototypeSnapshots from './routes/prototype-snapshots';
import prototypeSnapshotId from './routes/prototype-snapshots.$id';
import domainEntities from './routes/domain-entities';
import domainEntityId from './routes/domain-entities.$id';
import domainModels from './routes/domain-models';
import entityRelations from './routes/entity-relations';
import entityRelationId from './routes/entity-relations.$id';
import branches from './routes/branches';
import branchId from './routes/branches.$id';
import requirementsAnalysis from './routes/requirements-analysis';
import clarificationQuestions from './routes/clarification-questions';
import componentGenerator from './routes/component-generator';
import prototypeCollaboration from './routes/prototype-collaboration';
import confirmationProjects from './routes/confirmation-projects';
import prototypeCollaborationId from './routes/prototype-collaboration.$id';
import collaboration from './routes/collaboration';
import collaborationRealtime from './routes/collaboration-realtime';
import aiDesignChat from './routes/ai-design-chat';
import aiUIGeneration from './routes/ai-ui-generation';
import prototypeVersions from './routes/prototype-versions';
import version from './routes/version';
import componentManager from './routes/component-manager';
import livePreview from './routes/live-preview';
import prototypeExport from './routes/prototype-export';
import prototypeChat from './routes/prototype-chat';
import uiGeneration from './routes/ui-generation';
import requirementsExport from './routes/requirements-export';
import projectSettings from './routes/project-settings';
import ddd from './routes/ddd';

import businessDomain from './routes/business-domain';
import flow from './routes/flow';
import stepState from './routes/step-state';
import templates from './routes/templates';
import uiNodes from './routes/ui-nodes';
import diagnosis from './routes/diagnosis';
import plan from './routes/plan';

// API Gateway v1 路由
import v1 from './routes/v1/gateway';

// 创建 Hono 应用，绑定 Cloudflare 环境变量类型
const app = new Hono<{ Bindings: CloudflareEnv }>();

// CORS 配置 - 支持前端跨域访问
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoints
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'VibeX API is running on Cloudflare Workers (Hono)',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 'N/A',
  });
});

// API Routes
app.route('/api/projects', projects);
app.route('/api/projects/:id', projectId);
app.route('/api/pages', pages);
app.route('/api/pages/:id/components', pageIdComponents);
app.route('/api/agents', agents);
app.route('/api/chat', chat);
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/messages', messages);
app.route('/api/flows', flows);
app.route('/api/flow-data', flowData);
app.route('/api/requirements', requirements);
app.route('/api/requirements', requirementId);
app.route('/api/prototype-snapshots', prototypeSnapshots);
app.route('/api/prototype-snapshots', prototypeSnapshotId);
app.route('/api/domain-entities', domainEntities);
app.route('/api/domain-entities', domainEntityId);
app.route('/api/domain-models', domainModels);
app.route('/api/entity-relations', entityRelations);
app.route('/api/entity-relations', entityRelationId);
app.route('/api/branches', branches);
app.route('/api/branches', branchId);
app.route('/api/requirements-analysis', requirementsAnalysis);
app.route('/api/clarification-questions', clarificationQuestions);
app.route('/api/prototype-collaboration', prototypeCollaboration);
app.route('/api/prototype-collaboration', prototypeCollaborationId);
app.route('/api/collaboration', collaboration);
app.route('/api/collaboration-realtime', collaborationRealtime);
app.route('/api/ai-design-chat', aiDesignChat);
app.route('/api/ai-ui-generation', aiUIGeneration);
app.route('/api/prototype-versions', prototypeVersions);
app.route('/api/components', componentManager);
app.route('/api/live-preview', livePreview);
app.route('/api/prototype-export', prototypeExport);
app.route('/api/prototype/chat', prototypeChat);
app.route('/api/ui-generation', uiGeneration);
app.route('/api/version', version);
app.route('/api/requirements-export', requirementsExport);
app.route('/api/projects/:id/settings', projectSettings);
app.route('/api/confirmation-projects', confirmationProjects);
app.route('/api/ddd', ddd);

app.route('/api/business-domain', businessDomain);
app.route('/api/flow', flow);
app.route('/api/step-state', stepState);
app.route('/api/templates', templates);
app.route('/api/ui-nodes', uiNodes);
app.route('/api/diagnosis', diagnosis);
app.route('/api/plan', plan);

// API Gateway v1 路由 (支持认证、限流、日志中间件)
app.route('/v1', v1);
// 兼容 /api/v1 前缀 (Next.js routes use /api/v1/*)
app.route('/api/v1', v1);

// 导出 for Cloudflare Workers
export default app;

// 导出 Durable Object 类 (Cloudflare Workers 需要)
export { CollaborationRoom } from './websocket/CollaborationRoom';

// 仅在本地开发时启动服务器
if (process.env.NODE_ENV !== 'production') {
  const port = parseInt(process.env.PORT || '3000');
  console.log(`Server running on http://localhost:${port}`);
  
  // 本地开发时，注入本地环境变量到 globalThis
  const localEnv = getLocalEnv();
  (globalThis as any).__VIBEX_LOCAL_ENV__ = localEnv;
  
  serve({
    fetch: (request) => {
      // 为本地开发模拟 Cloudflare 的 env 注入
      return app.fetch(request, localEnv);
    },
    port,
  });
}