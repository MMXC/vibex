/**
 * Smart Skip Logic Hook
 * 智能跳过逻辑：检测已包含信息跳过问题
 */

import { useMemo, useCallback } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';

export interface SkipRule {
  questionId: string;
  check: (context: SkipContext) => boolean;
}

export interface SkipContext {
  requirementText: string;
  clarificationRounds: Array<{ question: string; answer: string; isAccepted: boolean }>;
  boundedContexts: Array<{ name: string; description: string }>;
  domainModels: Array<{ name: string; type: string }>;
  hasBusinessFlow: boolean;
}

// 预定义跳过规则
export const defaultSkipRules: SkipRule[] = [
  // 如果需求文本已包含用户相关信息，跳过用户管理相关问题
  {
    questionId: 'user-management',
    check: (ctx) => /用户|注册|登录|个人资料|身份|权限/.test(ctx.requirementText),
  },
  // 如果需求文本已包含支付相关内容，跳过支付相关问题
  {
    questionId: 'payment',
    check: (ctx) => /支付|收款|退款|订单|购物车/.test(ctx.requirementText),
  },
  // 如果已有领域实体，跳过基础概念解释
  {
    questionId: 'entity-explanation',
    check: (ctx) => ctx.domainModels.length > 0,
  },
  // 如果已有业务流程，跳过流程概念解释
  {
    questionId: 'flow-explanation',
    check: (ctx) => ctx.hasBusinessFlow,
  },
// 如果需求文本已包含多端相关内容
  {
    questionId: 'multi-platform',
    check: (ctx) => /小程序|APP|移动端|PC端|网页|响应式/.test(ctx.requirementText),
  },
  // 如果需求文本已包含第三方集成
  {
    questionId: 'third-party',
    check: (ctx) => /微信|支付宝|短信|邮件|API|第三方/.test(ctx.requirementText),
  },
];

export function useSmartSkip() {
  const store = useConfirmationStore();

  const getSkipContext = useCallback((): SkipContext => {
    return {
      requirementText: store.requirementText,
      clarificationRounds: store.clarificationRounds.map((r) => ({
        question: r.question,
        answer: r.answer,
        isAccepted: r.isAccepted ?? false,
      })),
      boundedContexts: store.boundedContexts,
      domainModels: store.domainModels.map((e) => ({
        name: e.name ?? '',
        type: e.type ?? '',
      })),
      hasBusinessFlow: (store.businessFlow?.steps?.length ?? 0) > 0,
    };
  }, [
    store.requirementText,
    store.clarificationRounds,
    store.boundedContexts,
    store.domainModels,
    store.businessFlow?.steps?.length,
  ]);

  const shouldSkipQuestion = useCallback(
    (questionId: string, customRules?: SkipRule[]): boolean => {
      const context = getSkipContext();
      const rules = customRules || defaultSkipRules;

      return rules.some(
        (rule) => rule.questionId === questionId && rule.check(context)
      );
    },
    [getSkipContext]
  );

  const getSkippedQuestions = useCallback(
    (questionIds: string[], customRules?: SkipRule[]): string[] => {
      const skipped: string[] = [];

      for (const questionId of questionIds) {
        if (shouldSkipQuestion(questionId, customRules)) {
          skipped.push(questionId);
        }
      }

      return skipped;
    },
    [shouldSkipQuestion]
  );

  const getNextActiveQuestion = useCallback(
    (questionIds: string[], customRules?: SkipRule[]): string | null => {
      for (const questionId of questionIds) {
        if (!shouldSkipQuestion(questionId, customRules)) {
          return questionId;
        }
      }
      return null;
    },
    [shouldSkipQuestion]
  );

  const skipProgress = useMemo(() => {
    const context = getSkipContext();
    const skippedCount = defaultSkipRules.filter((rule) => rule.check(context)).length;
    return {
      skipped: skippedCount,
      total: defaultSkipRules.length,
      percentage: (skippedCount / defaultSkipRules.length) * 100,
    };
  }, [getSkipContext]);

  return {
    shouldSkipQuestion,
    getSkippedQuestions,
    getNextActiveQuestion,
    skipProgress,
    getSkipContext,
  };
}

export default useSmartSkip;
