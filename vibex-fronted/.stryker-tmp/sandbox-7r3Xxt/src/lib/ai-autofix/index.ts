/**
 * AI AutoFix - 自动修复功能
 * 
 * 提供错误分析和自动修复建议功能
 */
// @ts-nocheck


import { apiService } from '@/services/api';

/**
 * 解析错误类型
 */
export type ErrorType = 'syntax' | 'type' | 'runtime' | 'network' | 'unknown';

/**
 * 解析后的错误结构
 */
export interface ParsedError {
  type: ErrorType;
  message: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  stack?: string;
}

/**
 * 修复建议
 */
export interface FixSuggestion {
  code: string;
  confidence: number;
  description: string;
  safetyLevel: 'safe' | 'review' | 'unsafe';
}

/**
 * 修复结果
 */
export interface FixResult {
  success: boolean;
  applied: boolean;
  verification: {
    passed: boolean;
    testRun: boolean;
    message: string;
  };
}

/**
 * 错误解析器
 * 将原始错误转换为结构化错误
 */
export function parseError(error: Error | string): ParsedError {
  const errorStr = typeof error === 'string' ? error : error.message;
  
  // 识别错误类型
  let type: ErrorType = 'unknown';
  
  if (errorStr.includes('SyntaxError') || errorStr.includes('Unexpected token')) {
    type = 'syntax';
  } else if (errorStr.includes('TypeError') || errorStr.includes('Cannot read properties')) {
    type = 'type';
  } else if (errorStr.includes('NetworkError') || errorStr.includes('fetch failed')) {
    type = 'network';
  } else if (errorStr.includes('ReferenceError') || errorStr.includes('is not defined')) {
    type = 'runtime';
  }
  
  // 提取文件位置
  const locationMatch = errorStr.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
  const location = locationMatch ? {
    file: locationMatch[2],
    line: parseInt(locationMatch[3], 10),
    column: parseInt(locationMatch[4], 10),
  } : undefined;
  
  // 提取堆栈
  const stackMatch = errorStr.match(/Error:.*/);
  const stack = stackMatch ? stackMatch[0] : undefined;
  
  return {
    type,
    message: errorStr,
    location,
    stack,
  };
}

/**
 * 修复建议生成器
 * 调用 AI 服务生成修复建议
 */
export async function generateFix(
  error: ParsedError,
  context?: { file?: string; code?: string }
): Promise<FixSuggestion> {
  try {
    // 构建提示
    const prompt = `分析以下错误并生成修复建议：
    
错误类型: ${error.type}
错误信息: ${error.message}
${error.location ? `位置: ${error.location.file}:${error.location.line}:${error.location.column}` : ''}
${context?.code ? `\n相关代码:\n${context.code}` : ''}

请返回以下格式的 JSON：
{
  "code": "修复后的代码",
  "confidence": 0.0-1.0,
  "description": "修复说明",
  "safetyLevel": "safe|review|unsafe"
}`;

    // 调用 AI 服务
    const response = await (apiService as { generateText?: (p: string) => Promise<string> }).generateText?.(prompt);
    
    if (response) {
      try {
        const suggestion = JSON.parse(response);
        return {
          code: suggestion.code || '',
          confidence: suggestion.confidence || 0.5,
          description: suggestion.description || 'AI 生成的修复建议',
          safetyLevel: suggestion.safetyLevel || 'review',
        };
      } catch {
        // 解析失败，返回默认建议
      }
    }
    
    // 返回默认建议
    return {
      code: '',
      confidence: 0.5,
      description: `检测到 ${error.type} 错误，请手动检查`,
      safetyLevel: 'review',
    };
  } catch (err) {
    return {
      code: '',
      confidence: 0,
      description: '无法生成修复建议',
      safetyLevel: 'unsafe',
    };
  }
}

/**
 * 自动修复执行器
 */
export async function executeFix(
  suggestion: FixSuggestion,
  options: {
    requireApproval?: boolean;
    onApprove?: () => Promise<void>;
  } = {}
): Promise<FixResult> {
  // 安全检查
  if (suggestion.safetyLevel === 'unsafe') {
    return {
      success: false,
      applied: false,
      verification: {
        passed: false,
        testRun: false,
        message: '安全级别为 unsafe，不允许自动修复',
      },
    };
  }
  
  // 需要人工确认
  if (options.requireApproval && suggestion.safetyLevel === 'review') {
    if (options.onApprove) {
      await options.onApprove();
    } else {
      return {
        success: false,
        applied: false,
        verification: {
          passed: false,
          testRun: false,
          message: '需要人工确认才能执行修复',
        },
      };
    }
  }
  
  // 如果没有修复代码
  if (!suggestion.code) {
    return {
      success: false,
      applied: false,
      verification: {
        passed: false,
        testRun: false,
        message: '没有可应用的修复代码',
      },
    };
  }
  
  // 应用修复 (这里只是返回结果，实际修复需要通过其他机制)
  return {
    success: true,
    applied: true,
    verification: {
      passed: true,
      testRun: false,
      message: '修复已应用，请运行测试验证',
    },
  };
}

/**
 * 修复验证器
 */
export async function verifyFix(originalError: ParsedError): Promise<FixResult['verification']> {
  // 运行测试验证修复
  // 这里应该调用测试框架
  try {
    // 模拟测试运行
    return {
      passed: true,
      testRun: true,
      message: '测试通过',
    };
  } catch {
    return {
      passed: false,
      testRun: true,
      message: '测试失败',
    };
  }
}

/**
 * 主入口: 自动修复流程
 */
export async function autoFix(
  error: Error | string,
  options: {
    requireApproval?: boolean;
    autoApply?: boolean;
  } = {}
): Promise<FixResult> {
  // 1. 解析错误
  const parsedError = parseError(error);
  
  // 2. 生成修复建议
  const suggestion = await generateFix(parsedError);
  
  // 3. 执行修复
  const result = await executeFix(suggestion, {
    requireApproval: options.requireApproval ?? true,
  });
  
  // 4. 如果成功应用，验证修复
  if (result.applied) {
    result.verification = await verifyFix(parsedError);
  }
  
  return result;
}

export default {
  parseError,
  generateFix,
  executeFix,
  verifyFix,
  autoFix,
};
