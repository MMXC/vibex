/**
 * Prompt Engineering Module
 * 
 * This module provides utilities for engineering, composing, and optimizing
 * prompts for the VibeX AI Prototype Builder. It includes support for:
 * - Prompt templates with variable interpolation
 * - Few-shot learning with example management
 * - Chain-of-thought reasoning patterns
 * - Prompt versioning and history
 * - Prompt validation and optimization
 */

import { randomUUID } from 'crypto';

// ============================================
// Types and Interfaces
// ============================================

/**
 * Prompt variable types
 */
export type PromptVariableValue = string | number | boolean | string[] | Record<string, unknown> | null;

/**
 * Prompt variables for template interpolation
 */
export interface PromptVariables {
  [key: string]: PromptVariableValue;
}

/**
 * Prompt template definition
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  version: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category?: string;
}

/**
 * Few-shot example for prompt engineering
 */
export interface FewShotExample {
  id: string;
  input: string;
  output: string;
  explanation?: string;
  tags?: string[];
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Example set for few-shot learning
 */
export interface ExampleSet {
  id: string;
  name: string;
  description: string;
  examples: FewShotExample[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Prompt configuration
 */
export interface PromptConfig {
  /** System message to set AI behavior */
  systemMessage?: string;
  /** User message template */
  userMessage?: string;
  /** Few-shot examples to include */
  examples?: FewShotExample[];
  /** Number of examples to use (0-5) */
  exampleCount?: number;
  /** Enable chain-of-thought reasoning */
  enableChainOfThought?: boolean;
  /** Custom reasoning prompt */
  chainOfThoughtPrompt?: string;
  /** Temperature setting */
  temperature?: number;
  /** Maximum tokens */
  maxTokens?: number;
  /** Response format expectation */
  responseFormat?: 'json' | 'text' | 'markdown' | 'code';
}

/**
 * Composed prompt result
 */
export interface ComposedPrompt {
  systemMessage: string;
  userMessage: string;
  examples: FewShotExample[];
  metadata: {
    templateId?: string;
    exampleSetId?: string;
    variableCount: number;
    estimatedTokens: number;
    composedAt: string;
  };
}

/**
 * Prompt optimization result
 */
export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  estimatedImprovement: number;
}

/**
 * Prompt validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

export interface ValidationError {
  type: 'missing_variable' | 'invalid_syntax' | 'ambiguous_instruction' | 'too_long' | 'unsafe_content';
  message: string;
  position?: { start: number; end: number };
}

export interface ValidationWarning {
  type: 'long_prompt' | 'weak_instruction' | 'missing_context' | 'potential_ambiguity';
  message: string;
  suggestion?: string;
}

// ============================================
// Prompt Template Engine
// ============================================

/**
 * Interpolate variables into a prompt template
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  variables: PromptVariables
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    let replacement: string;
    
    if (value === null || value === undefined) {
      replacement = '';
    } else if (Array.isArray(value)) {
      replacement = value.join(', ');
    } else if (typeof value === 'object') {
      replacement = JSON.stringify(value, null, 2);
    } else {
      replacement = String(value);
    }
    
    result = result.split(placeholder).join(replacement);
  }
  
  return result;
}

/**
 * Extract variable names from a template
 * 
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of variable names
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}

/**
 * Validate that all required variables are provided
 * 
 * @param template - Template string
 * @param variables - Provided variables
 * @returns Array of missing variable names
 */
export function validateVariables(
  template: string,
  variables: PromptVariables
): string[] {
  const required = extractVariables(template);
  const provided = Object.keys(variables);
  
  return required.filter(v => !provided.includes(v));
}

/**
 * Create a new prompt template
 * 
 * @param name - Template name
 * @param description - Template description
 * @param template - Template string with {{variable}} placeholders
 * @param options - Additional options
 * @returns Created prompt template
 */
export function createPromptTemplate(
  name: string,
  description: string,
  template: string,
  options?: {
    tags?: string[];
    category?: string;
    version?: string;
  }
): PromptTemplate {
  const now = new Date().toISOString();
  
  return {
    id: randomUUID(),
    name,
    description,
    template,
    variables: extractVariables(template),
    version: options?.version || '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags: options?.tags || [],
    category: options?.category,
  };
}

// ============================================
// Few-Shot Example Management
// ============================================

/**
 * Create a few-shot example
 * 
 * @param input - Example input
 * @param output - Expected output
 * @param options - Additional options
 * @returns Created example
 */
export function createFewShotExample(
  input: string,
  output: string,
  options?: {
    explanation?: string;
    tags?: string[];
    quality?: 'low' | 'medium' | 'high';
  }
): FewShotExample {
  return {
    id: randomUUID(),
    input,
    output,
    explanation: options?.explanation,
    tags: options?.tags || [],
    quality: options?.quality || 'medium',
  };
}

/**
 * Select best examples for a prompt based on relevance
 * 
 * @param examples - Available examples
 * @param count - Number of examples to select
 * @param query - Query to match against
 * @returns Selected examples
 */
export function selectExamples(
  examples: FewShotExample[],
  count: number,
  query: string
): FewShotExample[] {
  // Score examples by relevance to query
  const scored = examples.map(example => {
    const queryLower = query.toLowerCase();
    const inputLower = example.input.toLowerCase();
    const outputLower = example.output.toLowerCase();
    
    // Calculate relevance score
    const queryWords = queryLower.split(/\s+/);
    let score = 0;
    
    for (const word of queryWords) {
      if (inputLower.includes(word)) score += 2;
      if (outputLower.includes(word)) score += 1;
    }
    
    // Boost high quality examples
    if (example.quality === 'high') score *= 1.5;
    else if (example.quality === 'low') score *= 0.5;
    
    return { example, score };
  });
  
  // Sort by score and return top examples
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.example);
}

/**
 * Format examples for inclusion in prompt
 * 
 * @param examples - Examples to format
 * @param format - Format type ('standard' | 'json' | 'concise')
 * @returns Formatted examples string
 */
export function formatExamples(
  examples: FewShotExample[],
  format: 'standard' | 'json' | 'concise' = 'standard'
): string {
  if (examples.length === 0) return '';
  
  switch (format) {
    case 'json':
      return JSON.stringify(examples, null, 2);
    
    case 'concise':
      return examples
        .map(e => `Input: ${e.input}\nOutput: ${e.output}`)
        .join('\n\n');
    
    case 'standard':
    default:
      return examples
        .map((e, i) => {
          let text = `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}`;
          if (e.explanation) {
            text += `\nExplanation: ${e.explanation}`;
          }
          return text;
        })
        .join('\n\n');
  }
}

// ============================================
// Chain-of-Thought Reasoning
// ============================================

/**
 * Generate chain-of-thought reasoning prompt
 * 
 * @param question - The question to answer
 * @param enableStepByStep - Enable step-by-step reasoning
 * @returns Chain-of-thought enhanced prompt
 */
export function generateChainOfThoughtPrompt(
  question: string,
  enableStepByStep: boolean = true
): string {
  if (!enableStepByStep) {
    return question;
  }
  
  return `${question}

Please think through this step by step:
1. First, identify what information is given
2. Then, determine what needs to be found
3. Next, plan your approach
4. Then, execute the plan
5. Finally, verify the answer

Show your reasoning for each step.`;
}

/**
 * Generate zero-shot chain-of-thought prompt
 * 
 * @param question - The question to answer
 * @returns Zero-shot CoT prompt
 */
export function generateZeroShotCoTPrompt(question: string): string {
  return `${question}

Let's think step by step.`;
}

/**
 * Generate few-shot chain-of-thought prompt
 * 
 * @param question - The question to answer
 * @param examples - Examples with reasoning
 * @returns Few-shot CoT prompt
 */
export function generateFewShotCoTPrompt(
  question: string,
  examples: { input: string; reasoning: string; output: string }[]
): string {
  const examplesText = examples
    .map(e => `Input: ${e.input}\nReasoning: ${e.reasoning}\nOutput: ${e.output}`)
    .join('\n\n');
  
  return `Examples:
${examplesText}

Now solve this:
Input: ${question}

Show your reasoning step by step.`;
}

// ============================================
// Prompt Composition
// ============================================

/**
 * Compose a complete prompt from configuration
 * 
 * @param config - Prompt configuration
 * @returns Composed prompt with system and user messages
 */
export function composePrompt(config: PromptConfig): ComposedPrompt {
  const systemMessage = config.systemMessage || '';
  let userMessage = config.userMessage || '';
  
  // Add chain-of-thought if enabled
  if (config.enableChainOfThought) {
    const cotPrompt = config.chainOfThoughtPrompt || 'Please think step by step.';
    userMessage = `${userMessage}\n\n${cotPrompt}`;
  }
  
  // Select and format examples
  let examples: FewShotExample[] = [];
  if (config.examples && config.exampleCount && config.exampleCount > 0) {
    examples = selectExamples(
      config.examples,
      config.exampleCount,
      userMessage
    );
    
    const examplesText = formatExamples(examples);
    if (examplesText) {
      userMessage = `${userMessage}\n\n${examplesText}`;
    }
  }
  
  // Add response format guidance
  if (config.responseFormat) {
    const formatGuidance = getResponseFormatGuidance(config.responseFormat);
    userMessage = `${userMessage}\n\n${formatGuidance}`;
  }
  
  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  const totalText = systemMessage + userMessage;
  const estimatedTokens = Math.ceil(totalText.length / 4);
  
  return {
    systemMessage,
    userMessage,
    examples,
    metadata: {
      variableCount: extractVariables(userMessage).length,
      estimatedTokens,
      composedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get response format guidance based on format type
 */
function getResponseFormatGuidance(format: string): string {
  const guidances: Record<string, string> = {
    json: 'Please respond in valid JSON format.',
    markdown: 'Please respond using Markdown formatting.',
    code: 'Please respond with code only, without explanations unless asked.',
    text: 'Please respond in plain text format.',
  };
  
  return guidances[format] || '';
}

/**
 * Compose multiple prompts and combine them
 * 
 * @param prompts - Array of prompt strings or configurations
 * @param separator - Separator between prompts
 * @returns Combined prompt
 */
export function composeMultiplePrompts(
  prompts: (string | PromptConfig)[],
  separator: string = '\n\n'
): string {
  return prompts
    .map(p => {
      if (typeof p === 'string') return p;
      return composePrompt(p).userMessage;
    })
    .join(separator);
}

// ============================================
// Prompt Optimization
// ============================================

/**
 * Optimize a prompt for better results
 * 
 * @param prompt - Original prompt
 * @param optimizationType - Type of optimization to apply
 * @returns Optimization result
 */
export function optimizePrompt(
  prompt: string,
  optimizationType: 'clarity' | 'structure' | 'concise' | 'comprehensive' = 'clarity'
): OptimizationResult {
  let optimized = prompt;
  const improvements: string[] = [];
  
  switch (optimizationType) {
    case 'clarity':
      // Improve clarity by adding explicit instructions
      if (!prompt.includes('Please')) {
        optimized = `Please ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`;
        improvements.push('Added polite instruction prefix');
      }
      if (!prompt.includes('Specifically') && !prompt.includes('Specifically,')) {
        // Add specificity markers
        improvements.push('Consider adding "Specifically," for more focused responses');
      }
      break;
    
    case 'structure':
      // Add structure with sections
      if (!prompt.includes('##') && !prompt.includes('###')) {
        optimized = `## Task\n${prompt}\n\n## Requirements\n- Provide clear and structured output\n- Include relevant details`;
        improvements.push('Added structured sections');
      }
      break;
    
    case 'concise':
      // Make more concise
      const concisePatterns = [
        { from: 'Please try to', to: 'Please' },
        { from: 'It would be great if', to: 'Please' },
        { from: 'I would like you to', to: 'Please' },
        { from: 'Could you please', to: 'Please' },
        { from: 'Would you mind', to: 'Please' },
      ];
      
      for (const pattern of concisePatterns) {
        if (prompt.includes(pattern.from)) {
          optimized = prompt.replace(pattern.from, pattern.to);
          improvements.push(`Replaced "${pattern.from}" with "${pattern.to}"`);
          break;
        }
      }
      break;
    
    case 'comprehensive':
      // Add comprehensive guidelines
      optimized = `${prompt}

## Guidelines
- Provide thorough and detailed responses
- Include all relevant information
- Consider edge cases
- Explain your reasoning`;
      improvements.push('Added comprehensive guidelines');
      break;
  }
  
  const originalLength = prompt.length;
  const optimizedLength = optimized.length;
  const estimatedImprovement = Math.max(0, (originalLength - optimizedLength) / originalLength * 100);
  
  return {
    originalPrompt: prompt,
    optimizedPrompt: optimized,
    improvements,
    estimatedImprovement,
  };
}

/**
 * Apply best practices to a prompt
 * 
 * @param prompt - Original prompt
 * @returns Optimized prompt
 */
export function applyBestPractices(prompt: string): string {
  let optimized = prompt;
  
  // 1. Add explicit output format if not present
  if (!prompt.toLowerCase().includes('output') && 
      !prompt.toLowerCase().includes('respond') &&
      !prompt.toLowerCase().includes('format')) {
    // Don't add automatically, just note as suggestion
  }
  
  // 2. Add context preservation
  if (!prompt.includes('Given') && !prompt.includes('Based on')) {
    // Could add context framing
  }
  
  // 3. Remove redundant words
  const redundantPatterns = [
    /\bvery\b/gi,
    /\breally\b/gi,
    /\bjust\b/gi,
    /\bbasically\b/gi,
    /\bactually\b/gi,
  ];
  
  for (const pattern of redundantPatterns) {
    optimized = optimized.replace(pattern, '');
  }
  
  // 4. Clean up whitespace
  optimized = optimized.replace(/\s+/g, ' ').trim();
  
  return optimized;
}

// ============================================
// Prompt Validation
// ============================================

/**
 * Validate a prompt for common issues
 * 
 * @param prompt - Prompt to validate
 * @param maxLength - Maximum allowed length (default: 4000)
 * @returns Validation result
 */
export function validatePrompt(prompt: string, maxLength: number = 4000): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check length
  if (prompt.length > maxLength) {
    errors.push({
      type: 'too_long',
      message: `Prompt exceeds maximum length of ${maxLength} characters (current: ${prompt.length})`,
    });
  } else if (prompt.length > maxLength * 0.8) {
    warnings.push({
      type: 'long_prompt',
      message: 'Prompt is approaching maximum length',
      suggestion: 'Consider making the prompt more concise',
    });
  }
  
  // Check for missing context indicators
  const hasContext = /given|based on|according to|following|provided/gi.test(prompt);
  if (!hasContext && prompt.length > 200) {
    warnings.push({
      type: 'missing_context',
      message: 'Prompt may benefit from additional context framing',
      suggestion: 'Add phrases like "Given..." or "Based on..." to provide context',
    });
  }
  
  // Check for weak instructions
  const weakInstructions = /maybe|perhaps|possibly|if you want|if you think/gi;
  if (weakInstructions.test(prompt)) {
    warnings.push({
      type: 'weak_instruction',
      message: 'Prompt contains uncertain language',
      suggestion: 'Use definitive instructions like "Please" or "Ensure"',
    });
  }
  
  // Check for ambiguous pronouns
  const ambiguousPronouns = /\bit\b|\bthey\b|\bthem\b/gi;
  if (ambiguousPronouns.test(prompt)) {
    warnings.push({
      type: 'potential_ambiguity',
      message: 'Prompt contains potentially ambiguous pronouns',
      suggestion: 'Use specific entity names instead of pronouns',
    });
  }
  
  // Calculate score
  const errorCount = errors.length;
  const warningCount = warnings.length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 5);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

/**
 * Validate prompt variables
 * 
 * @param template - Template string
 * @param variables - Provided variables
 * @returns Validation result
 */
export function validatePromptVariables(
  template: string,
  variables: PromptVariables
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for missing variables
  const missing = validateVariables(template, variables);
  if (missing.length > 0) {
    errors.push({
      type: 'missing_variable',
      message: `Missing required variables: ${missing.join(', ')}`,
    });
  }
  
  // Check for unused variables
  const templateVars = extractVariables(template);
  const providedVars = Object.keys(variables);
  const unused = providedVars.filter(v => !templateVars.includes(v));
  
  if (unused.length > 0) {
    warnings.push({
      type: 'missing_context',
      message: `Unused variables provided: ${unused.join(', ')}`,
      suggestion: 'These variables are not used in the template',
    });
  }
  
  const score = errors.length === 0 ? 100 - warnings.length * 10 : 0;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

// ============================================
// Prompt Versioning
// ============================================

/**
 * Prompt version info
 */
export interface PromptVersion {
  version: string;
  prompt: string;
  changelog?: string;
  createdAt: string;
  author?: string;
}

/**
 * Create a new version of a prompt
 * 
 * @param prompt - Current prompt
 * @param version - New version number
 * @param changelog - Changes from previous version
 * @returns Versioned prompt
 */
export function createPromptVersion(
  prompt: string,
  version: string,
  changelog?: string,
  author?: string
): PromptVersion {
  return {
    version,
    prompt,
    changelog,
    createdAt: new Date().toISOString(),
    author,
  };
}

/**
 * Compare two prompt versions
 * 
 * @param version1 - First version
 * @param version2 - Second version
 * @returns Comparison result
 */
export function comparePromptVersions(
  version1: PromptVersion,
  version2: PromptVersion
): {
  lengthDiff: number;
  wordCountDiff: number;
  similarity: number;
} {
  const text1 = version1.prompt;
  const text2 = version2.prompt;
  
  const lengthDiff = text2.length - text1.length;
  const wordCountDiff = text2.split(/\s+/).length - text1.split(/\s+/).length;
  
  // Calculate simple similarity (Jaccard index on words)
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  const similarity = union.size > 0 ? intersection.size / union.size : 0;
  
  return { lengthDiff, wordCountDiff, similarity };
}

// ============================================
// Common Prompt Patterns
// ============================================

/**
 * Common prompt patterns
 */
export const PromptPatterns = {
  /**
   * Classification pattern
   */
  classification: (
    items: string[],
    categories: string[],
    description: string
  ) => `Given the following items: ${items.join(', ')}

Categories: ${categories.join(', ')}

${description}

Please classify each item into one of the categories above.`,

  /**
   * Extraction pattern
   */
  extraction: (
    text: string,
    fields: string[],
    format: 'json' | 'list' = 'json'
  ) => `From the following text, extract the specified information:

Text: ${text}

Fields to extract: ${fields.join(', ')}

Please respond in ${format} format.`,

  /**
   * Transformation pattern
   */
  transformation: (
    input: string,
    inputFormat: string,
    outputFormat: string
  ) => `Transform the following ${inputFormat} to ${outputFormat}:

${input}`,

  /**
   * Summarization pattern
   */
  summarization: (
    text: string,
    maxLength?: number,
    focus?: string
  ) => {
    let prompt = `Summarize the following text${focus ? ` focusing on ${focus}` : ''}:\n\n${text}`;
    if (maxLength) {
      prompt += `\n\nMaximum length: ${maxLength} words`;
    }
    return prompt;
  },

  /**
   * Question answering pattern
   */
  questionAnswering: (
    context: string,
    question: string
  ) => `Context: ${context}

Question: ${question}

Please provide a clear and accurate answer based on the context above.`,

  /**
   * Code generation pattern
   */
  codeGeneration: (
    language: string,
    description: string,
    requirements?: string[]
  ) => {
    let prompt = `Generate ${language} code for the following:\n\n${description}`;
    if (requirements && requirements.length > 0) {
      prompt += `\n\nRequirements:\n${requirements.map(r => `- ${r}`).join('\n')}`;
    }
    return prompt;
  },

  /**
   * Comparison pattern
   */
  comparison: (
    items: { name: string; description: string }[],
    criteria: string[]
  ) => `Compare the following items based on the criteria:

Items:
${items.map(i => `- ${i.name}: ${i.description}`).join('\n')}

Criteria: ${criteria.join(', ')}

Please provide a detailed comparison.`,

  /**
   * Reasoning pattern
   */
  reasoning: (
    problem: string,
    showWork: boolean = true
  ) => {
    let prompt = `Solve the following problem:\n\n${problem}`;
    if (showWork) {
      prompt += '\n\nPlease show your step-by-step reasoning.';
    }
    return prompt;
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Estimate token count for a prompt
 * 
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English
  // Adjust for other languages if needed
  return Math.ceil(text.length / 4);
}

/**
 * Truncate prompt to fit token limit
 * 
 * @param prompt - Prompt to truncate
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated prompt
 */
export function truncatePrompt(prompt: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  
  if (prompt.length <= maxChars) {
    return prompt;
  }
  
  // Find a good truncation point (end of sentence or paragraph)
  const truncated = prompt.slice(0, maxChars);
  const lastSentence = truncated.lastIndexOf('.');
  const lastParagraph = truncated.lastIndexOf('\n');
  const cutoff = Math.max(lastSentence, lastParagraph);
  
  if (cutoff > maxChars * 0.8) {
    return truncated.slice(0, cutoff + 1) + '\n\n[Content truncated...]';
  }
  
  return truncated + '\n\n[Content truncated...]';
}

/**
 * Sanitize prompt for safe execution
 * 
 * @param prompt - Prompt to sanitize
 * @returns Sanitized prompt
 */
export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;
  
  // Remove potentially harmful patterns (basic check)
  const harmfulPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/gi,
    /forget\s+(everything|all)/gi,
    /disregard\s+(all\s+)?(rules|guidelines)/gi,
  ];
  
  for (const pattern of harmfulPatterns) {
    sanitized = sanitized.replace(pattern, '[REMOVED]');
  }
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Generate a prompt ID
 * 
 * @param prefix - Optional prefix
 * @returns Generated ID
 */
export function generatePromptId(prefix?: string): string {
  const uuid = randomUUID().slice(0, 8);
  return prefix ? `${prefix}-${uuid}` : `prompt-${uuid}`;
}
