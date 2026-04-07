/**
 * Diagnoser - 4 维诊断算法
 */

import {
  DiagnosisResult,
  DiagnosisDimension,
  DIMENSION_WEIGHTS,
  DIMENSION_LABELS,
  DimensionName,
} from './types';

/**
 * 4 维诊断算法
 */
export class Diagnoser {
  /**
   * 执行 4 维诊断
   */
  diagnose(requirementText: string): DiagnosisResult {
    const dimensions: DiagnosisDimension[] = [
      this.evaluateCompleteness(requirementText),
      this.evaluateClarity(requirementText),
      this.evaluateTechnical(requirementText),
      this.evaluateContext(requirementText),
    ];

    // 计算综合评分
    const overallScore = this.calculateOverallScore(dimensions);

    // 生成建议
    const suggestions = this.generateSuggestions(dimensions);

    return {
      overallScore,
      dimensions,
      summary: this.generateSummary(overallScore),
      suggestions,
      createdAt: Date.now(),
    };
  }

  /**
   * F1.1: 评估完整性
   * 检查需求是否包含必要的元素
   */
  private evaluateCompleteness(text: string): DiagnosisDimension {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查关键元素
    const hasUser = /用户|角色|人员/.test(text);
    const hasFunction = /功能|模块|系统/.test(text);
    const hasGoal = /目标|需求|需要/.test(text);
    const hasConstraint = /限制|约束|条件/.test(text);

    if (!hasUser) {
      issues.push('未明确用户角色');
      suggestions.push('请说明目标用户群体');
    }
    if (!hasFunction) {
      issues.push('未明确核心功能');
      suggestions.push('请描述核心业务功能');
    }
    if (!hasGoal) {
      issues.push('未明确业务目标');
      suggestions.push('请说明产品的业务目标');
    }
    if (!hasConstraint) {
      issues.push('未明确约束条件');
      suggestions.push('请说明性能、安全等技术要求');
    }

    // 计算分数
    let score = 60; // 基础分
    if (hasUser) score += 10;
    if (hasFunction) score += 10;
    if (hasGoal) score += 10;
    if (hasConstraint) score += 10;

    return {
      name: DIMENSION_LABELS.completeness,
      score: Math.min(score, 100),
      maxScore: 100,
      weight: DIMENSION_WEIGHTS.completeness,
      issues,
      suggestions,
    };
  }

  /**
   * F1.1: 评估清晰度
   * 检查需求描述是否清晰无歧义
   */
  private evaluateClarity(text: string): DiagnosisDimension {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查模糊词汇
    const vagueWords = ['一些', '大概', '可能', '差不多', '某些', '相关'];
    const foundVague = vagueWords.filter(w => text.includes(w));
    
    if (foundVague.length > 0) {
      issues.push(`存在模糊词汇: ${foundVague.join(', ')}`);
      suggestions.push('请使用明确的描述');
    }

    // 检查句子长度（过长可能不清晰）
    const sentences = text.split(/[。！？]/).filter(s => s.trim());
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / Math.max(sentences.length, 1);
    
    if (avgLength > 50) {
      issues.push('句子过长，可能表达不清');
      suggestions.push('建议将长句拆分为短句');
    }

    // 计算分数
    let score = 70; // 基础分
    score -= foundVague.length * 10;
    if (avgLength > 50) score -= 10;

    return {
      name: DIMENSION_LABELS.clarity,
      score: Math.max(score, 0),
      maxScore: 100,
      weight: DIMENSION_WEIGHTS.clarity,
      issues,
      suggestions,
    };
  }

  /**
   * F1.1: 评估技术明确度
   * 检查是否包含技术实现细节
   */
  private evaluateTechnical(text: string): DiagnosisDimension {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查技术关键词
    const techKeywords = [
      'API', '数据库', '前端', '后端', '微服务', '缓存',
      '认证', '授权', '性能', '安全', '部署', '架构'
    ];
    const foundTech = techKeywords.filter(t => text.includes(t));

    if (foundTech.length < 2) {
      issues.push('缺少技术实现细节');
      suggestions.push('请说明技术栈或架构要求');
    }

    // 计算分数
    let score = 50; // 基础分
    score += foundTech.length * 10;

    return {
      name: DIMENSION_LABELS.technical,
      score: Math.min(score, 100),
      maxScore: 100,
      weight: DIMENSION_WEIGHTS.technical,
      issues,
      suggestions,
    };
  }

  /**
   * F1.1: 评估上下文充分度
   * 检查是否有足够的业务上下文
   */
  private evaluateContext(text: string): DiagnosisDimension {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查业务上下文关键词
    const contextKeywords = [
      '业务', '流程', '场景', '用例', '行业', '领域',
      '现有', '竞品', '参考', '类似'
    ];
    const foundContext = contextKeywords.filter(c => text.includes(c));

    if (foundContext.length === 0) {
      issues.push('缺少业务上下文');
      suggestions.push('请提供业务流程或使用场景');
    }

    // 检查是否有具体数值
    const hasNumbers = /\d+/.test(text);
    if (!hasNumbers) {
      issues.push('缺少具体数值指标');
      suggestions.push('请提供具体的数量、时间等指标');
    }

    // 计算分数
    let score = 50;
    score += foundContext.length * 15;
    if (hasNumbers) score += 15;

    return {
      name: DIMENSION_LABELS.context,
      score: Math.min(score, 100),
      maxScore: 100,
      weight: DIMENSION_WEIGHTS.context,
      issues,
      suggestions,
    };
  }

  /**
   * F1.2: 计算综合评分
   */
  private calculateOverallScore(dimensions: DiagnosisDimension[]): number {
    const weightedSum = dimensions.reduce(
      (sum, d) => sum + (d.score * d.weight),
      0
    );
    return Math.round(weightedSum);
  }

  /**
   * F1.3: 生成建议
   */
  private generateSuggestions(dimensions: DiagnosisDimension[]): string[] {
    const suggestions: string[] = [];
    
    for (const dim of dimensions) {
      if (dim.score < 70) {
        suggestions.push(...dim.suggestions);
      }
    }

    // 去重
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * F1.3: 生成总结
   */
  private generateSummary(score: number): string {
    if (score >= 90) return '需求描述非常完善';
    if (score >= 70) return '需求描述基本完整';
    if (score >= 50) return '需求描述需要改进';
    return '需求描述存在较多问题';
  }
}

export default new Diagnoser();
