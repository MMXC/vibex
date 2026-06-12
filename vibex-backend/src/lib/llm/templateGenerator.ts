/**
 * templateGenerator — S91 E1: AI Template Generation
 *
 * Wraps LLM calls to generate canvas UI schema from natural language prompt.
 * Uses MiniMax API via the standard /v1/text/chatcompletion_v2 endpoint.
 */

export interface GeneratedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: GeneratedComponent[];
  style?: Record<string, string | number>;
}

export interface TemplateGenerationResult {
  name: string;
  description: string;
  category: string;
  tags: string[];
  components: GeneratedComponent[];
}

/**
 * Generate a canvas template from a natural language prompt.
 *
 * @param prompt - User's natural language description
 * @param apiKey - MiniMax API key from env
 * @returns Structured template data
 */
export async function generateTemplateFromPrompt(
  prompt: string,
  apiKey: string
): Promise<TemplateGenerationResult> {
  const baseUrl = process.env.MINIMAX_API_BASE ?? 'https://api.minimax.chat/v1';
  const model = process.env.MINIMAX_MODEL ?? 'MiniMax-Text-01';

  const systemPrompt = `You are a canvas UI generator. Given a natural language description, generate a structured canvas template.

Return ONLY valid JSON matching this schema:
{
  "name": "template name (max 50 chars)",
  "description": "brief description (max 200 chars)",
  "category": "ecommerce|education|healthcare|finance|social|enterprise|blog|portfolio|booking|saas",
  "tags": ["tag1", "tag2"],
  "components": [
    {
      "type": "header|hero|features|testimonials|pricing|cta|footer|navigation|grid|text|image|button|form|carousel",
      "props": { "title": "...", "subtitle": "...", "items": [...] },
      "children": [],
      "style": { "backgroundColor": "#ffffff", "padding": "24px" }
    }
  ]
}

Rules:
- Generate 4-8 components per template
- Use realistic placeholder content matching the template type
- Components form a coherent page structure
- Return ONLY the JSON, no markdown fences`;

  const response = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API error ${response.status}: ${text}`);
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';

  // Parse JSON from response (strip markdown fences if present)
  const jsonStr = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(jsonStr) as TemplateGenerationResult;
}
