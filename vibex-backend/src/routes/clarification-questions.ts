/**
 * Clarification Questions API Routes
 * 
 * Provides endpoints for generating and managing clarification questions
 * for requirements using LLM. These questions help clarify ambiguous or
 * incomplete requirements before confirmation.
 * 
 * @module routes/clarification-questions
 */

import { Hono } from 'hono';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { createLLMService, LLMService, ChatMessage } from '@/services/llm';

import { safeError } from '@/lib/log-sanitizer';

const clarificationQuestions = new Hono<{ Bindings: Env }>();

// ==================== Types ====================

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'open' | 'choice' | 'multiple';
  options?: string[];
  category: string;
  priority: 'low' | 'medium' | 'high';
  answer?: string;
  answeredAt?: string;
}

interface ClarificationData {
  questions: ClarificationQuestion[];
  generatedAt: string;
  answeredAt?: string;
  answeredCount: number;
  totalQuestions: number;
}

interface GenerateQuestionsRequest {
  requirementId: string;
  maxQuestions?: number;
  categories?: string[];
  regenerate?: boolean;
}

interface AnswerQuestionRequest {
  questionId: string;
  answer: string;
}

// ==================== LLM Prompts ====================

const CLARIFICATION_SYSTEM_PROMPT = `You are an expert requirements analyst. Your task is to generate clarification questions for a software requirement.

Analyze the requirement and identify areas that need clarification. These may include:
- Ambiguous terms or concepts
- Missing technical details
- Unclear user interactions
- Data model ambiguities
- Edge cases not covered
- Performance requirements
- Security considerations
- Integration points

You must respond with a valid JSON object in the following format:
{
  "questions": [
    {
      "question": "The question text",
      "type": "open|choice|multiple",
      "options": ["option1", "option2"] (only for choice/multiple types),
      "category": "functionality|data|ui|security|performance|integration|other",
      "priority": "low|medium|high"
    }
  ]
}

Guidelines:
1. Generate 3-7 focused questions that would help clarify the requirement
2. Use "open" type for free-form text answers
3. Use "choice" type when there are limited options (provide 2-5 options)
4. Use "multiple" type when multiple selections are allowed
5. Categories: functionality, data, ui, security, performance, integration, other
6. Priority reflects how critical the answer is to understanding the requirement
7. Questions should be specific and actionable
8. Avoid questions that are already clearly answered in the requirement`;

// ==================== Helper Functions ====================

/**
 * Parse LLM response as JSON with error handling
 */
function parseQuestionsResponse(content: string): ClarificationQuestion[] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed.questions)) {
      return null;
    }
    
    // Validate and transform questions
    return parsed.questions.map((q: any, index: number) => ({
      id: generateId(),
      question: q.question || '',
      type: ['open', 'choice', 'multiple'].includes(q.type) ? q.type : 'open',
      options: Array.isArray(q.options) ? q.options : undefined,
      category: q.category || 'other',
      priority: ['low', 'medium', 'high'].includes(q.priority) ? q.priority : 'medium',
    })).filter((q: ClarificationQuestion) => q.question.length > 0);
    
  } catch (error) {
    safeError('Failed to parse questions response:', error);
    return null;
  }
}

/**
 * Get existing clarification data from requirement
 */
function getClarificationData(parsedData: string | null): ClarificationData | null {
  if (!parsedData) return null;
  
  try {
    const parsed = JSON.parse(parsedData);
    if (parsed.clarification && Array.isArray(parsed.clarification.questions)) {
      return parsed.clarification;
    }
  } catch {
    // Invalid JSON
  }
  
  return null;
}

/**
 * Update clarification data in requirement
 */
async function updateClarificationData(
  env: Env,
  requirementId: string,
  clarificationData: ClarificationData
): Promise<void> {
  // Get current parsedData
  const requirement = await queryOne<RequirementRow>(
    env,
    'SELECT parsedData FROM Requirement WHERE id = ?',
    [requirementId]
  );
  
  let parsedData: Record<string, any> = {};
  
  if (requirement?.parsedData) {
    try {
      parsedData = JSON.parse(requirement.parsedData);
    } catch {
      // Start fresh if invalid JSON
      parsedData = {};
    }
  }
  
  // Update clarification data
  parsedData.clarification = clarificationData;
  
  const now = new Date().toISOString();
  await executeDB(
    env,
    'UPDATE Requirement SET parsedData = ?, updatedAt = ? WHERE id = ?',
    [JSON.stringify(parsedData), now, requirementId]
  );
}

/**
 * Update requirement status based on clarification progress
 */
async function updateRequirementStatus(
  env: Env,
  requirementId: string,
  clarificationData: ClarificationData
): Promise<void> {
  const now = new Date().toISOString();
  
  // If all questions answered, mark as clarified
  if (clarificationData.answeredCount === clarificationData.totalQuestions) {
    await executeDB(
      env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      ['clarified', now, requirementId]
    );
  } else if (clarificationData.answeredCount > 0) {
    // If some questions answered, status is clarifying
    await executeDB(
      env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      ['clarifying', now, requirementId]
    );
  }
}

// ==================== API Routes ====================

/**
 * POST /api/clarification-questions - Generate clarification questions for a requirement
 * 
 * Request body:
 * - requirementId: string (required) - ID of the requirement to generate questions for
 * - maxQuestions: number (optional) - Maximum number of questions to generate (default: 5)
 * - regenerate: boolean (optional) - Force regeneration even if questions exist
 * 
 * Response:
 * - questions: ClarificationQuestion[]
 * - requirement: RequirementRow
 */
clarificationQuestions.post('/', async (c) => {
  try {
    const body = await c.req.json() as GenerateQuestionsRequest;
    const { requirementId, maxQuestions = 5, regenerate } = body;

    if (!requirementId) {
      return c.json({ error: 'Missing required field: requirementId' }, 400);
    }

    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    // Check if clarification questions already exist
    const existingClarification = getClarificationData(requirement.parsedData);
    
    if (existingClarification && !regenerate) {
      return c.json({
        success: true,
        questions: existingClarification.questions,
        clarification: existingClarification,
        requirement,
        cached: true,
      }, 200);
    }

    // Update status to clarifying
    await executeDB(
      env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      ['clarifying', new Date().toISOString(), requirementId]
    );

    try {
      // Create LLM service
      const llmService = createLLMService(env);

      // Build prompt for generating clarification questions
      const userPrompt = `Please analyze the following software requirement and generate clarification questions:

Requirement:
"""
${requirement.rawInput}
"""

Generate up to ${maxQuestions} focused questions that would help clarify ambiguous or incomplete aspects of this requirement.

Format your response as a JSON object with a "questions" array.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: CLARIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      // Call LLM for question generation
      const response = await llmService.chat({
        messages,
        temperature: 0.5, // Moderate temperature for creative but relevant questions
        maxTokens: 2048,
        responseFormat: 'json_object',
      });

      const questions = parseQuestionsResponse(response.content);

      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate clarification questions');
      }

      // Limit questions to maxQuestions
      const limitedQuestions = questions.slice(0, maxQuestions);

      // Create clarification data
      const clarificationData: ClarificationData = {
        questions: limitedQuestions,
        generatedAt: new Date().toISOString(),
        answeredCount: 0,
        totalQuestions: limitedQuestions.length,
      };

      // Update requirement with clarification data
      await updateClarificationData(env, requirementId, clarificationData);

      // Fetch updated requirement
      const updatedRequirement = await queryOne<RequirementRow>(
        env,
        'SELECT * FROM Requirement WHERE id = ?',
        [requirementId]
      );

      return c.json({
        success: true,
        questions: limitedQuestions,
        clarification: clarificationData,
        requirement: updatedRequirement,
        cached: false,
      }, 200);

    } catch (llmError) {
      // Reset status on error
      await executeDB(
        env,
        'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
        [requirement.status, new Date().toISOString(), requirementId]
      );
      throw llmError;
    }

  } catch (error) {
    safeError('Error generating clarification questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to generate clarification questions', 
      details: errorMessage 
    }, 500);
  }
});

/**
 * GET /api/clarification-questions/:requirementId - Get clarification questions for a requirement
 * 
 * Response:
 * - questions: ClarificationQuestion[]
 * - clarification: ClarificationData
 * - requirement: RequirementRow
 */
clarificationQuestions.get('/:requirementId', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    // Get clarification data
    const clarificationData = getClarificationData(requirement.parsedData);

    if (!clarificationData) {
      return c.json({
        success: true,
        questions: [],
        clarification: null,
        requirement,
        message: 'No clarification questions generated yet. Use POST to generate questions.',
      }, 200);
    }

    return c.json({
      success: true,
      questions: clarificationData.questions,
      clarification: clarificationData,
      requirement,
    }, 200);

  } catch (error) {
    safeError('Error fetching clarification questions:', error);
    return c.json({ error: 'Failed to fetch clarification questions' }, 500);
  }
});

/**
 * POST /api/clarification-questions/:requirementId/answers - Submit answers to clarification questions
 * 
 * Request body:
 * - answers: Array<{ questionId: string, answer: string }>
 * 
 * Response:
 * - questions: ClarificationQuestion[] (with answers)
 * - clarification: ClarificationData
 * - requirement: RequirementRow
 */
clarificationQuestions.post('/:requirementId/answers', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const body = await c.req.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return c.json({ error: 'Missing or invalid field: answers (must be a non-empty array)' }, 400);
    }

    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    // Get existing clarification data
    const clarificationData = getClarificationData(requirement.parsedData);

    if (!clarificationData) {
      return c.json({ 
        error: 'No clarification questions found. Generate questions first.' 
      }, 400);
    }

    // Process answers
    const now = new Date().toISOString();
    let answeredCount = 0;

    for (const answerItem of answers) {
      const { questionId, answer } = answerItem;
      
      if (!questionId || !answer) continue;
      
      const question = clarificationData.questions.find(q => q.id === questionId);
      if (question) {
        question.answer = answer;
        question.answeredAt = now;
      }
    }

    // Update answered count
    answeredCount = clarificationData.questions.filter(q => q.answer).length;
    clarificationData.answeredCount = answeredCount;
    clarificationData.answeredAt = answeredCount === clarificationData.totalQuestions ? now : undefined;

    // Update requirement
    await updateClarificationData(env, requirementId, clarificationData);
    await updateRequirementStatus(env, requirementId, clarificationData);

    // Fetch updated requirement
    const updatedRequirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    return c.json({
      success: true,
      questions: clarificationData.questions,
      clarification: clarificationData,
      requirement: updatedRequirement,
      answeredCount,
      totalQuestions: clarificationData.totalQuestions,
    }, 200);

  } catch (error) {
    safeError('Error submitting answers:', error);
    return c.json({ error: 'Failed to submit answers' }, 500);
  }
});

/**
 * PUT /api/clarification-questions/:requirementId/answers/:questionId - Update a single answer
 * 
 * Request body:
 * - answer: string
 * 
 * Response:
 * - question: ClarificationQuestion (updated)
 * - clarification: ClarificationData
 */
clarificationQuestions.put('/:requirementId/answers/:questionId', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const questionId = c.req.param('questionId');
    const body = await c.req.json();
    const { answer } = body;

    if (!answer) {
      return c.json({ error: 'Missing required field: answer' }, 400);
    }

    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    // Get existing clarification data
    const clarificationData = getClarificationData(requirement.parsedData);

    if (!clarificationData) {
      return c.json({ 
        error: 'No clarification questions found. Generate questions first.' 
      }, 400);
    }

    // Find and update the question
    const question = clarificationData.questions.find(q => q.id === questionId);
    
    if (!question) {
      return c.json({ error: 'Question not found' }, 404);
    }

    // Update answer
    const now = new Date().toISOString();
    question.answer = answer;
    question.answeredAt = now;

    // Update counts
    clarificationData.answeredCount = clarificationData.questions.filter(q => q.answer).length;
    
    if (clarificationData.answeredCount === clarificationData.totalQuestions) {
      clarificationData.answeredAt = now;
    }

    // Update requirement
    await updateClarificationData(env, requirementId, clarificationData);
    await updateRequirementStatus(env, requirementId, clarificationData);

    // Fetch updated requirement
    const updatedRequirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    return c.json({
      success: true,
      question,
      clarification: clarificationData,
      requirement: updatedRequirement,
    }, 200);

  } catch (error) {
    safeError('Error updating answer:', error);
    return c.json({ error: 'Failed to update answer' }, 500);
  }
});

/**
 * DELETE /api/clarification-questions/:requirementId - Delete clarification questions
 * 
 * Removes all clarification questions and answers for a requirement.
 * Resets the requirement status to 'draft'.
 */
clarificationQuestions.delete('/:requirementId', async (c) => {
  try {
    const requirementId = c.req.param('requirementId');
    const env = c.env;

    // Fetch the requirement
    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return c.json({ error: 'Requirement not found' }, 404);
    }

    // Get current parsedData
    let parsedData: Record<string, any> = {};
    
    if (requirement.parsedData) {
      try {
        parsedData = JSON.parse(requirement.parsedData);
      } catch {
        // Invalid JSON, nothing to delete
        return c.json({
          success: true,
          message: 'No clarification data to delete',
          requirementId,
        }, 200);
      }
    }

    // Remove clarification data
    if (parsedData.clarification) {
      delete parsedData.clarification;
    } else {
      return c.json({
        success: true,
        message: 'No clarification data to delete',
        requirementId,
      }, 200);
    }

    // Update requirement
    const now = new Date().toISOString();
    await executeDB(
      env,
      'UPDATE Requirement SET parsedData = ?, status = ?, updatedAt = ? WHERE id = ?',
      [JSON.stringify(parsedData), 'draft', now, requirementId]
    );

    // Fetch updated requirement
    const updatedRequirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    return c.json({
      success: true,
      message: 'Clarification questions deleted successfully',
      requirementId,
      requirement: updatedRequirement,
    }, 200);

  } catch (error) {
    safeError('Error deleting clarification questions:', error);
    return c.json({ error: 'Failed to delete clarification questions' }, 500);
  }
});

export default clarificationQuestions;