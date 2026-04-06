/**
 * Clarify Chat API - Interactive Requirement Clarification
 * POST /api/clarify/chat
 * 
 * Provides conversational clarification of requirements using AI.
 * 
 * @module app/api/clarify/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/services/ai-service';
import { getLocalEnv } from '@/lib/env';

import { safeError } from '@/lib/log-sanitizer';


// E-P0-3: API v0 deprecation header (per architecture.md ADR-003)
const V0_DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Sat, 31 May 2026 23:59:59 GMT',
  'X-API-Deprecation-Info': 'https://docs.vibex.ai/api-v0-sunset',
};

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: {
    requirementText?: string;
    projectId?: string;
    [key: string]: unknown;
  };
}

type ChatResponse = {
  reply: string;
  quickReplies?: string[];
  completeness: number;
  suggestions?: string[];
  nextAction: string;
  error?: string;
};

function buildClarificationSystemPrompt(): string {
  return `You are an expert requirements analyst for the VibeX AI Prototype Builder.

Your role is to clarify ambiguous or incomplete software requirements through conversation.

Guidelines:
1. Ask ONE focused question at a time
2. Focus on the most critical missing information
3. When requirements are clear enough, provide a summary and suggest next steps
4. Track clarity/completeness of the requirement
5. Suggest concrete next actions when the requirement is well-defined

Question categories to explore:
- User roles and permissions
- Core features and behaviors
- Data requirements
- Integration points
- Edge cases and error handling
- Performance requirements
- UI/UX expectations

Always respond in Chinese (Simplified) unless the user writes in another language.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [], context = {} } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ reply: '', completeness: 0, nextAction: 'error', error: '消息内容不能为空' }, { headers: V0_DEPRECATION_HEADERS, status: 400 });
    }

    const env = getLocalEnv();
    const aiService = createAIService(env);

    const systemPrompt = buildClarificationSystemPrompt();

    // Build conversation context string
    let conversationContext = '';
    if (context.requirementText) {
      conversationContext = `【当前需求原文】\n"""\n${context.requirementText}\n"""\n\n`;
    }
    for (const msg of history) {
      const role = msg.role === 'assistant' ? '【助手】' : '【用户】';
      conversationContext += `${role}: ${msg.content}\n`;
    }
    conversationContext += `【用户】: ${message}`;

    // Count clarification rounds
    const rounds = history.filter(m => m.role === 'user').length;
    
    // Estimate completeness based on rounds
    let completeness = 0.5;
    if (rounds >= 5) completeness = 0.9;
    else if (rounds >= 3) completeness = 0.75;
    else if (rounds >= 1) completeness = 0.6;

    // Generate reply
    const replyResult = await aiService.generateText(
      systemPrompt,
      conversationContext,
      { temperature: 0.7, maxTokens: 1024 }
    );

    const replyText = replyResult.data ?? '好的，让我们继续澄清需求。';

    // Quick replies based on stage
    const quickReplies: string[] = completeness < 0.8
      ? ['我已补充更多信息', '还有其他不明确的地方', '可以了，总结一下需求']
      : ['可以，开始生成原型', '需要调整需求', '导出需求文档'];

    // Suggestions
    const suggestions: string[] = completeness >= 0.8
      ? ['需求已足够清晰，可以开始生成原型']
      : [];

    // Next action
    const nextAction: string = completeness >= 0.85 || rounds >= 5 ? 'ready' : 'continue';

    const response: ChatResponse = {
      reply: replyText,
      quickReplies,
      completeness,
      suggestions,
      nextAction,
    };

    return NextResponse.json(response, { headers: V0_DEPRECATION_HEADERS });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    safeError('[Clarify Chat] Error:', errorMessage);
    return NextResponse.json({
      reply: '',
      completeness: 0,
      nextAction: 'error',
      error: `澄清失败: ${errorMessage}`,
    }, { headers: V0_DEPRECATION_HEADERS, status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Clarify Chat API is running. Use POST with { message, history?, context? }',
    endpoint: '/api/clarify/chat',
    method: 'POST',
    request: {
      message: 'string (required)',
      history: 'ChatMessage[] (optional)',
      context: '{ requirementText?: string; projectId?: string } (optional)',
    },
    response: {
      reply: 'string',
      quickReplies: 'string[]',
      completeness: 'number (0-1)',
      suggestions: 'string[]',
      nextAction: 'string',
    },
  }, { headers: V0_DEPRECATION_HEADERS });
}
