/**
 * JSON Extractor with Markdown Fallback
 * E3-S2: Robust JSON extraction from LLM responses
 */

/**
 * Extract JSON from a string that may be wrapped in markdown code blocks.
 * Tries multiple strategies in order of likelihood.
 */
export function extractJSON(response: string): object | null {
  const trimmed = response.trim();

  // Strategy 1: Direct parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Strategy 2: Markdown code block (```json ... ```)
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Strategy 3: Any markdown code block
  const anyMatch = trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (anyMatch) {
    try {
      return JSON.parse(anyMatch[1].trim());
    } catch {}
  }

  // Strategy 4: Find first { ... } or [ ... ] block
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  const arrMatch = trimmed.match(/\[[\s\S]*\]/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {}
  }

  return null;
}
