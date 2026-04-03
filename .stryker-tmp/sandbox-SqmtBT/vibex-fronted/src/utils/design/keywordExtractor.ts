/**
 * Keyword Extractor - F1.1 关键词提取组件
 * 从用户输入中提取关键词，用于模板匹配
 * 性能目标: < 100ms
 */
// @ts-nocheck


// 行业关键词库
const INDUSTRY_KEYWORDS = new Map([
  ['电商', ['电商', '商品', '购物车', '订单', '支付', '物流', 'SKU', '库存', '促销', '优惠券', '秒杀', '拼团']],
  ['用户管理', ['用户', '注册', '登录', '权限', '角色', '认证', 'OAuth', 'JWT', '会话', '个人资料', '头像', '收藏']],
  ['CRM', ['CRM', '客户', '销售', '线索', '商机', '跟进', '转化', '客户管理', '销售漏斗', '业绩', 'KPI']],
  ['博客', ['博客', '文章', '评论', '标签', '分类', '订阅', 'RSS', '编辑器', '富文本', 'SEO', '浏览量']],
  ['社交', ['社交', '好友', '关注', '粉丝', '动态', '消息', '私信', '群组', '聊天', ' timeline', 'Feed']],
  ['教育', ['教育', '课程', '学习', '考试', '作业', '答疑', '讲师', '学员', '学分', '证书', '题库', '直播课']],
  ['医疗', ['医疗', '挂号', '问诊', '处方', '病历', '患者', '医生', '医院', '药店', '医保', '体检']],
  ['金融', ['金融', '理财', '投资', '借贷', '保险', '基金', '股票', '开户', '充值', '提现', '风控']],
  ['物联网', ['物联网', 'IOT', '设备', '传感器', '网关', '数据采集', '远程控制', '自动化', '智能家居', '工业互联网']],
  ['企业', ['企业', 'OA', '审批', '考勤', '招聘', '绩效', '合同', '项目管理', '文档', '知识库', '企业网盘']],
]);

// 功能关键词
const FEATURE_KEYWORDS = [
  'CRUD', '增删改查', '搜索', '筛选', '排序', '分页', '导出', '导入',
  '报表', '统计', '图表', '仪表盘', '数据分析', 'BI',
  'API', '接口', 'Webhook', '集成', '对接', '同步',
  '消息', '通知', '推送', '邮件', '短信',
  '文件', '上传', '下载', '预览', '压缩',
  '任务', '流程', '审批', '工作流', '自动化',
  '日志', '监控', '告警', '运维', '部署',
  '缓存', '队列', '定时任务', '并发', '高可用',
];

// 中文停用词
const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它',
  '这', '那', '就', '也', '都', '而', '及', '与', '或', '但', '如果',
  '因为', '所以', '虽然', '可以', '需要', '应该', '能够', '一个', '一些',
  '什么', '怎么', '如何', '为什么', '这个', '那个', '请', '要', '想', '希望',
]);

export interface ExtractedKeyword {
  keyword: string;
  category: string;
  weight: number;
  position: number;
  length: number;
}

export interface KeywordExtractionResult {
  keywords: ExtractedKeyword[];
  industries: string[];
  features: string[];
  processingTimeMs: number;
}

/**
 * 提取关键词
 * 性能目标: < 50ms
 */
export function extractKeywords(input: string): KeywordExtractionResult {
  const startTime = performance.now();
  
  if (!input || input.trim().length === 0) {
    return {
      keywords: [],
      industries: [],
      features: [],
      processingTimeMs: performance.now() - startTime,
    };
  }

  const normalizedInput = input.toLowerCase();
  const result: ExtractedKeyword[] = [];
  const industries: Set<string> = new Set();
  const features: Set<string> = new Set();

  // 1. 提取行业关键词
  for (const [industry, keywords] of INDUSTRY_KEYWORDS) {
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      const pos = normalizedInput.indexOf(lowerKeyword);
      
      if (pos !== -1) {
        // 计算权重：关键词越长、出现越早，权重越高
        const lengthWeight = keyword.length / 10;
        const positionWeight = 1 - (pos / normalizedInput.length) * 0.3;
        const weight = Math.min(1, lengthWeight + positionWeight);
        
        result.push({
          keyword,
          category: 'industry',
          weight,
          position: pos,
          length: keyword.length,
        });
        
        industries.add(industry);
      }
    }
  }

  // 2. 提取功能关键词
  for (const feature of FEATURE_KEYWORDS) {
    const lowerFeature = feature.toLowerCase();
    const pos = normalizedInput.indexOf(lowerFeature);
    
    if (pos !== -1) {
      result.push({
        keyword: feature,
        category: 'feature',
        weight: 0.5 + (feature.length / 20),
        position: pos,
        length: feature.length,
      });
      
      features.add(feature);
    }
  }

  // 3. 提取 n-gram 关键词（2-4字词组）
  const ngrams = extractNgrams(input);
  for (const ngram of ngrams) {
    // 跳过停用词
    if (STOP_WORDS.has(ngram.text) || ngram.text.length < 2) continue;
    
    // 跳过已存在的关键词
    if (result.some(k => k.keyword.includes(ngram.text) || ngram.text.includes(k.keyword))) continue;
    
    result.push({
      keyword: ngram.text,
      category: 'ngram',
      weight: ngram.frequency * 0.3,
      position: ngram.position,
      length: ngram.text.length,
    });
  }

  // 按权重排序，取前 10 个
  result.sort((a, b) => b.weight - a.weight);
  const topKeywords = result.slice(0, 10);

  return {
    keywords: topKeywords,
    industries: Array.from(industries),
    features: Array.from(features),
    processingTimeMs: performance.now() - startTime,
  };
}

/**
 * 提取 n-gram 词组
 */
function extractNgrams(text: string): Array<{ text: string; position: number; frequency: number }> {
  const ngrams: Map<string, { position: number; count: number }> = new Map();
  
  // 提取 2-4 字的词组
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= text.length - len; i++) {
      const ngram = text.slice(i, i + len);
      
      // 只保留包含汉字或字母的词组
      if (!/[\u4e00-\u9fa5a-zA-Z]/.test(ngram)) continue;
      
      const existing = ngrams.get(ngram);
      if (existing) {
        existing.count++;
      } else {
        ngrams.set(ngram, { position: i, count: 1 });
      }
    }
  }
  
  // 转换为数组并计算频率
  const total = Array.from(ngrams.values()).reduce((sum, v) => sum + v.count, 0);
  
  return Array.from(ngrams.entries())
    .map(([text, { position, count }]) => ({
      text,
      position,
      frequency: count / total,
    }))
    .filter(n => n.frequency > 0.01) // 过滤低频词组
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
}

/**
 * 快速关键词检查（用于实时输入）
 * 性能目标: < 10ms
 */
export function quickKeywordCheck(input: string): string[] {
  if (!input || input.length < 2) return [];
  
  const results: string[] = [];
  const normalized = input.toLowerCase();
  
  // 快速检查行业关键词
  for (const [industry, keywords] of INDUSTRY_KEYWORDS) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        results.push(keyword);
      }
    }
  }
  
  // 快速检查功能关键词
  for (const feature of FEATURE_KEYWORDS) {
    if (normalized.includes(feature.toLowerCase())) {
      results.push(feature);
    }
  }
  
  return [...new Set(results)].slice(0, 5);
}

export default {
  extractKeywords,
  quickKeywordCheck,
  INDUSTRY_KEYWORDS,
  FEATURE_KEYWORDS,
};
