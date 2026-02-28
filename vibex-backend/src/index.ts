import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { CloudflareEnv, getLocalEnv } from './lib/env';
import projects from './routes/projects';
import pages from './routes/pages';
import agents from './routes/agents';
import chat from './routes/chat';
import auth from './routes/auth';
import users from './routes/users';
import messages from './routes/messages';
import flows from './routes/flows';

// 创建 Hono 应用，绑定 Cloudflare 环境变量类型
const app = new Hono<{ Bindings: CloudflareEnv }>();

// CORS 配置 - 支持前端跨域访问
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'VibeX API is running on Cloudflare Workers (Hono)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route('/api/projects', projects);
app.route('/api/pages', pages);
app.route('/api/agents', agents);
app.route('/api/chat', chat);
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/messages', messages);
app.route('/api/flows', flows);

// 导出 for Cloudflare Workers
export default app;

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