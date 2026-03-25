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

import { Hono } from 'hono';
import { authMiddleware } from '../../lib/auth';
import { rateLimit } from '../../lib/rateLimit';
import { logger } from '../../lib/logger';
import { errorHandler, notFoundHandler } from '../../lib/errorHandler';
import analyzeStream from './analyze/stream';

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

// ==================== 受保护路由 (需要认证) ====================

// 应用认证中间件到所有其他路由
v1.use('*', authMiddleware);

// 项目管理
v1.route('/projects', projects);
v1.route('/projects/:id', projectId);

// 页面管理
v1.route('/pages', pages);
v1.route('/pages/:id/components', pageIdComponents);

// Agent 管理
v1.route('/agents', agents);

// AI 对话
v1.route('/chat', chat);

// 用户管理
v1.route('/users', users);

// 消息
v1.route('/messages', messages);

// 流程
v1.route('/flows', flows);
v1.route('/flow-data', flowData);

// 需求
v1.route('/requirements', requirements);
v1.route('/requirements', requirementId);

// 原型快照
v1.route('/prototype-snapshots', prototypeSnapshots);
v1.route('/prototype-snapshots', prototypeSnapshotId);

// 领域实体
v1.route('/domain-entities', domainEntities);
v1.route('/domain-entities', domainEntityId);

// 领域模型
v1.route('/domain-models', domainModels);

// 实体关系
v1.route('/entity-relations', entityRelations);
v1.route('/entity-relations', entityRelationId);

// 分支
v1.route('/branches', branches);
v1.route('/branches', branchId);

// 需求分析
v1.route('/requirements-analysis', requirementsAnalysis);

// 澄清问题
v1.route('/clarification-questions', clarificationQuestions);

// 组件生成器
v1.route('/component-generator', componentGenerator);

// 原型协作
v1.route('/prototype-collaboration', prototypeCollaboration);
v1.route('/prototype-collaboration', prototypeCollaborationId);

// 协作
v1.route('/collaboration', collaboration);

// AI 设计聊天
v1.route('/ai-design-chat', aiDesignChat);

// AI UI 生成
v1.route('/ai-ui-generation', aiUIGeneration);

// 原型版本
v1.route('/prototype-versions', prototypeVersions);

// 组件管理
v1.route('/components', componentManager);

// 实时预览
v1.route('/live-preview', livePreview);

// 原型导出
v1.route('/prototype-export', prototypeExport);

// 原型聊天
v1.route('/prototype/chat', prototypeChat);

// UI 生成
v1.route('/ui-generation', uiGeneration);

// 需求导出
v1.route('/requirements-export', requirementsExport);

// 版本
v1.route('/version', version);

// 项目设置
v1.route('/projects/:id/settings', projectSettings);

// 确认项目
v1.route('/confirmation-projects', confirmationProjects);

// DDD
v1.route('/ddd', ddd);

// 诊断
v1.route('/diagnosis', diagnosis);

// SSE 流式分析 (analyze/stream 必须放在 plan 前面，避免路由冲突)
v1.route('/analyze', analyzeStream);

// 计划
v1.route('/plan', plan);

// ==================== 错误处理 ====================

// 404 处理
v1.notFound(notFoundHandler);

// 全局错误处理
v1.onError((err, c) => {
  return errorHandler(err as Error, c, async () => {});
});

export default v1;
