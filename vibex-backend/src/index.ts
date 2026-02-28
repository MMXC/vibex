import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { getEnv } from './lib/env';
import projects from './routes/projects';
import pages from './routes/pages';
import agents from './routes/agents';
import chat from './routes/chat';
import auth from './routes/auth';
import users from './routes/users';
import messages from './routes/messages';
import flows from './routes/flows';

// 获取环境变量
const env = getEnv();

// 创建 Hono 应用，绑定环境变量类型
const app = new Hono<{ Bindings: typeof env }>();

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
  
  serve({
    fetch: app.fetch,
    port,
  });
}
