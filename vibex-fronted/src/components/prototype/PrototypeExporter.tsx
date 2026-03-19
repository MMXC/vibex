import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UISchema, UIPage } from '../../services/api';
import styles from './PrototypeExporter.module.css';

export interface PrototypeExporterProps {
  snapshot?: {
    version?: number;
    uiSchema?: UISchema;
    createdAt?: string;
  };
  uiSchema?: UISchema;
  version?: number;
  onExportSuccess?: (data: ExportResult) => void;
  onExportError?: (error: Error) => void;
  disabled?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  timestamp: Date;
}

export type ExportFormat = 'json' | 'png' | 'pdf';

// Types for dynamic page/section/component rendering
export interface RenderableSection {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  style?: Record<string, unknown>;
  title?: string;
  components?: RenderableComponent[];
}

export interface RenderableComponent {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  style?: Record<string, unknown>;
  type?: string;
  content?: string;
}

const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: 'json', label: 'JSON', icon: '{ }' },
  { value: 'png', label: 'PNG 图片', icon: '🖼️' },
  { value: 'pdf', label: 'PDF 文档', icon: '📄' },
];

export function PrototypeExporter({
  snapshot,
  uiSchema,
  version,
  onExportSuccess,
  onExportError,
  disabled = false,
}: PrototypeExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get schema and version from props
  const schema = uiSchema || snapshot?.uiSchema;
  const currentVersion = version ?? snapshot?.version ?? 1;
  const createdAt = snapshot?.createdAt || new Date().toISOString();

  const generateFilename = (format: ExportFormat): string => {
    const dateStr = new Date().toISOString().slice(0, 10);
    return `prototype-v${currentVersion}-${dateStr}.${format}`;
  };

  const exportAsJson = async (): Promise<void> => {
    try {
      const data = JSON.stringify(schema, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      downloadBlob(blob, generateFilename('json'));

      const result: ExportResult = {
        format: 'json',
        filename: generateFilename('json'),
        timestamp: new Date(),
      };
      onExportSuccess?.(result);
    } catch (error) {
      onExportError?.(error as Error);
    }
  };

  const exportAsPng = async (): Promise<void> => {
    try {
      setIsExporting(true);

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      // Set default canvas size
      const width = 1920;
      const height = 1080;
      const theme = schema?.theme;
      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = theme?.colors?.background || '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw UI schema pages
      renderUISchema(ctx, schema, width, height);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, generateFilename('png'));
          const result: ExportResult = {
            format: 'png',
            filename: generateFilename('png'),
            timestamp: new Date(),
          };
          onExportSuccess?.(result);
        }
      }, 'image/png');

      setShowFormatModal(false);
    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPdf = async (): Promise<void> => {
    try {
      setIsExporting(true);

      // For PDF export, use the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('无法打开打印窗口');

      const htmlContent = generatePdfHtml(schema, currentVersion, createdAt);
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
      };

      const result: ExportResult = {
        format: 'pdf',
        filename: generateFilename('pdf'),
        timestamp: new Date(),
      };
      onExportSuccess?.(result);
      setShowFormatModal(false);
    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderUISchema = (
    ctx: CanvasRenderingContext2D,
    uiSchema: UISchema | undefined,
    width: number,
    height: number
  ): void => {
    if (!uiSchema) return;

    // Render background
    if (uiSchema.theme?.colors?.background) {
      ctx.fillStyle = uiSchema.theme.colors.background;
      ctx.fillRect(0, 0, width, height);
    }

    // Render pages
    const pages = uiSchema.pages || [];
    for (let i = 0; i < pages.length; i++) {
      renderPage(ctx, pages[i], width, height, i === 0);
    }
  };

  const renderPage = (
    ctx: CanvasRenderingContext2D,
    page: UIPage,
    containerWidth: number,
    containerHeight: number,
    isFirstPage: boolean
  ): void => {
    if (!isFirstPage) {
      // Add new page for subsequent pages
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, containerWidth, containerHeight);
    }

    // Page title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(page.name || 'Untitled Page', 20, 40);

    // Page route
    ctx.fillStyle = '#666666';
    ctx.font = '14px sans-serif';
    ctx.fillText(page.route || '', 20, 65);

    // Render sections if available (for backward compatibility)
    const pageAny = page as unknown as { sections?: RenderableSection[] };
    if (pageAny.sections) {
      for (const section of pageAny.sections) {
        renderSection(ctx, section, containerWidth, containerHeight);
      }
    }
  };

  const renderSection = (
    ctx: CanvasRenderingContext2D,
    section: RenderableSection,
    containerWidth: number,
    containerHeight: number
  ): void => {
    const x = (section.position?.x || 0) * containerWidth;
    const y = (section.position?.y || 0) * containerHeight;
    const w = (section.size?.width || 200) * containerWidth;
    const h = (section.size?.height || 100) * containerHeight;

    // Draw section background
    ctx.fillStyle = (section.style?.background as string) || '#f5f5f5';
    ctx.fillRect(x, y, w, h);

    // Draw section border
    if (section.style?.border) {
      ctx.strokeStyle = section.style.border as string;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }

    // Draw section title if exists
    if (section.title) {
      ctx.fillStyle = (section.style?.color as string) || '#333333';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(String(section.title), x + 10, y + 25);
    }

    // Render components within section
    if (section.components) {
      for (const component of section.components) {
        renderComponent(ctx, component, x, y, w, h);
      }
    }
  };

  const renderComponent = (
    ctx: CanvasRenderingContext2D,
    component: RenderableComponent,
    sectionX: number,
    sectionY: number,
    sectionW: number,
    sectionH: number
  ): void => {
    const x = sectionX + (component.position?.x || 0) * sectionW;
    const y = sectionY + (component.position?.y || 0) * sectionH;
    const w = (component.size?.width || 100) * sectionW;
    const h = (component.size?.height || 30) * sectionH;

    switch (component.type) {
      case 'text':
        ctx.fillStyle = (component.style?.color as string) || '#333333';
        ctx.font = `${component.style?.fontWeight || 'normal'} ${component.style?.fontSize || 14}px sans-serif`;
        ctx.fillText(String(component.content || ''), x + 5, y + h / 2 + 5);
        break;

      case 'button':
        ctx.fillStyle = (component.style?.background as string) || '#007bff';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = (component.style?.color as string) || '#ffffff';
        ctx.font = '14px sans-serif';
        const btnText = String(component.content || 'Button');
        const btnTextWidth = ctx.measureText(btnText).width;
        ctx.fillText(btnText, x + (w - btnTextWidth) / 2, y + h / 2 + 5);
        break;

      case 'input':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#999999';
        ctx.font = '12px sans-serif';
        ctx.fillText(
          String(component.placeholder || 'Input...'),
          x + 5,
          y + h / 2 + 4
        );
        break;

      case 'image':
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#999999';
        ctx.font = '12px sans-serif';
        ctx.fillText('[Image]', x + 5, y + h / 2 + 4);
        break;

      case 'form':
      case 'table':
      case 'list':
      case 'card':
      case 'navigation':
        ctx.fillStyle = '#e8f4f8';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#007bff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(
          `[${String(component.type).toUpperCase()}]`,
          x + 5,
          y + h / 2 + 4
        );
        break;

      default:
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, w, h);
    }
  };

  const generatePdfHtml = (
    uiSchema: UISchema | undefined,
    version: number,
    createdAt: string
  ): string => {
    if (!uiSchema) {
      return '<html><body><p>No schema data available</p></body></html>';
    }

    const pages = uiSchema.pages || [];
    const theme = uiSchema.theme;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prototype v${version}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            color: #333;
          }
          .header { 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
          }
          .version { color: #666; font-size: 14px; }
          .page { 
            margin-bottom: 30px; 
            padding: 20px; 
            border: 1px solid #ddd; 
            page-break-after: always;
          }
          .page-title { 
            font-weight: bold; 
            font-size: 18px; 
            margin-bottom: 10px;
            color: #007bff;
          }
          .page-route { 
            color: #666; 
            font-size: 12px; 
            margin-bottom: 15px;
            font-family: monospace;
          }
          .component { 
            margin: 8px 0; 
            padding: 8px; 
            background: #f9f9f9;
            border-left: 3px solid #007bff;
          }
          .component-type {
            font-weight: bold;
            color: #333;
            font-size: 12px;
            text-transform: uppercase;
          }
          .component-content {
            color: #666;
            margin-top: 4px;
          }
          .theme-info {
            background: #f0f0f0;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎨 VibeX Prototype Export</h1>
          <p class="version">Version: ${version}</p>
          <p class="version">Created: ${createdAt}</p>
          ${
            theme
              ? `
            <div class="theme-info">
              Background: ${theme.colors?.background || '#ffffff'} |
              Primary: ${theme.colors?.primary || '#007bff'} |
              Secondary: ${theme.colors?.secondary || '#6c757d'}
            </div>
          `
              : ''
          }
        </div>
        ${
          pages.length > 0
            ? pages
                .map(
                  (page: UIPage) => `
          <div class="page">
            <div class="page-title">${page.name || 'Untitled Page'}</div>
            <div class="page-route">${page.route || '/'}</div>
            ${(((page as unknown as { components?: RenderableComponent[] }).components) || [])
              .map(
                (comp) => `
              <div class="component">
                <div class="component-type">${comp.type}</div>
                <div class="component-content">${comp.content || comp.placeholder || comp.label || '(no content)'}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
                )
                .join('')
            : '<p style="color: #999;">No pages defined in this prototype.</p>'
        }
      </body>
      </html>
    `;
  };

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (): Promise<void> => {
    if (!schema) {
      onExportError?.(new Error('没有可导出的原型数据'));
      return;
    }

    setIsExporting(true);
    try {
      switch (selectedFormat) {
        case 'json':
          await exportAsJson();
          break;
        case 'png':
          await exportAsPng();
          break;
        case 'pdf':
          await exportAsPdf();
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFormatSelect = (format: ExportFormat): void => {
    setSelectedFormat(format);
    setShowMenu(false);
    setShowFormatModal(true);
  };

  return (
    <div className={styles.exporter} ref={menuRef}>
      <div className={styles.dropdownWrapper}>
        <Button
          variant="primary"
          size="md"
          disabled={disabled || isExporting || !schema}
          icon={<span>📤</span>}
          iconPosition="left"
          onClick={() => setShowMenu(!showMenu)}
        >
          {isExporting ? '导出中...' : '导出原型'}
        </Button>

        {showMenu && (
          <div className={styles.dropdownMenu}>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.value}
                className={styles.dropdownItem}
                onClick={() => handleFormatSelect(format.value)}
              >
                <span className={styles.formatIcon}>{format.icon}</span>
                {format.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title="确认导出"
        width={400}
      >
        <div className={styles.modalContent}>
          <p>
            确定要导出为{' '}
            <strong>
              {EXPORT_FORMATS.find((f) => f.value === selectedFormat)?.label}
            </strong>{' '}
            格式吗？
          </p>
          <p className={styles.fileInfo}>
            文件名: <code>{generateFilename(selectedFormat)}</code>
          </p>
          <div className={styles.modalActions}>
            <Button
              variant="ghost"
              onClick={() => setShowFormatModal(false)}
              disabled={isExporting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              loading={isExporting}
            >
              确认导出
            </Button>
          </div>
        </div>
      </Modal>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default PrototypeExporter;
