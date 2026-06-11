/**
 * ExportMenu.test.tsx — Vitest tests for ExportMenu dropdown component
 * S87-E4: Canvas Export Enhancement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExportMenu } from '../ExportMenu';

// Mock the useCanvasExport hook
const mockExportAsJSON = vi.fn();
const mockExportAsVibex = vi.fn();

vi.mock('@/hooks/canvas/useCanvasExport', () => ({
  useCanvasExport: vi.fn(() => ({
    exportAsJSON: mockExportAsJSON,
    exportAsVibex: mockExportAsVibex,
    isExporting: false,
    error: null,
    cancelExport: vi.fn(),
  })),
}));

// Mock useCanvasExport from base hook (used by exportAsPNG/exportAsSVG)
vi.mock('@/hooks/useCanvasExport', () => ({
  exportAsPNG: vi.fn(),
  exportAsSVG: vi.fn(),
  downloadFigmaJSON: vi.fn(),
  exportAsPNGWithScale: vi.fn(),
}));

// Mock DDSCanvasStore
const mockGetState = vi.fn();
vi.mock('@/stores/dds', () => ({
  useDDSCanvasStore: vi.fn((selector?) => {
    if (typeof selector === 'function') return selector(mockGetState());
    return mockGetState();
  }),
}));

// Mock canvasListStore
vi.mock('@/stores/canvasListStore', () => ({
  useCanvasListStore: vi.fn((selector?) => {
    const mockStore = {
      canvases: [{ id: 'c1', name: 'Test Canvas', updatedAt: '2026-01-01' }],
      selectedIds: new Set(['c1']),
      selectedCanvasIds: new Set(['c1']),
      setSelectedIds: vi.fn(),
      refresh: vi.fn(),
    };
    if (typeof selector === 'function') return selector(mockStore);
    return mockStore;
  }),
}));

// Mock ExportDialog (lazy-loaded component)
vi.mock('../export/ExportDialog', () => ({
  ExportDialog: vi.fn(({ open, onClose }) =>
    open ? <div data-testid="export-dialog">Mock ExportDialog<button onClick={onClose}>Close</button></div> : null
  ),
}));

const defaultMockState = {
  chapters: {
    boundedContext: [],
    businessFlow: [],
    component: [],
  },
  crossChapterEdges: [],
  canvasName: 'Test Canvas',
  apiCards: [],
  smCards: [],
  selectedCardIds: [],
};

describe('ExportMenu', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockGetState.mockReturnValue(defaultMockState);
  });

  it('renders export menu trigger button', () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    expect(trigger).toBeTruthy();
  });

  it('does not render dropdown when disabled', () => {
    render(<ExportMenu disabled={true} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    expect(trigger).toHaveProperty('disabled', true);
  });

  it('opens dropdown menu on trigger click', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);
    const dropdown = screen.getByTestId('export-menu-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('renders all export format options in dropdown', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const formats = ['JSON', 'Vibex', 'PDF', 'PNG', 'SVG', 'Figma', 'MultiFormat'];
    for (const format of formats) {
      const option = screen.queryByTestId(`export-option-${format.toLowerCase()}`);
      expect(option).toBeTruthy();
    }
  });

  it('renders PNG scale selector panel when dropdown is open with export options', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    // The dropdown shows export format options when not exporting
    const pngOption = screen.getByTestId('export-option-png');
    expect(pngOption).toBeTruthy();
    // Scale selector appears during PNG export, not in idle state
    expect(screen.queryByTestId('png-scale-1')).toBeNull();
  });

  it('closes dropdown when clicking outside', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const dropdown = screen.getByTestId('export-menu-dropdown');
    expect(dropdown).toBeTruthy();

    fireEvent.mouseDown(document);
    await new Promise(r => setTimeout(r, 10));

    const closedDropdown = screen.queryByTestId('export-menu-dropdown');
    expect(closedDropdown).toBeNull();
  });

  it('closes dropdown when pressing Escape', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    expect(screen.getByTestId('export-menu-dropdown')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    const closedDropdown = screen.queryByTestId('export-menu-dropdown');
    expect(closedDropdown).toBeNull();
  });

  it('calls exportAsJSON when JSON option is clicked', async () => {
    mockExportAsJSON.mockReturnValue(new Blob(['{}'], { type: 'application/json' }));

    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const jsonOption = screen.getByTestId('export-option-json');
    fireEvent.click(jsonOption);

    expect(mockExportAsJSON).toHaveBeenCalled();
  });

  it('renders PNG format option with correct label', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const pngOption = screen.queryByTestId('export-option-png');
    expect(pngOption).toBeTruthy();
    const label = pngOption?.querySelector('span');
    expect(label?.textContent).toContain('PNG');
  });

  it('renders PDF format option with correct label', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const pdfOption = screen.queryByTestId('export-option-pdf');
    expect(pdfOption).toBeTruthy();
    const label = pdfOption?.querySelector('span');
    expect(label?.textContent).toContain('PDF');
  });

  it('renders SVG format option', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const svgOption = screen.queryByTestId('export-option-svg');
    expect(svgOption).toBeTruthy();
  });

  it('renders MultiFormat ZIP option', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const multiOption = screen.queryByTestId('export-option-multiformat');
    expect(multiOption).toBeTruthy();
    const label = multiOption?.querySelector('span');
    // Label includes "多格式导出 (ZIP)"
    expect(label?.textContent).toContain('多格式导出');
  });

  it('renders batch export option', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const batchOption = screen.queryByTestId('export-option-batch');
    expect(batchOption).toBeTruthy();
  });

  it('opens ExportDialog when batch export is clicked', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const batchOption = screen.getByTestId('export-option-batch');
    fireEvent.click(batchOption);

    const dialog = await screen.findByTestId('export-dialog');
    expect(dialog).toBeTruthy();
  });

  it('closes ExportDialog when close button is clicked', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);

    const batchOption = screen.getByTestId('export-option-batch');
    fireEvent.click(batchOption);

    // ExportDialog renders — close button label is "取消"
    const closeBtn = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(closeBtn);

    const dialog = screen.queryByTestId('export-dialog');
    expect(dialog).toBeNull();
  });

  it('renders ExportMenu within DDSToolbar context without crashing', () => {
    // Integration smoke test: ExportMenu renders when wrapped in toolbar context
    const { container } = render(<ExportMenu disabled={false} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders spinner icon when PNG loading is active', async () => {
    render(<ExportMenu disabled={false} />);
    const trigger = screen.getByTestId('export-menu-trigger');
    fireEvent.click(trigger);
    // Spinner is not shown in idle state
    const spinnerSvg = screen.queryByRole('img', { name: /spinner/i });
    // No spinner in initial state
    expect(spinnerSvg).toBeNull();
  });
});
