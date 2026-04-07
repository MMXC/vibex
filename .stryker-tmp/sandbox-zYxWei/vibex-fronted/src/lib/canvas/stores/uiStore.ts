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
export const useUIStore = create<UIStore>()(devtools(persist(stryMutAct_9fa48("1346") ? () => undefined : (stryCov_9fa48("1346"), (set, get) => stryMutAct_9fa48("1347") ? {} : (stryCov_9fa48("1347"), {
  // Panel collapse
  contextPanelCollapsed: stryMutAct_9fa48("1348") ? true : (stryCov_9fa48("1348"), false),
  flowPanelCollapsed: stryMutAct_9fa48("1349") ? true : (stryCov_9fa48("1349"), false),
  componentPanelCollapsed: stryMutAct_9fa48("1350") ? true : (stryCov_9fa48("1350"), false),
  toggleContextPanel: stryMutAct_9fa48("1351") ? () => undefined : (stryCov_9fa48("1351"), () => set(stryMutAct_9fa48("1352") ? () => undefined : (stryCov_9fa48("1352"), s => stryMutAct_9fa48("1353") ? {} : (stryCov_9fa48("1353"), {
    contextPanelCollapsed: stryMutAct_9fa48("1354") ? s.contextPanelCollapsed : (stryCov_9fa48("1354"), !s.contextPanelCollapsed)
  })))),
  toggleFlowPanel: stryMutAct_9fa48("1355") ? () => undefined : (stryCov_9fa48("1355"), () => set(stryMutAct_9fa48("1356") ? () => undefined : (stryCov_9fa48("1356"), s => stryMutAct_9fa48("1357") ? {} : (stryCov_9fa48("1357"), {
    flowPanelCollapsed: stryMutAct_9fa48("1358") ? s.flowPanelCollapsed : (stryCov_9fa48("1358"), !s.flowPanelCollapsed)
  })))),
  toggleComponentPanel: stryMutAct_9fa48("1359") ? () => undefined : (stryCov_9fa48("1359"), () => set(stryMutAct_9fa48("1360") ? () => undefined : (stryCov_9fa48("1360"), s => stryMutAct_9fa48("1361") ? {} : (stryCov_9fa48("1361"), {
    componentPanelCollapsed: stryMutAct_9fa48("1362") ? s.componentPanelCollapsed : (stryCov_9fa48("1362"), !s.componentPanelCollapsed)
  })))),
  // Expand state
  leftExpand: stryMutAct_9fa48("1363") ? "" : (stryCov_9fa48("1363"), 'default'),
  centerExpand: stryMutAct_9fa48("1364") ? "" : (stryCov_9fa48("1364"), 'default'),
  rightExpand: stryMutAct_9fa48("1365") ? "" : (stryCov_9fa48("1365"), 'default'),
  getGridTemplate: stryMutAct_9fa48("1366") ? () => undefined : (stryCov_9fa48("1366"), () => stryMutAct_9fa48("1367") ? "" : (stryCov_9fa48("1367"), '1fr 1fr 1fr')),
  setLeftExpand: stryMutAct_9fa48("1368") ? () => undefined : (stryCov_9fa48("1368"), state => set(stryMutAct_9fa48("1369") ? {} : (stryCov_9fa48("1369"), {
    leftExpand: state
  }))),
  setCenterExpand: stryMutAct_9fa48("1370") ? () => undefined : (stryCov_9fa48("1370"), state => set(stryMutAct_9fa48("1371") ? {} : (stryCov_9fa48("1371"), {
    centerExpand: state
  }))),
  setRightExpand: stryMutAct_9fa48("1372") ? () => undefined : (stryCov_9fa48("1372"), state => set(stryMutAct_9fa48("1373") ? {} : (stryCov_9fa48("1373"), {
    rightExpand: state
  }))),
  togglePanel: panel => {
    if (stryMutAct_9fa48("1374")) {
      {}
    } else {
      stryCov_9fa48("1374");
      if (stryMutAct_9fa48("1377") ? panel !== 'left' : stryMutAct_9fa48("1376") ? false : stryMutAct_9fa48("1375") ? true : (stryCov_9fa48("1375", "1376", "1377"), panel === (stryMutAct_9fa48("1378") ? "" : (stryCov_9fa48("1378"), 'left')))) {
        if (stryMutAct_9fa48("1379")) {
          {}
        } else {
          stryCov_9fa48("1379");
          const {
            leftExpand
          } = get();
          const next = (stryMutAct_9fa48("1382") ? leftExpand !== 'default' : stryMutAct_9fa48("1381") ? false : stryMutAct_9fa48("1380") ? true : (stryCov_9fa48("1380", "1381", "1382"), leftExpand === (stryMutAct_9fa48("1383") ? "" : (stryCov_9fa48("1383"), 'default')))) ? stryMutAct_9fa48("1384") ? "" : (stryCov_9fa48("1384"), 'expand-right') : (stryMutAct_9fa48("1387") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("1386") ? false : stryMutAct_9fa48("1385") ? true : (stryCov_9fa48("1385", "1386", "1387"), leftExpand === (stryMutAct_9fa48("1388") ? "" : (stryCov_9fa48("1388"), 'expand-right')))) ? stryMutAct_9fa48("1389") ? "" : (stryCov_9fa48("1389"), 'default') : leftExpand;
          set(stryMutAct_9fa48("1390") ? {} : (stryCov_9fa48("1390"), {
            leftExpand: next as PanelExpandState
          }));
        }
      } else if (stryMutAct_9fa48("1393") ? panel !== 'center' : stryMutAct_9fa48("1392") ? false : stryMutAct_9fa48("1391") ? true : (stryCov_9fa48("1391", "1392", "1393"), panel === (stryMutAct_9fa48("1394") ? "" : (stryCov_9fa48("1394"), 'center')))) {
        if (stryMutAct_9fa48("1395")) {
          {}
        } else {
          stryCov_9fa48("1395");
          const {
            centerExpand
          } = get();
          const next = (stryMutAct_9fa48("1398") ? centerExpand !== 'default' : stryMutAct_9fa48("1397") ? false : stryMutAct_9fa48("1396") ? true : (stryCov_9fa48("1396", "1397", "1398"), centerExpand === (stryMutAct_9fa48("1399") ? "" : (stryCov_9fa48("1399"), 'default')))) ? stryMutAct_9fa48("1400") ? "" : (stryCov_9fa48("1400"), 'expand-left') : (stryMutAct_9fa48("1403") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("1402") ? false : stryMutAct_9fa48("1401") ? true : (stryCov_9fa48("1401", "1402", "1403"), centerExpand === (stryMutAct_9fa48("1404") ? "" : (stryCov_9fa48("1404"), 'expand-left')))) ? stryMutAct_9fa48("1405") ? "" : (stryCov_9fa48("1405"), 'expand-right') : (stryMutAct_9fa48("1408") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("1407") ? false : stryMutAct_9fa48("1406") ? true : (stryCov_9fa48("1406", "1407", "1408"), centerExpand === (stryMutAct_9fa48("1409") ? "" : (stryCov_9fa48("1409"), 'expand-right')))) ? stryMutAct_9fa48("1410") ? "" : (stryCov_9fa48("1410"), 'default') : stryMutAct_9fa48("1411") ? "" : (stryCov_9fa48("1411"), 'default');
          set(stryMutAct_9fa48("1412") ? {} : (stryCov_9fa48("1412"), {
            centerExpand: next as PanelExpandState
          }));
        }
      } else {
        if (stryMutAct_9fa48("1413")) {
          {}
        } else {
          stryCov_9fa48("1413");
          const {
            rightExpand
          } = get();
          const next = (stryMutAct_9fa48("1416") ? rightExpand !== 'default' : stryMutAct_9fa48("1415") ? false : stryMutAct_9fa48("1414") ? true : (stryCov_9fa48("1414", "1415", "1416"), rightExpand === (stryMutAct_9fa48("1417") ? "" : (stryCov_9fa48("1417"), 'default')))) ? stryMutAct_9fa48("1418") ? "" : (stryCov_9fa48("1418"), 'expand-left') : (stryMutAct_9fa48("1421") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("1420") ? false : stryMutAct_9fa48("1419") ? true : (stryCov_9fa48("1419", "1420", "1421"), rightExpand === (stryMutAct_9fa48("1422") ? "" : (stryCov_9fa48("1422"), 'expand-left')))) ? stryMutAct_9fa48("1423") ? "" : (stryCov_9fa48("1423"), 'default') : rightExpand;
          set(stryMutAct_9fa48("1424") ? {} : (stryCov_9fa48("1424"), {
            rightExpand: next as PanelExpandState
          }));
        }
      }
    }
  },
  resetExpand: stryMutAct_9fa48("1425") ? () => undefined : (stryCov_9fa48("1425"), () => set(stryMutAct_9fa48("1426") ? {} : (stryCov_9fa48("1426"), {
    leftExpand: stryMutAct_9fa48("1427") ? "" : (stryCov_9fa48("1427"), 'default'),
    centerExpand: stryMutAct_9fa48("1428") ? "" : (stryCov_9fa48("1428"), 'default'),
    rightExpand: stryMutAct_9fa48("1429") ? "" : (stryCov_9fa48("1429"), 'default'),
    expandMode: 'normal' as CanvasExpandMode
  }))),
  // Expand mode
  expandMode: 'normal' as CanvasExpandMode,
  setExpandMode: mode => {
    if (stryMutAct_9fa48("1430")) {
      {}
    } else {
      stryCov_9fa48("1430");
      set(stryMutAct_9fa48("1431") ? {} : (stryCov_9fa48("1431"), {
        expandMode: mode
      }));
      try {
        if (stryMutAct_9fa48("1432")) {
          {}
        } else {
          stryCov_9fa48("1432");
          localStorage.setItem(stryMutAct_9fa48("1433") ? "" : (stryCov_9fa48("1433"), 'canvas-expand-mode'), mode);
        }
      } catch {/* ignore */}
    }
  },
  toggleMaximize: () => {
    if (stryMutAct_9fa48("1434")) {
      {}
    } else {
      stryCov_9fa48("1434");
      const next = (stryMutAct_9fa48("1437") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("1436") ? false : stryMutAct_9fa48("1435") ? true : (stryCov_9fa48("1435", "1436", "1437"), get().expandMode === (stryMutAct_9fa48("1438") ? "" : (stryCov_9fa48("1438"), 'maximize')))) ? stryMutAct_9fa48("1439") ? "" : (stryCov_9fa48("1439"), 'normal') : stryMutAct_9fa48("1440") ? "" : (stryCov_9fa48("1440"), 'maximize');
      set(stryMutAct_9fa48("1441") ? {} : (stryCov_9fa48("1441"), {
        expandMode: next as CanvasExpandMode
      }));
      try {
        if (stryMutAct_9fa48("1442")) {
          {}
        } else {
          stryCov_9fa48("1442");
          localStorage.setItem(stryMutAct_9fa48("1443") ? "" : (stryCov_9fa48("1443"), 'canvas-expand-mode'), next);
        }
      } catch {/* ignore */}
    }
  },
  // Drag state
  draggedNodeId: null,
  dragOverNodeId: null,
  draggedPositions: {},
  isDragging: stryMutAct_9fa48("1444") ? true : (stryCov_9fa48("1444"), false),
  startDrag: stryMutAct_9fa48("1445") ? () => undefined : (stryCov_9fa48("1445"), nodeId => set(stryMutAct_9fa48("1446") ? {} : (stryCov_9fa48("1446"), {
    draggedNodeId: nodeId,
    isDragging: stryMutAct_9fa48("1447") ? false : (stryCov_9fa48("1447"), true)
  }))),
  endDrag: stryMutAct_9fa48("1448") ? () => undefined : (stryCov_9fa48("1448"), (nodeId, position) => set(stryMutAct_9fa48("1449") ? () => undefined : (stryCov_9fa48("1449"), s => stryMutAct_9fa48("1450") ? {} : (stryCov_9fa48("1450"), {
    draggedNodeId: null,
    dragOverNodeId: null,
    isDragging: stryMutAct_9fa48("1451") ? true : (stryCov_9fa48("1451"), false),
    draggedPositions: stryMutAct_9fa48("1452") ? {} : (stryCov_9fa48("1452"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  setDragOver: stryMutAct_9fa48("1453") ? () => undefined : (stryCov_9fa48("1453"), nodeId => set(stryMutAct_9fa48("1454") ? {} : (stryCov_9fa48("1454"), {
    dragOverNodeId: nodeId
  }))),
  updateDraggedPosition: stryMutAct_9fa48("1455") ? () => undefined : (stryCov_9fa48("1455"), (nodeId, position) => set(stryMutAct_9fa48("1456") ? () => undefined : (stryCov_9fa48("1456"), s => stryMutAct_9fa48("1457") ? {} : (stryCov_9fa48("1457"), {
    draggedPositions: stryMutAct_9fa48("1458") ? {} : (stryCov_9fa48("1458"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  clearDragPositions: stryMutAct_9fa48("1459") ? () => undefined : (stryCov_9fa48("1459"), () => set(stryMutAct_9fa48("1460") ? {} : (stryCov_9fa48("1460"), {
    draggedPositions: {},
    draggedNodeId: null,
    isDragging: stryMutAct_9fa48("1461") ? true : (stryCov_9fa48("1461"), false)
  }))),
  clearDragPosition: stryMutAct_9fa48("1462") ? () => undefined : (stryCov_9fa48("1462"), nodeId => set(s => {
    if (stryMutAct_9fa48("1463")) {
      {}
    } else {
      stryCov_9fa48("1463");
      const {
        [nodeId]: _,
        ...rest
      } = s.draggedPositions;
      return stryMutAct_9fa48("1464") ? {} : (stryCov_9fa48("1464"), {
        draggedPositions: rest
      });
    }
  })),
  // Left/Right Drawer
  leftDrawerOpen: stryMutAct_9fa48("1465") ? true : (stryCov_9fa48("1465"), false),
  rightDrawerOpen: stryMutAct_9fa48("1466") ? true : (stryCov_9fa48("1466"), false),
  leftDrawerWidth: 300,
  rightDrawerWidth: 360,
  toggleLeftDrawer: stryMutAct_9fa48("1467") ? () => undefined : (stryCov_9fa48("1467"), () => set(stryMutAct_9fa48("1468") ? () => undefined : (stryCov_9fa48("1468"), s => stryMutAct_9fa48("1469") ? {} : (stryCov_9fa48("1469"), {
    leftDrawerOpen: stryMutAct_9fa48("1470") ? s.leftDrawerOpen : (stryCov_9fa48("1470"), !s.leftDrawerOpen)
  })))),
  toggleRightDrawer: stryMutAct_9fa48("1471") ? () => undefined : (stryCov_9fa48("1471"), () => set(stryMutAct_9fa48("1472") ? () => undefined : (stryCov_9fa48("1472"), s => stryMutAct_9fa48("1473") ? {} : (stryCov_9fa48("1473"), {
    rightDrawerOpen: stryMutAct_9fa48("1474") ? s.rightDrawerOpen : (stryCov_9fa48("1474"), !s.rightDrawerOpen)
  })))),
  openRightDrawer: stryMutAct_9fa48("1475") ? () => undefined : (stryCov_9fa48("1475"), () => set(stryMutAct_9fa48("1476") ? {} : (stryCov_9fa48("1476"), {
    rightDrawerOpen: stryMutAct_9fa48("1477") ? false : (stryCov_9fa48("1477"), true)
  }))),
  submitCanvas: () => {
    if (stryMutAct_9fa48("1478")) {
      {}
    } else {
      stryCov_9fa48("1478");
      console.log(stryMutAct_9fa48("1479") ? "" : (stryCov_9fa48("1479"), '[Command] /submit triggered'));
    }
  },
  setLeftDrawerWidth: stryMutAct_9fa48("1480") ? () => undefined : (stryCov_9fa48("1480"), width => set(stryMutAct_9fa48("1481") ? {} : (stryCov_9fa48("1481"), {
    leftDrawerWidth: stryMutAct_9fa48("1482") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1482"), Math.min(400, stryMutAct_9fa48("1483") ? Math.min(100, width) : (stryCov_9fa48("1483"), Math.max(100, width))))
  }))),
  setRightDrawerWidth: stryMutAct_9fa48("1484") ? () => undefined : (stryCov_9fa48("1484"), width => set(stryMutAct_9fa48("1485") ? {} : (stryCov_9fa48("1485"), {
    rightDrawerWidth: stryMutAct_9fa48("1486") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1486"), Math.min(400, stryMutAct_9fa48("1487") ? Math.min(100, width) : (stryCov_9fa48("1487"), Math.max(100, width))))
  })))
})), stryMutAct_9fa48("1488") ? {} : (stryCov_9fa48("1488"), {
  name: stryMutAct_9fa48("1489") ? "" : (stryCov_9fa48("1489"), 'vibex-ui-store')
})), stryMutAct_9fa48("1490") ? {} : (stryCov_9fa48("1490"), {
  name: stryMutAct_9fa48("1491") ? "" : (stryCov_9fa48("1491"), 'UIStore')
})));