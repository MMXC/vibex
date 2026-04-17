/**
 * Image Import Service
 * E4-U1: 图片上传 → AI 识别 → 组件列表
 */

import type { UIComponent } from '@/lib/prototypes/ui-schema';

export interface ImageImportResult {
  success: boolean;
  components?: ImportedComponent[];
  error?: string;
}

export interface ImportedComponent {
  type: string;
  props: Record<string, unknown>;
  name: string;
  style?: Record<string, string | number>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Import UI components from an image using AI vision.
 * Reuses the same /api/chat endpoint as AIDraftDrawer.
 */
export async function importFromImage(file: File): Promise<ImageImportResult> {
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: '图片过大，请选择小于 10MB 的图片' };
  }

  try {
    const base64 = await fileToBase64(file);
    const authHeaders = getAuthHeaders();

    const response = await fetch('/api/chat', {
      signal: AbortSignal.timeout(30_000),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `分析这张图片中的 UI 组件结构，返回 JSON 格式的组件列表。必须返回以下格式（不要返回其他内容）:
{
  "components": [
    {
      "type": "button|text|image|container|...",
      "name": "组件名称",
      "props": { /* 组件属性 */ },
      "style": { "width": 100, "height": 40, "backgroundColor": "#ffffff" }
    }
  ]
}
只返回 JSON，不要解释。`,
            image: base64,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `识别失败 (${response.status})，请重试` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON from AI response
    try {
      // Try to extract JSON block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
      const jsonStr = jsonMatch[1] ?? content;
      const parsed = JSON.parse(jsonStr.trim());

      if (!parsed.components || !Array.isArray(parsed.components)) {
        return { success: false, error: 'AI 返回格式错误' };
      }

      return { success: true, components: parsed.components as ImportedComponent[] };
    } catch {
      return { success: false, error: 'AI 返回格式解析失败' };
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: '请求超时，请重试' };
    }
    return { success: false, error: '识别失败，请重试' };
  }
}
