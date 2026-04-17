/**
 * image-ai-import.ts — AI Image Import Service
 * Sprint6 E1-U1: Image AI 解析
 *
 * Analyzes UI screenshots using AI vision and extracts structured component data.
 * Reuses the AI vision pipeline (same /api/chat endpoint as AIDraftDrawer).
 */

'use client';

// ==================== Types ====================

export interface ImportedComponent {
  /** Component type (e.g. 'button', 'input', 'card', 'nav') */
  type: string;
  /** Component props/attributes */
  props: Record<string, unknown>;
  /** Display label */
  name: string;
  /** Optional layout hints */
  layout?: {
    /** Relative x position (0-1) */
    x?: number;
    /** Relative y position (0-1) */
    y?: number;
    /** Relative width (0-1) */
    width?: number;
    /** Relative height (0-1) */
    height?: number;
  };
}

export interface ImageImportResult {
  success: boolean;
  /** Extracted components from the image */
  components?: ImportedComponent[];
  /** Error message if success=false */
  error?: string;
}

// ==================== Helpers ====================

/**
 * Convert a File to a base64 data URL.
 * Used to embed images in AI vision prompts.
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Prompt sent to AI for UI component analysis */
const IMAGE_ANALYSIS_PROMPT = `You are an expert UI/UX analyst. Analyze this screenshot and extract all UI components as a structured JSON array.

Return ONLY a JSON object with this exact format (no markdown, no explanation):
{
  "components": [
    {
      "type": "button|input|text|image|card|nav|header|footer|form|list|icon|divider|other",
      "name": "Display name",
      "props": { "label": "text", "variant": "primary", "disabled": false },
      "layout": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.05 }
    }
  ]
}

Rules:
- Set x, y, width, height as decimals (0-1) relative to the image
- Props should capture key visual attributes (label, placeholder, src, etc.)
- Include all visible interactive and informational components
- type must be one of: button, input, text, image, card, nav, header, footer, form, list, icon, divider, other`;

// ==================== Main Function ====================

/**
 * Import UI components from an image using AI vision analysis.
 *
 * @param file - The image file (PNG, JPG, WebP, etc.) up to 10MB
 * @returns ImageImportResult with extracted components or error message
 *
 * @example
 * const result = await importFromImage(fileInput.files[0]);
 * if (result.success) {
 *   result.components.forEach(c => addNode(c.type, c.name));
 * }
 */
export async function importFromImage(file: File): Promise<ImageImportResult> {
  // ---- File size validation ----
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: `图片过大，请选择小于 10MB 的图片（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）` };
  }

  try {
    // ---- Convert image to base64 ----
    const base64DataUrl = await fileToBase64(file);

    // ---- Call AI vision API ----
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: IMAGE_ANALYSIS_PROMPT },
              { type: 'image_url', image_url: { url: base64DataUrl } },
            ],
          },
        ],
        model: 'gpt-4o',
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return { success: false, error: `AI 请求失败: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    const content = data.message?.content ?? '';

    // ---- Parse JSON from AI response ----
    try {
      // Try direct JSON parse first
      const parsed = JSON.parse(content);
      return {
        success: true,
        components: (parsed.components ?? []) as ImportedComponent[],
      };
    } catch {
      // Fallback: extract JSON block from markdown
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*?\})/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] ?? jsonMatch[2];
        const parsed = JSON.parse(jsonStr);
        return {
          success: true,
          components: (parsed.components ?? []) as ImportedComponent[],
        };
      }
      return {
        success: false,
        error: 'AI 返回格式解析失败，请重试',
      };
    }
  } catch (err) {
    console.error('[importFromImage] Error:', err);
    return { success: false, error: '图片分析失败，请重试' };
  }
}
