# E1 Spec: useCanvasState

## 接口设计

```typescript
// src/hooks/canvas/useCanvasState.ts
interface UseCanvasStateReturn {
  // State
  zoomLevel: number;
  isSpacePressed: boolean;
  isPanning: boolean;
  panOffset: { x: number; y: number };
  gridRef: React.RefObject<HTMLDivElement | null>;
  expandMode: 'normal' | 'expand-both' | 'maximize';

  // Setters
  setZoomLevel: (level: number) => void;
  setExpandMode: (mode: 'normal' | 'expand-both' | 'maximize') => void;

  // Handlers
  handlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomReset: () => void;
    toggleMaximize: () => void;
  };
}
```

## 实现要点

### Space key listener
```typescript
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isSpacePressed) {
      setIsSpacePressed(true);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') setIsSpacePressed(false);
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return () => { window.removeEventListener... };
}, []);
```

### CSS Variables
```typescript
useEffect(() => {
  if (gridRef.current) {
    gridRef.current.style.setProperty('--canvas-zoom', String(zoomLevel));
    gridRef.current.style.setProperty('--canvas-pan-x', String(panOffset.x));
    gridRef.current.style.setProperty('--canvas-pan-y', String(panOffset.y));
  }
}, [zoomLevel, panOffset]);
```
