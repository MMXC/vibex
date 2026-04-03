/**
 * VibeX UI Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 2 slice extraction.
 *
 * Responsibilities:
 * - Panel collapse state (context/flow/component)
 * - Expand/m maximize mode
 * - Drag state
 * - Left/right drawer state
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
export type PanelExpandState = 'default' | 'expand-left' | 'expand-right';
export type CanvasExpandMode = 'normal' | 'expand-both' | 'maximize';
interface UIStore {
  // Panel collapse
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
  toggleContextPanel: () => void;
  toggleFlowPanel: () => void;
  toggleComponentPanel: () => void;

  // Expand state
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  getGridTemplate: () => string;
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  resetExpand: () => void;

  // Expand mode (F1)
  expandMode: CanvasExpandMode;
  setExpandMode: (mode: CanvasExpandMode) => void;
  toggleMaximize: () => void;

  // Drag state
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
  draggedPositions: Record<string, {
    x: number;
    y: number;
  }>;
  isDragging: boolean;
  startDrag: (nodeId: string) => void;
  endDrag: (nodeId: string, position: {
    x: number;
    y: number;
  }) => void;
  setDragOver: (nodeId: string | null) => void;
  updateDraggedPosition: (nodeId: string, position: {
    x: number;
    y: number;
  }) => void;
  clearDragPositions: () => void;
  clearDragPosition: (nodeId: string) => void;

  // Left/Right Drawer
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  leftDrawerWidth: number;
  rightDrawerWidth: number;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  openRightDrawer: () => void;
  submitCanvas: () => void;
  setLeftDrawerWidth: (width: number) => void;
  setRightDrawerWidth: (width: number) => void;
}
export const useUIStore = create<UIStore>()(devtools(persist(stryMutAct_9fa48("842") ? () => undefined : (stryCov_9fa48("842"), (set, get) => stryMutAct_9fa48("843") ? {} : (stryCov_9fa48("843"), {
  // Panel collapse
  contextPanelCollapsed: stryMutAct_9fa48("844") ? true : (stryCov_9fa48("844"), false),
  flowPanelCollapsed: stryMutAct_9fa48("845") ? true : (stryCov_9fa48("845"), false),
  componentPanelCollapsed: stryMutAct_9fa48("846") ? true : (stryCov_9fa48("846"), false),
  toggleContextPanel: stryMutAct_9fa48("847") ? () => undefined : (stryCov_9fa48("847"), () => set(stryMutAct_9fa48("848") ? () => undefined : (stryCov_9fa48("848"), s => stryMutAct_9fa48("849") ? {} : (stryCov_9fa48("849"), {
    contextPanelCollapsed: stryMutAct_9fa48("850") ? s.contextPanelCollapsed : (stryCov_9fa48("850"), !s.contextPanelCollapsed)
  })))),
  toggleFlowPanel: stryMutAct_9fa48("851") ? () => undefined : (stryCov_9fa48("851"), () => set(stryMutAct_9fa48("852") ? () => undefined : (stryCov_9fa48("852"), s => stryMutAct_9fa48("853") ? {} : (stryCov_9fa48("853"), {
    flowPanelCollapsed: stryMutAct_9fa48("854") ? s.flowPanelCollapsed : (stryCov_9fa48("854"), !s.flowPanelCollapsed)
  })))),
  toggleComponentPanel: stryMutAct_9fa48("855") ? () => undefined : (stryCov_9fa48("855"), () => set(stryMutAct_9fa48("856") ? () => undefined : (stryCov_9fa48("856"), s => stryMutAct_9fa48("857") ? {} : (stryCov_9fa48("857"), {
    componentPanelCollapsed: stryMutAct_9fa48("858") ? s.componentPanelCollapsed : (stryCov_9fa48("858"), !s.componentPanelCollapsed)
  })))),
  // Expand state
  leftExpand: stryMutAct_9fa48("859") ? "" : (stryCov_9fa48("859"), 'default'),
  centerExpand: stryMutAct_9fa48("860") ? "" : (stryCov_9fa48("860"), 'default'),
  rightExpand: stryMutAct_9fa48("861") ? "" : (stryCov_9fa48("861"), 'default'),
  getGridTemplate: stryMutAct_9fa48("862") ? () => undefined : (stryCov_9fa48("862"), () => stryMutAct_9fa48("863") ? "" : (stryCov_9fa48("863"), '1fr 1fr 1fr')),
  setLeftExpand: stryMutAct_9fa48("864") ? () => undefined : (stryCov_9fa48("864"), state => set(stryMutAct_9fa48("865") ? {} : (stryCov_9fa48("865"), {
    leftExpand: state
  }))),
  setCenterExpand: stryMutAct_9fa48("866") ? () => undefined : (stryCov_9fa48("866"), state => set(stryMutAct_9fa48("867") ? {} : (stryCov_9fa48("867"), {
    centerExpand: state
  }))),
  setRightExpand: stryMutAct_9fa48("868") ? () => undefined : (stryCov_9fa48("868"), state => set(stryMutAct_9fa48("869") ? {} : (stryCov_9fa48("869"), {
    rightExpand: state
  }))),
  togglePanel: panel => {
    if (stryMutAct_9fa48("870")) {
      {}
    } else {
      stryCov_9fa48("870");
      if (stryMutAct_9fa48("873") ? panel !== 'left' : stryMutAct_9fa48("872") ? false : stryMutAct_9fa48("871") ? true : (stryCov_9fa48("871", "872", "873"), panel === (stryMutAct_9fa48("874") ? "" : (stryCov_9fa48("874"), 'left')))) {
        if (stryMutAct_9fa48("875")) {
          {}
        } else {
          stryCov_9fa48("875");
          const {
            leftExpand
          } = get();
          const next = (stryMutAct_9fa48("878") ? leftExpand !== 'default' : stryMutAct_9fa48("877") ? false : stryMutAct_9fa48("876") ? true : (stryCov_9fa48("876", "877", "878"), leftExpand === (stryMutAct_9fa48("879") ? "" : (stryCov_9fa48("879"), 'default')))) ? stryMutAct_9fa48("880") ? "" : (stryCov_9fa48("880"), 'expand-right') : (stryMutAct_9fa48("883") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("882") ? false : stryMutAct_9fa48("881") ? true : (stryCov_9fa48("881", "882", "883"), leftExpand === (stryMutAct_9fa48("884") ? "" : (stryCov_9fa48("884"), 'expand-right')))) ? stryMutAct_9fa48("885") ? "" : (stryCov_9fa48("885"), 'default') : leftExpand;
          set(stryMutAct_9fa48("886") ? {} : (stryCov_9fa48("886"), {
            leftExpand: next as PanelExpandState
          }));
        }
      } else if (stryMutAct_9fa48("889") ? panel !== 'center' : stryMutAct_9fa48("888") ? false : stryMutAct_9fa48("887") ? true : (stryCov_9fa48("887", "888", "889"), panel === (stryMutAct_9fa48("890") ? "" : (stryCov_9fa48("890"), 'center')))) {
        if (stryMutAct_9fa48("891")) {
          {}
        } else {
          stryCov_9fa48("891");
          const {
            centerExpand
          } = get();
          const next = (stryMutAct_9fa48("894") ? centerExpand !== 'default' : stryMutAct_9fa48("893") ? false : stryMutAct_9fa48("892") ? true : (stryCov_9fa48("892", "893", "894"), centerExpand === (stryMutAct_9fa48("895") ? "" : (stryCov_9fa48("895"), 'default')))) ? stryMutAct_9fa48("896") ? "" : (stryCov_9fa48("896"), 'expand-left') : (stryMutAct_9fa48("899") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("898") ? false : stryMutAct_9fa48("897") ? true : (stryCov_9fa48("897", "898", "899"), centerExpand === (stryMutAct_9fa48("900") ? "" : (stryCov_9fa48("900"), 'expand-left')))) ? stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), 'expand-right') : (stryMutAct_9fa48("904") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("903") ? false : stryMutAct_9fa48("902") ? true : (stryCov_9fa48("902", "903", "904"), centerExpand === (stryMutAct_9fa48("905") ? "" : (stryCov_9fa48("905"), 'expand-right')))) ? stryMutAct_9fa48("906") ? "" : (stryCov_9fa48("906"), 'default') : stryMutAct_9fa48("907") ? "" : (stryCov_9fa48("907"), 'default');
          set(stryMutAct_9fa48("908") ? {} : (stryCov_9fa48("908"), {
            centerExpand: next as PanelExpandState
          }));
        }
      } else {
        if (stryMutAct_9fa48("909")) {
          {}
        } else {
          stryCov_9fa48("909");
          const {
            rightExpand
          } = get();
          const next = (stryMutAct_9fa48("912") ? rightExpand !== 'default' : stryMutAct_9fa48("911") ? false : stryMutAct_9fa48("910") ? true : (stryCov_9fa48("910", "911", "912"), rightExpand === (stryMutAct_9fa48("913") ? "" : (stryCov_9fa48("913"), 'default')))) ? stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), 'expand-left') : (stryMutAct_9fa48("917") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("916") ? false : stryMutAct_9fa48("915") ? true : (stryCov_9fa48("915", "916", "917"), rightExpand === (stryMutAct_9fa48("918") ? "" : (stryCov_9fa48("918"), 'expand-left')))) ? stryMutAct_9fa48("919") ? "" : (stryCov_9fa48("919"), 'default') : rightExpand;
          set(stryMutAct_9fa48("920") ? {} : (stryCov_9fa48("920"), {
            rightExpand: next as PanelExpandState
          }));
        }
      }
    }
  },
  resetExpand: stryMutAct_9fa48("921") ? () => undefined : (stryCov_9fa48("921"), () => set(stryMutAct_9fa48("922") ? {} : (stryCov_9fa48("922"), {
    leftExpand: stryMutAct_9fa48("923") ? "" : (stryCov_9fa48("923"), 'default'),
    centerExpand: stryMutAct_9fa48("924") ? "" : (stryCov_9fa48("924"), 'default'),
    rightExpand: stryMutAct_9fa48("925") ? "" : (stryCov_9fa48("925"), 'default'),
    expandMode: 'normal' as CanvasExpandMode
  }))),
  // Expand mode
  expandMode: 'normal' as CanvasExpandMode,
  setExpandMode: mode => {
    if (stryMutAct_9fa48("926")) {
      {}
    } else {
      stryCov_9fa48("926");
      set(stryMutAct_9fa48("927") ? {} : (stryCov_9fa48("927"), {
        expandMode: mode
      }));
      try {
        if (stryMutAct_9fa48("928")) {
          {}
        } else {
          stryCov_9fa48("928");
          localStorage.setItem(stryMutAct_9fa48("929") ? "" : (stryCov_9fa48("929"), 'canvas-expand-mode'), mode);
        }
      } catch {/* ignore */}
    }
  },
  toggleMaximize: () => {
    if (stryMutAct_9fa48("930")) {
      {}
    } else {
      stryCov_9fa48("930");
      const next = (stryMutAct_9fa48("933") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("932") ? false : stryMutAct_9fa48("931") ? true : (stryCov_9fa48("931", "932", "933"), get().expandMode === (stryMutAct_9fa48("934") ? "" : (stryCov_9fa48("934"), 'maximize')))) ? stryMutAct_9fa48("935") ? "" : (stryCov_9fa48("935"), 'normal') : stryMutAct_9fa48("936") ? "" : (stryCov_9fa48("936"), 'maximize');
      set(stryMutAct_9fa48("937") ? {} : (stryCov_9fa48("937"), {
        expandMode: next as CanvasExpandMode
      }));
      try {
        if (stryMutAct_9fa48("938")) {
          {}
        } else {
          stryCov_9fa48("938");
          localStorage.setItem(stryMutAct_9fa48("939") ? "" : (stryCov_9fa48("939"), 'canvas-expand-mode'), next);
        }
      } catch {/* ignore */}
    }
  },
  // Drag state
  draggedNodeId: null,
  dragOverNodeId: null,
  draggedPositions: {},
  isDragging: stryMutAct_9fa48("940") ? true : (stryCov_9fa48("940"), false),
  startDrag: stryMutAct_9fa48("941") ? () => undefined : (stryCov_9fa48("941"), nodeId => set(stryMutAct_9fa48("942") ? {} : (stryCov_9fa48("942"), {
    draggedNodeId: nodeId,
    isDragging: stryMutAct_9fa48("943") ? false : (stryCov_9fa48("943"), true)
  }))),
  endDrag: stryMutAct_9fa48("944") ? () => undefined : (stryCov_9fa48("944"), (nodeId, position) => set(stryMutAct_9fa48("945") ? () => undefined : (stryCov_9fa48("945"), s => stryMutAct_9fa48("946") ? {} : (stryCov_9fa48("946"), {
    draggedNodeId: null,
    dragOverNodeId: null,
    isDragging: stryMutAct_9fa48("947") ? true : (stryCov_9fa48("947"), false),
    draggedPositions: stryMutAct_9fa48("948") ? {} : (stryCov_9fa48("948"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  setDragOver: stryMutAct_9fa48("949") ? () => undefined : (stryCov_9fa48("949"), nodeId => set(stryMutAct_9fa48("950") ? {} : (stryCov_9fa48("950"), {
    dragOverNodeId: nodeId
  }))),
  updateDraggedPosition: stryMutAct_9fa48("951") ? () => undefined : (stryCov_9fa48("951"), (nodeId, position) => set(stryMutAct_9fa48("952") ? () => undefined : (stryCov_9fa48("952"), s => stryMutAct_9fa48("953") ? {} : (stryCov_9fa48("953"), {
    draggedPositions: stryMutAct_9fa48("954") ? {} : (stryCov_9fa48("954"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  clearDragPositions: stryMutAct_9fa48("955") ? () => undefined : (stryCov_9fa48("955"), () => set(stryMutAct_9fa48("956") ? {} : (stryCov_9fa48("956"), {
    draggedPositions: {},
    draggedNodeId: null,
    isDragging: stryMutAct_9fa48("957") ? true : (stryCov_9fa48("957"), false)
  }))),
  clearDragPosition: stryMutAct_9fa48("958") ? () => undefined : (stryCov_9fa48("958"), nodeId => set(s => {
    if (stryMutAct_9fa48("959")) {
      {}
    } else {
      stryCov_9fa48("959");
      const {
        [nodeId]: _,
        ...rest
      } = s.draggedPositions;
      return stryMutAct_9fa48("960") ? {} : (stryCov_9fa48("960"), {
        draggedPositions: rest
      });
    }
  })),
  // Left/Right Drawer
  leftDrawerOpen: stryMutAct_9fa48("961") ? true : (stryCov_9fa48("961"), false),
  rightDrawerOpen: stryMutAct_9fa48("962") ? true : (stryCov_9fa48("962"), false),
  leftDrawerWidth: 300,
  rightDrawerWidth: 360,
  toggleLeftDrawer: stryMutAct_9fa48("963") ? () => undefined : (stryCov_9fa48("963"), () => set(stryMutAct_9fa48("964") ? () => undefined : (stryCov_9fa48("964"), s => stryMutAct_9fa48("965") ? {} : (stryCov_9fa48("965"), {
    leftDrawerOpen: stryMutAct_9fa48("966") ? s.leftDrawerOpen : (stryCov_9fa48("966"), !s.leftDrawerOpen)
  })))),
  toggleRightDrawer: stryMutAct_9fa48("967") ? () => undefined : (stryCov_9fa48("967"), () => set(stryMutAct_9fa48("968") ? () => undefined : (stryCov_9fa48("968"), s => stryMutAct_9fa48("969") ? {} : (stryCov_9fa48("969"), {
    rightDrawerOpen: stryMutAct_9fa48("970") ? s.rightDrawerOpen : (stryCov_9fa48("970"), !s.rightDrawerOpen)
  })))),
  openRightDrawer: stryMutAct_9fa48("971") ? () => undefined : (stryCov_9fa48("971"), () => set(stryMutAct_9fa48("972") ? {} : (stryCov_9fa48("972"), {
    rightDrawerOpen: stryMutAct_9fa48("973") ? false : (stryCov_9fa48("973"), true)
  }))),
  submitCanvas: () => {
    if (stryMutAct_9fa48("974")) {
      {}
    } else {
      stryCov_9fa48("974");
      console.log(stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), '[Command] /submit triggered'));
    }
  },
  setLeftDrawerWidth: stryMutAct_9fa48("976") ? () => undefined : (stryCov_9fa48("976"), width => set(stryMutAct_9fa48("977") ? {} : (stryCov_9fa48("977"), {
    leftDrawerWidth: stryMutAct_9fa48("978") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("978"), Math.min(400, stryMutAct_9fa48("979") ? Math.min(100, width) : (stryCov_9fa48("979"), Math.max(100, width))))
  }))),
  setRightDrawerWidth: stryMutAct_9fa48("980") ? () => undefined : (stryCov_9fa48("980"), width => set(stryMutAct_9fa48("981") ? {} : (stryCov_9fa48("981"), {
    rightDrawerWidth: stryMutAct_9fa48("982") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("982"), Math.min(400, stryMutAct_9fa48("983") ? Math.min(100, width) : (stryCov_9fa48("983"), Math.max(100, width))))
  })))
})), stryMutAct_9fa48("984") ? {} : (stryCov_9fa48("984"), {
  name: stryMutAct_9fa48("985") ? "" : (stryCov_9fa48("985"), 'vibex-ui-store')
})), stryMutAct_9fa48("986") ? {} : (stryCov_9fa48("986"), {
  name: stryMutAct_9fa48("987") ? "" : (stryCov_9fa48("987"), 'UIStore')
})));