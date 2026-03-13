/**
 * Optimizer - 一键优化逻辑
 */

import { Diagnoser } from './diagnoser';
import { DiagnosisResult, OptimizeRequest } from './types';

/**
 * 一键优化
 */
export class Optimizer {
  private diagnoser: Diagnoser;

  constructor() {
    this.diagnoser = new Diagnoser();
  }

  /**
   * F2.1: 一键优化
   * 基于诊断结果优化需求文本
   */
  async optimize(request: OptimizeRequest): Promise<{
    original: DiagnosisResult;
    improvedText: string;
    improvedScore: number;
  }> {
    // 1. 先诊断当前问题
    const original = this.diagnoser.diagnose(request.requirementText);

    // 2. 根据问题生成优化后的文本
    const improvedText = this.generateImprovedText(
      request.requirementText,
      original
    );

    // 3. 重新诊断优化后的文本
    const improved = this.diagnoser.diagnose(improvedText);

    return {
      original,
      improvedText: improvedText,
      improvedScore: improved.overallScore,
    };
  }

  /**
   * 生成优化后的文本
   */
  private generateImprovedText(
    original: string,
    diagnosis: DiagnosisResult
  ): string {
    const parts: string[] = [original];

    // 添加缺失的元素
    for (const dim of diagnosis.dimensions) {
      if (dim.score < 70 && dim.suggestions.length > 0) {
        // 根据维度添加内容
        switch (dim.name) {
          case '完整性':
            if (!original.includes('用户')) {
              parts.push('\n\n目标用户：本产品的目标用户群体为...');
            }
            if (!original.includes('功能')) {
              parts.push('\n核心功能：包括以下主要功能...');
            }
            break;
          case '清晰度':
            // 移除模糊词汇
            parts.push('\n\n补充说明：以上需求描述清晰、具体。');
            break;
          case '技术明确度':
            parts.push('\n\n技术要求：采用现代化的技术架构...');
            break;
          case '上下文充分度':
            parts.push('\n\n业务场景：典型使用场景包括...');
            break;
        }
      }
    }

    return parts.join('');
  }

  /**
   * F2.2: AI 优化（降级方案）
   * 如果 AI 不可用，使用本地优化
   */
  async optimizeWithAI(
    requirementText: string,
    aiClient?: (prompt: string) => Promise<string>
  ): Promise<{
    improvedText: string;
    usedFallback: boolean;
  }> {
    try {
      if (aiClient) {
        // 使用 AI 优化
        const prompt = `请优化以下需求描述，使其更加完整、清晰：

${requirementText}

请返回优化后的需求描述。`;

        const improved = await aiClient(prompt);
        return { improvedText: improved, usedFallback: false };
      }
    } catch (error) {
      console.error('[Optimizer] AI optimization failed, using fallback:', error);
    }

    // 降级到本地优化
    const result = await this.optimize({ requirementText });
    return {
      improvedText: result.improvedText,
      usedFallback: true,
    };
  }
}

export default new Optimizer();
