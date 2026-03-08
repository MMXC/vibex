// ==================== 类型导出 ====================
export * from './types';

// ==================== 基础设施导出 ====================
export { httpClient, createHttpClient } from './client';
export { cache, getCacheKey } from './cache';
export type { CacheService } from './cache';
export { retry, DEFAULT_RETRY_CONFIG } from './retry';
export type { RetryService } from './retry';

// ==================== 业务模块导出 ====================
export { authApi, createAuthApi } from './modules/auth';
export type { AuthApi } from './modules/auth';
export { userApi, createUserApi } from './modules/user';
export type { UserApi } from './modules/user';
export { projectApi, createProjectApi } from './modules/project';
export type { ProjectApi } from './modules/project';
export { messageApi, createMessageApi } from './modules/message';
export type { MessageApi } from './modules/message';
export { flowApi, createFlowApi } from './modules/flow';
export type { FlowApi } from './modules/flow';
export { agentApi, createAgentApi } from './modules/agent';
export type { AgentApi } from './modules/agent';
export { pageApi, createPageApi } from './modules/page';
export type { PageApi } from './modules/page';
export {
  domainEntityApi,
  createDomainEntityApi,
} from './modules/domain-entity';
export type { DomainEntityApi } from './modules/domain-entity';
export {
  entityRelationApi,
  createEntityRelationApi,
} from './modules/entity-relation';
export type { EntityRelationApi } from './modules/entity-relation';
export { prototypeApi, createPrototypeApi } from './modules/prototype';
export type { PrototypeApi } from './modules/prototype';
export { requirementApi, createRequirementApi } from './modules/requirement';
export type { RequirementApi } from './modules/requirement';
export {
  clarificationApi,
  createClarificationApi,
} from './modules/clarification';
export type { ClarificationApi } from './modules/clarification';
export { dddApi, createDddApi } from './modules/ddd';
export type { DddApi } from './modules/ddd';

// ==================== 兼容层：模拟原有 ApiService ====================
import { authApi } from './modules/auth';
import { userApi } from './modules/user';
import { projectApi } from './modules/project';
import { messageApi } from './modules/message';
import { flowApi } from './modules/flow';
import { agentApi } from './modules/agent';
import { pageApi } from './modules/page';
import { domainEntityApi } from './modules/domain-entity';
import { entityRelationApi } from './modules/entity-relation';
import { prototypeApi } from './modules/prototype';
import { requirementApi } from './modules/requirement';
import { clarificationApi } from './modules/clarification';
import { dddApi } from './modules/ddd';

/**
 * @deprecated 使用具名导入代替
 * 例如: import { authApi, projectApi } from '@/services/api'
 */
export const apiService = {
  // 认证
  login: authApi.login.bind(authApi),
  register: authApi.register.bind(authApi),
  getCurrentUser: authApi.getCurrentUser.bind(authApi),
  logout: authApi.logout.bind(authApi),

  // 用户
  getUser: userApi.getUser.bind(userApi),
  updateUser: userApi.updateUser.bind(userApi),

  // 项目
  getProjects: projectApi.getProjects.bind(projectApi),
  getProject: projectApi.getProject.bind(projectApi),
  createProject: projectApi.createProject.bind(projectApi),
  updateProject: projectApi.updateProject.bind(projectApi),
  deleteProject: projectApi.deleteProject.bind(projectApi),
  softDeleteProject: projectApi.softDeleteProject.bind(projectApi),
  restoreProject: projectApi.restoreProject.bind(projectApi),
  permanentDeleteProject: projectApi.permanentDeleteProject.bind(projectApi),
  getDeletedProjects: projectApi.getDeletedProjects.bind(projectApi),
  clearDeletedProjects: projectApi.clearDeletedProjects.bind(projectApi),
  getProjectRole: projectApi.getProjectRole.bind(projectApi),

  // 消息
  getMessages: messageApi.getMessages.bind(messageApi),
  createMessage: messageApi.createMessage.bind(messageApi),
  deleteMessage: messageApi.deleteMessage.bind(messageApi),

  // 流程图
  getFlow: flowApi.getFlow.bind(flowApi),
  updateFlow: flowApi.updateFlow.bind(flowApi),
  generateFlow: flowApi.generateFlow.bind(flowApi),
  deleteFlow: flowApi.deleteFlow.bind(flowApi),

  // Agent
  getAgents: agentApi.getAgents.bind(agentApi),
  getAgent: agentApi.getAgent.bind(agentApi),
  createAgent: agentApi.createAgent.bind(agentApi),
  updateAgent: agentApi.updateAgent.bind(agentApi),
  deleteAgent: agentApi.deleteAgent.bind(agentApi),

  // 页面
  getPages: pageApi.getPages.bind(pageApi),
  getPage: pageApi.getPage.bind(pageApi),
  createPage: pageApi.createPage.bind(pageApi),
  updatePage: pageApi.updatePage.bind(pageApi),
  deletePage: pageApi.deletePage.bind(pageApi),

  // 领域实体
  getDomainEntities: domainEntityApi.getDomainEntities.bind(domainEntityApi),
  getDomainEntity: domainEntityApi.getDomainEntity.bind(domainEntityApi),
  createDomainEntity: domainEntityApi.createDomainEntity.bind(domainEntityApi),
  updateDomainEntity: domainEntityApi.updateDomainEntity.bind(domainEntityApi),
  deleteDomainEntity: domainEntityApi.deleteDomainEntity.bind(domainEntityApi),

  // 实体关系
  getEntityRelations:
    entityRelationApi.getEntityRelations.bind(entityRelationApi),
  getEntityRelation:
    entityRelationApi.getEntityRelation.bind(entityRelationApi),
  createEntityRelation:
    entityRelationApi.createEntityRelation.bind(entityRelationApi),
  updateEntityRelation:
    entityRelationApi.updateEntityRelation.bind(entityRelationApi),
  deleteEntityRelation:
    entityRelationApi.deleteEntityRelation.bind(entityRelationApi),

  // 原型快照
  getPrototypeSnapshots: prototypeApi.getPrototypeSnapshots.bind(prototypeApi),
  getPrototypeSnapshot: prototypeApi.getPrototypeSnapshot.bind(prototypeApi),
  createPrototypeSnapshot:
    prototypeApi.createPrototypeSnapshot.bind(prototypeApi),
  updatePrototypeSnapshot:
    prototypeApi.updatePrototypeSnapshot.bind(prototypeApi),
  deletePrototypeSnapshot:
    prototypeApi.deletePrototypeSnapshot.bind(prototypeApi),

  // 需求
  getRequirements: requirementApi.getRequirements.bind(requirementApi),
  getRequirement: requirementApi.getRequirement.bind(requirementApi),
  createRequirement: requirementApi.createRequirement.bind(requirementApi),
  updateRequirement: requirementApi.updateRequirement.bind(requirementApi),
  deleteRequirement: requirementApi.deleteRequirement.bind(requirementApi),
  analyzeRequirement: requirementApi.analyzeRequirement.bind(requirementApi),
  reanalyzeRequirement:
    requirementApi.reanalyzeRequirement.bind(requirementApi),
  getAnalysisResult: requirementApi.getAnalysisResult.bind(requirementApi),

  // 澄清
  getClarifications: clarificationApi.getClarifications.bind(clarificationApi),
  answerClarification:
    clarificationApi.answerClarification.bind(clarificationApi),
  skipClarification: clarificationApi.skipClarification.bind(clarificationApi),

  // DDD
  generateBoundedContext: dddApi.generateBoundedContext.bind(dddApi),
  generateDomainModel: dddApi.generateDomainModel.bind(dddApi),
  generateBusinessFlow: dddApi.generateBusinessFlow.bind(dddApi),

  // 工具方法
  isOnline: () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
};

export default apiService;
