/**
 * API Gateway - v1 版本路由
 * 
 * 包含以下中间件：
 * - 认证中间件 (JWT 验证)
 * - 限流中间件 (Token Bucket)
 * - 日志中间件 (访问日志)
 * - 错误处理 (统一错误响应)
 * 
 * 路由前缀: /v1/*
 */
// @ts-nocheck


import { Hono } from 'hono';
import { authMiddleware } from '../../lib/auth';
import { rateLimit } from '../../lib/rateLimit';
import { logger } from '../../lib/logger';
import { errorHandler, notFoundHandler } from '../../lib/errorHandler';
import analyzeStream from './analyze/stream';
import canvas from './canvas';
import canvasStream from './canvas/stream';
import canvasSnapshots from './canvas/snapshots';
import canvasRollback from './canvas/rollback';

// 导入所有 API 路由
import projects from '../projects';
import projectId from '../projects.$id';
import pages from '../pages';
import pageIdComponents from '../pages.$id.components';
import agents from '../agents';
import chat from '../chat';
import auth from '../auth';
import users from '../users';
import messages from '../messages';
import flows from '../flows';
import flowData from '../flow-data';
import requirements from '../requirements';
import requirementId from '../requirements.$id';
import prototypeSnapshots from '../prototype-snapshots';
import prototypeSnapshotId from '../prototype-snapshots.$id';
import domainEntities from '../domain-entities';
import domainEntityId from '../domain-entities.$id';
import domainModels from '../domain-models';
import entityRelations from '../entity-relations';
import entityRelationId from '../entity-relations.$id';
import branches from '../branches';
import branchId from '../branches.$id';
import requirementsAnalysis from '../requirements-analysis';
import clarificationQuestions from '../clarification-questions';
import componentGenerator from '../component-generator';
import prototypeCollaboration from '../prototype-collaboration';
import confirmationProjects from '../confirmation-projects';
import prototypeCollaborationId from '../prototype-collaboration.$id';
import collaboration from '../collaboration';
import aiDesignChat from '../ai-design-chat';
import aiUIGeneration from '../ai-ui-generation';
import prototypeVersions from '../prototype-versions';
import version from '../version';
import componentManager from '../component-manager';
import livePreview from '../live-preview';
import prototypeExport from '../prototype-export';
import prototypeChat from '../prototype-chat';
import uiGeneration from '../ui-generation';
import requirementsExport from '../requirements-export';
import projectSettings from '../project-settings';
import ddd from '../ddd';
import diagnosis from '../diagnosis';
import plan from '../plan';

// 创建 v1 路由
const v1 = new Hono();

// ==================== 中间件链 ====================

// 1. 日志中间件 - 记录所有请求
v1.use('*', logger);

// 2. 限流中间件 - 通用限流规则
v1.use('*', rateLimit({
  limit: 100,
  windowSeconds: 60,
  keyGenerator: (c) => {
    const user = c.get('user');
    if (user?.userId) {
      return `user:${user.userId}`;
    }
    return c.req.header('cf-connecting-ip') || 
           c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
           'unknown';
  },
}));

// ==================== 公开路由 (无需认证) ====================

// 认证路由 - 登录、注册等公开接口
v1.route('/auth', auth);

// SSE 流式分析端点 - 公开，无需认证 (挂载到 /analyze/stream)
v1.route('/analyze/stream', analyzeStream);

// Canvas SSE 流式端点 - 公开，无需认证
v1.route('/canvas/stream', canvasStream);

// ==================== 受保护路由 (需要认证) ====================

// 所有需要认证的路由挂载到一个子 app，再统一加中间件
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();
protected_.use('*', authMiddleware);

// 项目管理
protected_.route('/projects', projects);
protected_.route('/projects/:id', projectId);

// 页面管理
protected_.route('/pages', pages);
protected_.route('/pages/:id/components', pageIdComponents);

// Agent 管理
protected_.route('/agents', agents);

// AI 对话
protected_.route('/chat', chat);

// 用户管理
protected_.route('/users', users);

// 消息
protected_.route('/messages', messages);

// 流程
protected_.route('/flows', flows);
protected_.route('/flow-data', flowData);

// 需求
protected_.route('/requirements', requirements);
protected_.route('/requirements', requirementId);

// 原型快照
protected_.route('/prototype-snapshots', prototypeSnapshots);
protected_.route('/prototype-snapshots', prototypeSnapshotId);

// 领域实体
protected_.route('/domain-entities', domainEntities);
protected_.route('/domain-entities', domainEntityId);

// 领域模型
protected_.route('/domain-models', domainModels);

// 实体关系
protected_.route('/entity-relations', entityRelations);
protected_.route('/entity-relations', entityRelationId);

// 分支
protected_.route('/branches', branches);
protected_.route('/branches', branchId);

// 需求分析
protected_.route('/requirements-analysis', requirementsAnalysis);

// 澄清问题
protected_.route('/clarification-questions', clarificationQuestions);

// 组件生成器
protected_.route('/component-generator', componentGenerator);

// 原型协作
protected_.route('/prototype-collaboration', prototypeCollaboration);
protected_.route('/prototype-collaboration', prototypeCollaborationId);

// 协作
protected_.route('/collaboration', collaboration);

// AI 设计聊天
protected_.route('/ai-design-chat', aiDesignChat);

// AI UI 生成
protected_.route('/ai-ui-generation', aiUIGeneration);

// 原型版本
protected_.route('/prototype-versions', prototypeVersions);

// 组件管理
protected_.route('/components', componentManager);

// 实时预览
protected_.route('/live-preview', livePreview);

// 原型导出
protected_.route('/prototype-export', prototypeExport);

// 原型聊天
protected_.route('/prototype/chat', prototypeChat);

// UI 生成
protected_.route('/ui-generation', uiGeneration);

// 需求导出
protected_.route('/requirements-export', requirementsExport);

// 版本
protected_.route('/version', version);

// 项目设置
protected_.route('/projects/:id/settings', projectSettings);

// 确认项目
protected_.route('/confirmation-projects', confirmationProjects);

// Canvas 画布 API
protected_.route('/canvas', canvas);

// Canvas 快照 API — E2 后端版本化存储
protected_.route('/canvas/snapshots', canvasSnapshots);
protected_.route('/canvas/rollback', canvasRollback);

// DDD
protected_.route('/ddd', ddd);

// 诊断
protected_.route('/diagnosis', diagnosis);

// 计划
protected_.route('/plan', plan);

// 将受保护的路由挂载到 v1 主路由
v1.route('/', protected_);

// ==================== 错误处理 ====================

// 404 处理
v1.notFound(notFoundHandler);

// 全局错误处理
v1.onError((err, c) => {
  return errorHandler(err as Error, c, async () => {});
});

export default v1;
