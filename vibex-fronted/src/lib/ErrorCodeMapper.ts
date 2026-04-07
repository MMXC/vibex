/**
 * Error Code Mapper - 错误码映射器
 * 
 * HTTP 状态码 → 业务错误码映射
 * 支持自定义映射配置
 * 
 * Usage:
 * const { code, message } = mapHttpStatusToError(404)
 * 
 * // 自定义映射
 * const mapper = new ErrorCodeMapper(customMappings)
 * const result = mapper.map(error)
 */

import { classifyError, ClassifiedError } from './ErrorClassifier';

// HTTP 状态码范围
const HTTP_STATUS_RANGES = {
  CLIENT_ERROR_START: 400,
  CLIENT_ERROR_END: 499,
  SERVER_ERROR_START: 500,
  SERVER_ERROR_END: 599,
} as const;

// 错误码前缀
const ERROR_CODE_PREFIX = {
  NETWORK: 'E10',
  TIMEOUT: 'E10',
  SERVER: 'E50',
  CLIENT: 'E40',
  BUSINESS: 'B20',
  UNKNOWN: 'E00',
} as const;

// 默认 HTTP 状态码映射
export interface HttpStatusMapping {
  code: string;
  message: string;
  hint?: string;
}

// 错误码映射配置
export interface ErrorMappingConfig {
  httpStatus?: HttpStatusMapping;
  businessCode?: {
    code: string;
    message: string;
    severity?: 'critical' | 'warning' | 'info';
  };
}

// 映射器配置
export interface ErrorCodeMapperOptions {
  /** 自定义 HTTP 状态码映射 */
  httpStatusMappings?: Record<number, HttpStatusMapping>;
  /** 自定义业务错误码映射 */
  businessCodeMappings?: Record<string, { message: string; severity?: 'critical' | 'warning' | 'info' }>;
  /** 未知状态码默认映射 */
  defaultMapping?: HttpStatusMapping;
  /** 是否启用详细错误码 */
  includeDetails?: boolean;
}

// 映射结果
export interface MappedError {
  code: string;
  message: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  status?: number;
  hint?: string;
  originalError?: unknown;
  recoverable: boolean;
}

/**
 * 默认 HTTP 状态码映射
 */
const DEFAULT_HTTP_STATUS_MAPPINGS: Record<number, HttpStatusMapping> = {
  // 客户端错误 4xx
  400: { code: 'E4001', message: '请求参数错误', hint: '请检查输入的数据格式' },
  401: { code: 'E4002', message: '登录已过期，请重新登录', hint: '请重新登录后操作' },
  403: { code: 'E4003', message: '无权限执行此操作', hint: '联系管理员获取权限' },
  404: { code: 'E4004', message: '请求的资源不存在', hint: '请检查资源ID是否正确' },
  405: { code: 'E4005', message: '请求方法不支持', hint: '请使用正确的HTTP方法' },
  408: { code: 'E4006', message: '请求超时', hint: '请稍后重试' },
  409: { code: 'B2001', message: '资源冲突', hint: '请检查资源是否已存在' },
  413: { code: 'E4007', message: '请求体过大', hint: '请减小请求数据大小' },
  422: { code: 'E4008', message: '请求数据验证失败', hint: '请检查输入的数据是否符合要求' },
  429: { code: 'E5001', message: '请求过于频繁，请稍后重试', hint: '请降低请求频率' },
  
  // 服务端错误 5xx
  500: { code: 'E5001', message: '服务异常，请稍后重试', hint: '服务器内部错误' },
  501: { code: 'E5002', message: '功能未实现', hint: '该功能暂不支持' },
  502: { code: 'E5003', message: '服务网关错误', hint: '请稍后重试' },
  503: { code: 'E5004', message: '服务暂时不可用', hint: '请稍后重试' },
  504: { code: 'E5005', message: '服务响应超时', hint: '请稍后重试' },
};

/**
 * 默认业务错误码映射
 */
const DEFAULT_BUSINESS_CODE_MAPPINGS: Record<string, { message: string; severity?: 'critical' | 'warning' | 'info' }> = {
  // 项目相关
  'PROJECT_001': { message: '项目创建失败', severity: 'warning' },
  'PROJECT_002': { message: '项目不存在', severity: 'warning' },
  'PROJECT_003': { message: '无权限访问该项目', severity: 'warning' },
  'PROJECT_004': { message: '项目名称已存在', severity: 'warning' },
  'PROJECT_005': { message: '项目删除失败', severity: 'warning' },
  
  // 用户相关
  'USER_001': { message: '用户不存在', severity: 'warning' },
  'USER_002': { message: '邮箱已被注册', severity: 'warning' },
  'USER_003': { message: '用户名已被使用', severity: 'warning' },
  'USER_004': { message: '用户信息更新失败', severity: 'warning' },
  
  // 认证相关
  'AUTH_001': { message: '登录凭证已过期', severity: 'warning' },
  'AUTH_002': { message: '用户名或密码错误', severity: 'warning' },
  'AUTH_003': { message: '账号已被禁用', severity: 'critical' },
  'AUTH_004': { message: 'Token无效', severity: 'warning' },
  
  // DDD 相关
  'DDD_001': { message: '限界上下文生成失败', severity: 'warning' },
  'DDD_002': { message: '领域模型生成失败', severity: 'warning' },
  'DDD_003': { message: '业务流程生成失败', severity: 'warning' },
  
  // 通用
  'COMMON_001': { message: '操作过于频繁', severity: 'info' },
  'COMMON_002': { message: '请求参数无效', severity: 'warning' },
  'COMMON_003': { message: '数据格式错误', severity: 'warning' },
  'COMMON_004': { message: '操作成功', severity: 'info' },
};

/**
 * 错误码映射器类
 */
export class ErrorCodeMapper {
  private httpStatusMappings: Record<number, HttpStatusMapping>;
  private businessCodeMappings: Record<string, { message: string; severity?: 'critical' | 'warning' | 'info' }>;
  private defaultHttpMapping: HttpStatusMapping;
  private includeDetails: boolean;

  constructor(options: ErrorCodeMapperOptions = {}) {
    this.httpStatusMappings = {
      ...DEFAULT_HTTP_STATUS_MAPPINGS,
      ...options.httpStatusMappings,
    };
    this.businessCodeMappings = {
      ...DEFAULT_BUSINESS_CODE_MAPPINGS,
      ...options.businessCodeMappings,
    };
    this.defaultHttpMapping = options.defaultMapping || {
      code: 'E0001',
      message: '未知错误',
      hint: '请联系管理员',
    };
    this.includeDetails = options.includeDetails ?? true;
  }

  /**
   * 映射 HTTP 状态码到错误码
   */
  mapHttpStatus(status: number): MappedError {
    const mapping = this.httpStatusMappings[status];
    
    if (mapping) {
      return {
        code: mapping.code,
        message: mapping.message,
        type: this.getTypeFromStatus(status),
        severity: this.getSeverityFromStatus(status),
        status,
        hint: mapping.hint,
        recoverable: status < 500,
      };
    }
    
    // 未知状态码
    if (status >= HTTP_STATUS_RANGES.SERVER_ERROR_START) {
      return {
        code: `${ERROR_CODE_PREFIX.SERVER}99`,
        message: '服务异常，请稍后重试',
        type: 'server',
        severity: 'critical',
        status,
        hint: '请联系管理员',
        recoverable: true,
      };
    }
    
    if (status >= HTTP_STATUS_RANGES.CLIENT_ERROR_START) {
      return {
        code: `${ERROR_CODE_PREFIX.CLIENT}99`,
        message: '请求失败',
        type: 'client',
        severity: 'warning',
        status,
        hint: '请检查请求参数',
        recoverable: true,
      };
    }
    
    return {
      code: this.defaultHttpMapping.code,
      message: this.defaultHttpMapping.message,
      type: 'unknown',
      severity: 'warning',
      status,
      hint: this.defaultHttpMapping.hint,
      recoverable: true,
    };
  }

  /**
   * 映射业务错误码
   */
  mapBusinessCode(code: string): MappedError {
    const mapping = this.businessCodeMappings[code];
    
    if (mapping) {
      return {
        code,
        message: mapping.message,
        type: 'business',
        severity: mapping.severity || 'warning',
        hint: undefined,
        recoverable: mapping.severity !== 'critical',
      };
    }
    
    // 未知业务错误码
    return {
      code: `${ERROR_CODE_PREFIX.BUSINESS}99`,
      message: '业务处理失败',
      type: 'business',
      severity: 'warning',
      hint: `错误码: ${code}`,
      recoverable: true,
    };
  }

  /**
   * 映射任意错误
   */
  map(error: unknown): MappedError {
    // 先使用 ErrorClassifier 分类
    const classified = classifyError(error);
    
    // 如果有状态码，映射 HTTP 错误
    if (classified.status) {
      const mapped = this.mapHttpStatus(classified.status);
      if (this.includeDetails) {
        mapped.originalError = error;
      }
      return mapped;
    }
    
    // 如果有业务错误码，映射业务错误
    if (classified.code) {
      const mapped = this.mapBusinessCode(classified.code);
      if (this.includeDetails) {
        mapped.originalError = error;
      }
      return mapped;
    }
    
    // 根据错误类型映射
    return this.mapByType(classified);
  }

  /**
   * 根据错误类型映射
   */
  private mapByType(classified: ClassifiedError): MappedError {
    const { type, severity, message } = classified;
    
    let code: string;
    switch (type) {
      case 'network':
        code = `${ERROR_CODE_PREFIX.NETWORK}01`;
        break;
      case 'timeout':
        code = `${ERROR_CODE_PREFIX.TIMEOUT}01`;
        break;
      case 'server':
        code = `${ERROR_CODE_PREFIX.SERVER}01`;
        break;
      case 'client':
        code = `${ERROR_CODE_PREFIX.CLIENT}01`;
        break;
      case 'business':
        code = `${ERROR_CODE_PREFIX.BUSINESS}01`;
        break;
      default:
        code = `${ERROR_CODE_PREFIX.UNKNOWN}01`;
    }
    
    return {
      code,
      message,
      type,
      severity,
      hint: this.getHintFromType(type),
      recoverable: classified.recoverable,
    };
  }

  /**
   * 从状态码获取错误类型
   */
  private getTypeFromStatus(status: number): string {
    if (status >= 500) return 'server';
    if (status >= 400) return 'client';
    return 'unknown';
  }

  /**
   * 从状态码获取严重程度
   */
  private getSeverityFromStatus(status: number): 'critical' | 'warning' | 'info' {
    if (status >= 500) return 'critical';
    if (status >= 400) return 'warning';
    return 'info';
  }

  /**
   * 从错误类型获取提示
   */
  private getHintFromType(type: string): string {
    const hints: Record<string, string> = {
      network: '请检查网络连接',
      timeout: '请稍后重试',
      server: '请联系管理员',
      client: '请检查输入参数',
      business: '请稍后重试或联系管理员',
      unknown: '请联系管理员',
    };
    return hints[type] || '请联系管理员';
  }

  /**
   * 添加自定义 HTTP 状态码映射
   */
  addHttpStatusMapping(status: number, mapping: HttpStatusMapping): void {
    this.httpStatusMappings[status] = mapping;
  }

  /**
   * 添加自定义业务错误码映射
   */
  addBusinessCodeMapping(code: string, mapping: { message: string; severity?: 'critical' | 'warning' | 'info' }): void {
    this.businessCodeMappings[code] = mapping;
  }

  /**
   * 获取所有 HTTP 状态码映射
   */
  getHttpStatusMappings(): Record<number, HttpStatusMapping> {
    return { ...this.httpStatusMappings };
  }

  /**
   * 获取所有业务错误码映射
   */
  getBusinessCodeMappings(): Record<string, { message: string; severity?: 'critical' | 'warning' | 'info' }> {
    return { ...this.businessCodeMappings };
  }
}

// 默认导出
export default ErrorCodeMapper;
