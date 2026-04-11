import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CanvasOnboardingOverlay } from '../CanvasOnboardingOverlay';
import { useGuidanceStore } from '@/stores/guidanceStore';

// =============================================================================
// Mock localStorage
// =============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// =============================================================================
// Mock useGuidanceStore
// =============================================================================

type GuidanceStore = {
  canvasOnboardingCompleted: boolean;
  canvasOnboardingDismissed: boolean;
  canvasOnboardingStep: number;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  completeCanvasOnboarding: () => void;
  dismissCanvasOnboarding: () => void;
  startCanvasOnboarding: () => void;
};

const initialState: GuidanceStore = {
  canvasOnboardingCompleted: false,
  canvasOnboardingDismissed: false,
  canvasOnboardingStep: 1,
  nextOnboardingStep: vi.fn(),
  prevOnboardingStep: vi.fn(),
  completeCanvasOnboarding: vi.fn(),
  dismissCanvasOnboarding: vi.fn(),
  startCanvasOnboarding: vi.fn(),
};

let storeState = { ...initialState };

function createMockStore(state: Partial<GuidanceStore> = {}) {
  storeState = { ...initialState, ...state };
  return storeState;
}

vi.mock('@/stores/guidanceStore', () => ({
  useGuidanceStore: vi.fn((selector?: (s: GuidanceStore) => unknown) => {
    if (selector) {
      return selector(storeState as GuidanceStore);
    }
    return storeState as GuidanceStore;
  }),
}));

// =============================================================================
// Helpers
// =============================================================================

function renderOverlay(state: Partial<GuidanceStore> = {}) {
  createMockStore(state);
  const utils = render(<CanvasOnboardingOverlay />);
  return { ...utils, store: storeState };
}

// =============================================================================
// Tests
// =============================================================================

describe('CanvasOnboardingOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    storeState = { ...initialState };
  });

  // ----- Edge cases: completed / dismissed -----

  it('不渲染 when completed=true', () => {
    const { container } = renderOverlay({ canvasOnboardingCompleted: true, canvasOnboardingStep: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it('不渲染 when dismissed=true', () => {
    const { container } = renderOverlay({ canvasOnboardingDismissed: true, canvasOnboardingStep: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it('不渲染 when currentStep=0 (not started)', () => {
    const { container } = renderOverlay({ canvasOnboardingStep: 0 });
    expect(container).toBeEmptyDOMElement();
  });

  // ----- Happy path: renders -----

  it('渲染 step 1 when all conditions met', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    expect(screen.getByText('三树结构')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('渲染 step 2 content', () => {
    renderOverlay({ canvasOnboardingStep: 2 });
    expect(screen.getByText('节点操作')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('渲染 step 3 content', () => {
    renderOverlay({ canvasOnboardingStep: 3 });
    expect(screen.getByText('快捷键加速')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  // ----- Navigation buttons -----

  it('点击 "下一步" 调用 nextOnboardingStep', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(storeState.nextOnboardingStep).toHaveBeenCalledTimes(1);
  });

  it('点击 "上一步" 调用 prevOnboardingStep', () => {
    renderOverlay({ canvasOnboardingStep: 2 });
    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    expect(storeState.prevOnboardingStep).toHaveBeenCalledTimes(1);
  });

  it('点击 "完成" 调用 completeCanvasOnboarding', () => {
    renderOverlay({ canvasOnboardingStep: 3 });
    fireEvent.click(screen.getByRole('button', { name: '完成引导' }));
    expect(storeState.completeCanvasOnboarding).toHaveBeenCalledTimes(1);
  });

  it('点击 "跳过" 调用 dismissCanvasOnboarding', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    // skipButton 在 footer 区域，通过 aria-label 精确匹配
    const buttons = screen.getAllByRole('button');
    const skipBtn = buttons.find((b) => b.getAttribute('aria-label') === '跳过引导' && b.textContent?.includes('跳过'));
    expect(skipBtn).toBeDefined();
    fireEvent.click(skipBtn!);
    expect(storeState.dismissCanvasOnboarding).toHaveBeenCalledTimes(1);
  });

  // ----- Step 3 shows "完成" instead of "下一步/跳过" -----

  it('step 3 不显示 "下一步" 和 "跳过" 按钮', () => {
    renderOverlay({ canvasOnboardingStep: 3 });
    expect(screen.queryByRole('button', { name: '下一步' })).not.toBeInTheDocument();
    // footer 中不再有"跳过"文字的按钮
    const buttons = screen.queryAllByRole('button');
    const skipBtns = buttons.filter((b) => b.textContent?.includes('跳过'));
    expect(skipBtns).toHaveLength(0);
    expect(screen.getByRole('button', { name: '完成引导' })).toBeInTheDocument();
  });

  // ----- Keyboard navigation -----

  it('ESC 键调用 dismissCanvasOnboarding', async () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(storeState.dismissCanvasOnboarding).toHaveBeenCalledTimes(1);
  });

  it('ArrowRight 键调用 nextOnboardingStep', async () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    expect(storeState.nextOnboardingStep).toHaveBeenCalledTimes(1);
  });

  it('Enter 键调用 nextOnboardingStep', async () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
    expect(storeState.nextOnboardingStep).toHaveBeenCalledTimes(1);
  });

  it('ArrowLeft 键调用 prevOnboardingStep', async () => {
    renderOverlay({ canvasOnboardingStep: 2 });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    expect(storeState.prevOnboardingStep).toHaveBeenCalledTimes(1);
  });

  // ----- Rapid clicks: no crash -----

  it('快速点击 Skip 5 次不崩溃', async () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    const buttons = screen.getAllByRole('button');
    const skipBtn = buttons.find((b) => b.getAttribute('aria-label') === '跳过引导' && b.textContent?.includes('跳过'));
    expect(skipBtn).toBeDefined();
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        fireEvent.click(skipBtn!);
      });
    }
    expect(storeState.dismissCanvasOnboarding).toHaveBeenCalledTimes(5);
  });

  // ----- localStorage: no setItem in handlers -----

  it('handleDismiss 不调用 localStorage.setItem', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const buttons = screen.getAllByRole('button');
    const skipBtn = buttons.find((b) => b.getAttribute('aria-label') === '跳过引导' && b.textContent?.includes('跳过'));
    fireEvent.click(skipBtn!);
    // handleDismiss 不再写 localStorage（store persist 已覆盖）
    expect(setItemSpy).not.toHaveBeenCalledWith('vibex-canvas-onboarded', 'true');
  });

  it('handleComplete 不调用 localStorage.setItem', () => {
    renderOverlay({ canvasOnboardingStep: 3 });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    fireEvent.click(screen.getByRole('button', { name: '完成引导' }));
    expect(setItemSpy).not.toHaveBeenCalledWith('vibex-canvas-onboarded', 'true');
  });

  // ----- Accessibility -----

  it('has correct aria-label on close button', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    // X close button exists with aria-label="跳过引导"
    const closeBtn = screen.getByTitle('跳过引导');
    expect(closeBtn).toBeInTheDocument();
  });

  it('has role="dialog" on overlay', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('progress bar has correct aria-valuenow', () => {
    renderOverlay({ canvasOnboardingStep: 2 });
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
  });

  // ----- Close button (X) -----

  it('点击 X 按钮调用 dismissCanvasOnboarding', () => {
    renderOverlay({ canvasOnboardingStep: 1 });
    const closeBtn = screen.getByTitle('跳过引导');
    fireEvent.click(closeBtn);
    expect(storeState.dismissCanvasOnboarding).toHaveBeenCalledTimes(1);
  });
});
