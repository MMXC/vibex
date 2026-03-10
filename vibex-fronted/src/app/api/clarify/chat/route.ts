/**
 * Clarification Chat API
 * 处理对话式需求澄清
 */

import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  history: { role: string; content: string }[];
  context?: Record<string, unknown>;
}

interface ChatResponse {
  reply: string;
  quickReplies?: string[];
  completeness: number;
  suggestions?: string[];
  nextAction: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, context } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息不能为空', reply: '', completeness: 0, nextAction: 'error' },
        { status: 400 }
      );
    }

    // Simple rule-based response (replace with AI integration)
    const reply = generateReply(message, history);
    const quickReplies = generateQuickReplies(message, history);
    const { completeness, suggestions } = scoreContext(message, history);

    const response: ChatResponse = {
      reply,
      quickReplies,
      completeness,
      suggestions,
      nextAction: determineNextAction(completeness, history.length),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误', reply: '', completeness: 0, nextAction: 'error' },
      { status: 500 }
    );
  }
}

function generateReply(message: string, history: { role: string; content: string }[]): string {
  const msg = message.toLowerCase();
  
  // First message - project type detection
  if (history.length === 0) {
    if (msg.includes('管理')) {
      return '明白了，这是一个管理系统。请告诉我主要的功能模块有哪些？比如用户管理、订单管理、报表统计等。';
    }
    if (msg.includes('电商') || msg.includes('商城') || msg.includes('购物')) {
      return '好的，这是一个电商平台。请告诉我商品展示、购物车、订单处理、支付流程等核心功能的需求？';
    }
    if (msg.includes('博客') || msg.includes('内容')) {
      return '收到，这是一个内容类网站。请说明文章发布、分类浏览、评论互动等功能的详细需求？';
    }
    return '好的，我理解了你的需求。为了更好地帮你梳理，请告诉我：\n1. 主要的目标用户是谁？\n2. 需要哪些核心功能？';
  }

  // Follow-up responses
  if (msg.includes('用户')) {
    return '了解了用户相关需求。那么系统是否需要权限管理？比如管理员、普通用户、不同角色权限等？';
  }

  if (msg.includes('功能') || msg.includes('模块')) {
    return '好的，功能模块很重要。请说明每个模块的主要业务流程，以及是否需要与其他系统对接？';
  }

  if (msg.includes('接口') || msg.includes('对接') || msg.includes('API')) {
    return '明白，需要与外部系统对接。请告诉我需要对接哪些系统？比如支付、短信、第三方登录等？';
  }

  return '明白了。还有什么需要补充的吗？比如界面设计要求、技术栈偏好、或者上线时间要求？';
}

function generateQuickReplies(message: string, history: { role: string; content: string }[]): string[] {
  if (history.length === 0) {
    return ['用户管理系统', '电商平台', '内容网站/博客', '企业内部系统'];
  }
  return ['有权限管理', '无特殊权限', '需要对接其他系统', '暂不确定'];
}

function scoreContext(message: string, history: { role: string; content: string }[]): { 
  completeness: number; 
  suggestions: string[] 
} {
  const allText = [message, ...history.map(h => h.content)].join(' ').toLowerCase();
  const suggestions: string[] = [];
  
  let score = 20; // Base score

  // Project type (20 points)
  if (allText.includes('管理') || allText.includes('电商') || allText.includes('商城') || 
      allText.includes('博客') || allText.includes('平台') || allText.includes('系统')) {
    score += 20;
  } else {
    suggestions.push('请说明项目类型');
  }

  // Features (20 points)
  if (allText.includes('功能') || allText.includes('模块') || allText.includes('主要')) {
    score += 20;
  } else {
    suggestions.push('请描述核心功能');
  }

  // Users (15 points)
  if (allText.includes('用户') || allText.includes('客户') || allText.includes('会员')) {
    score += 15;
  } else {
    suggestions.push('请说明目标用户');
  }

  // Technical (15 points)
  if (allText.includes('技术') || allText.includes('框架') || allText.includes('语言') || 
      allText.includes('数据库') || allText.includes('接口')) {
    score += 15;
  }

  // UI (10 points)
  if (allText.includes('界面') || allText.includes('设计') || allText.includes('风格') || 
      allText.includes('UI')) {
    score += 10;
  }

  // Turn count bonus
  if (history.length >= 3) score += 10;
  if (history.length >= 5) score += 10;

  return {
    completeness: Math.min(100, score),
    suggestions: suggestions.slice(0, 3),
  };
}

function determineNextAction(completeness: number, turnCount: number): string {
  if (completeness >= 85) {
    return 'generate_summary';
  }
  if (turnCount >= 5) {
    return 'confirm_summary';
  }
  if (completeness >= 60) {
    return 'refine_details';
  }
  return 'gather_more_info';
}
