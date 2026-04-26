/**
 * useCanvasImport — Canvas file import hook
 * E2-U2: File Import UI
 * E2-U4: Import History
 */
import { useCallback, useRef } from 'react';
import type { CanvasDocument } from '@/types/canvas-document';
import { deserializeCanvasFromJSON } from '@/lib/canvas/serialize';
import { logImport } from '@/services/canvas/ImportHistoryService';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ValidateFileResult {
  valid: boolean;
  error?: string;
  schemaVersion?: string;
}

/**
 * Compress string using pako (gzip) and return a Blob
 */
export function gzipCompress(str: string): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  return import('pako').then(({ default: pako }) => {
    const compressed = pako.deflate(str);
    return new Blob([compressed], { type: 'application/gzip' });
  });
}

/**
 * Decompress gzip Blob and return decompressed string
 */
export async function gunzipDecompress(blob: Blob): Promise<string> {
  const { default: pako } = await import('pako');
  const arrayBuffer = await blob.arrayBuffer();
  const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
  return decompressed;
}

export function useCanvasImport() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Validate a File before import
   */
  const validateFile = useCallback((file: File): ValidateFileResult => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过 10MB 限制` };
    }
    return { valid: true };
  }, []);

  /**
   * Show file picker and return selected File or null
   */
  const showFilePicker = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      // Reuse or create hidden file input
      let input = document.getElementById('canvas-import-file-input') as HTMLInputElement | null;
      if (!input) {
        input = document.createElement('input');
        input.id = 'canvas-import-file-input';
        input.type = 'file';
        input.accept = '.vibex,.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);
      }
      inputRef.current = input;

      function handleChange(this: HTMLInputElement) {
        const file = this.files?.[0] ?? null;
        resolve(file);
        // Reset so same file can be selected again
        this.value = '';
        this.removeEventListener('change', handleChange);
      }

      input.addEventListener('change', handleChange);
      input.click();
    });
  }, []);

  /**
   * Import a file, parse, and call onImport with parsed chapters
   * Before overwriting: always show window.confirm()
   */
  const importFile = useCallback(async (
    file: File,
    onImport: (chapters: CanvasDocument['chapters'], warnings: string[], rawDoc: CanvasDocument) => void
  ) => {
    // 1. Validate size
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Read content
    let content: string;
    const isGzip = file.name.endsWith('.vibex');
    try {
      if (isGzip) {
        content = await gunzipDecompress(file);
      } else {
        content = await file.text();
      }
    } catch {
      throw new Error('文件读取失败，请检查文件完整性');
    }

    // 3. Parse JSON
    let doc: CanvasDocument;
    try {
      doc = JSON.parse(content) as CanvasDocument;
    } catch {
      throw new Error('无效的 JSON 格式');
    }

    // 4. Validate required fields
    if (!doc.schemaVersion || !Array.isArray(doc.chapters)) {
      throw new Error('无效的画布文件格式：缺少 schemaVersion 或 chapters');
    }

    // 5. Deserialize with forward-compat
    const { chapters, warnings } = deserializeCanvasFromJSON(doc);

    // 6. Confirm before overwrite
    const confirmed = window.confirm(
      `导入将覆盖当前画布数据（${chapters.length} 个章节）\\n\\n点击"确定"继续导入，点击"取消"中止。`
    );
    if (!confirmed) {
      throw new Error('导入已取消');
    }

    // 7. Log to history
    logImport({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sourceFile: file.name,
      schemaVersion: doc.schemaVersion,
      chapterCount: chapters.length,
    });

    // 8. Call callback
    onImport(chapters, warnings, doc);
  }, [validateFile]);

  return {
    validateFile,
    importFile,
    showFilePicker,
  };
}