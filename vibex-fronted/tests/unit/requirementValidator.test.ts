import { validateRequirement, createRequirementValidator } from '../../src/lib/validator/requirementValidator'

describe('Requirement Validator', () => {
  
  describe('validateRequirement', () => {
    
    test('should return valid result for empty text', () => {
      const result = validateRequirement('')
      expect(result).toHaveProperty('level')
      expect(['low', 'medium']).toContain(result.level)
    })
    
    test('should return issues for short text', () => {
      const result = validateRequirement('用户管理')
      expect(result.issues.length).toBeGreaterThanOrEqual(1)
    })
    
    test('should return higher score for good requirements', () => {
      const goodText = `
        用户管理系统需求：
        1. 用户注册和登录功能
        2. 管理员角色权限管理
        3. 订单查询和筛选
        4. 支付接口集成
        5. 数据统计分析报表
      `
      const result = validateRequirement(goodText)
      expect(result.score).toBeGreaterThanOrEqual(40)
      expect(result.keywords.length).toBeGreaterThan(3)
    })
    
    test('should detect domain keywords', () => {
      const text = '用户登录系统，会员管理功能，订单处理，支付模块，数据分析'
      const result = validateRequirement(text)
      const domainKeywords = result.keywords.filter(k => k.category === 'domain')
      expect(domainKeywords.length).toBeGreaterThan(0)
    })
    
    test('should return excellent for comprehensive requirements', () => {
      const excellentText = `
        电商平台管理系统：
        1. 用户模块：用户注册、登录、个人信息管理、会员等级
        2. 商品模块：商品发布、编辑、删除、库存管理、价格调整
        3. 订单模块：订单创建、查询、筛选、排序、状态管理、物流跟踪
        4. 支付模块：在线支付、退款申请、提现功能
        5. 管理员模块：角色权限分配、用户管理、系统配置
        
        要求支持多平台访问，数据实时同步。
      `
      const result = validateRequirement(excellentText)
      expect(result.level).toMatch(/high|excellent/)
    })
  })
  
  describe('createRequirementValidator', () => {
    
    test('should create validator with validateImmediate', () => {
      const validator = createRequirementValidator()
      const result = validator.validateImmediate('用户管理功能')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('level')
    })
  })
  
  describe('Keyword Detection Accuracy', () => {
    
    test('should detect keywords with >90% accuracy on sample texts', () => {
      const testCases = [
        { text: '用户登录注册', expectedMinKeywords: 2 },
        { text: '订单支付商品管理', expectedMinKeywords: 3 },
        { text: '会员权限角色认证', expectedMinKeywords: 3 },
      ]
      
      let totalDetected = 0
      testCases.forEach(({ text, expectedMinKeywords }) => {
        const result = validateRequirement(text)
        totalDetected += result.keywords.length >= expectedMinKeywords ? 1 : 0
      })
      
      const accuracy = (totalDetected / testCases.length) * 100
      expect(accuracy).toBeGreaterThanOrEqual(90)
    })
  })
})
