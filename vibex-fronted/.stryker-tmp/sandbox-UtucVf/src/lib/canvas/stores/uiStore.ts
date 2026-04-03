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
export const useUIStore = create<UIStore>()(devtools(persist(stryMutAct_9fa48("1311") ? () => undefined : (stryCov_9fa48("1311"), (set, get) => stryMutAct_9fa48("1312") ? {} : (stryCov_9fa48("1312"), {
  // Panel collapse
  contextPanelCollapsed: stryMutAct_9fa48("1313") ? true : (stryCov_9fa48("1313"), false),
  flowPanelCollapsed: stryMutAct_9fa48("1314") ? true : (stryCov_9fa48("1314"), false),
  componentPanelCollapsed: stryMutAct_9fa48("1315") ? true : (stryCov_9fa48("1315"), false),
  toggleContextPanel: stryMutAct_9fa48("1316") ? () => undefined : (stryCov_9fa48("1316"), () => set(stryMutAct_9fa48("1317") ? () => undefined : (stryCov_9fa48("1317"), s => stryMutAct_9fa48("1318") ? {} : (stryCov_9fa48("1318"), {
    contextPanelCollapsed: stryMutAct_9fa48("1319") ? s.contextPanelCollapsed : (stryCov_9fa48("1319"), !s.contextPanelCollapsed)
  })))),
  toggleFlowPanel: stryMutAct_9fa48("1320") ? () => undefined : (stryCov_9fa48("1320"), () => set(stryMutAct_9fa48("1321") ? () => undefined : (stryCov_9fa48("1321"), s => stryMutAct_9fa48("1322") ? {} : (stryCov_9fa48("1322"), {
    flowPanelCollapsed: stryMutAct_9fa48("1323") ? s.flowPanelCollapsed : (stryCov_9fa48("1323"), !s.flowPanelCollapsed)
  })))),
  toggleComponentPanel: stryMutAct_9fa48("1324") ? () => undefined : (stryCov_9fa48("1324"), () => set(stryMutAct_9fa48("1325") ? () => undefined : (stryCov_9fa48("1325"), s => stryMutAct_9fa48("1326") ? {} : (stryCov_9fa48("1326"), {
    componentPanelCollapsed: stryMutAct_9fa48("1327") ? s.componentPanelCollapsed : (stryCov_9fa48("1327"), !s.componentPanelCollapsed)
  })))),
  // Expand state
  leftExpand: stryMutAct_9fa48("1328") ? "" : (stryCov_9fa48("1328"), 'default'),
  centerExpand: stryMutAct_9fa48("1329") ? "" : (stryCov_9fa48("1329"), 'default'),
  rightExpand: stryMutAct_9fa48("1330") ? "" : (stryCov_9fa48("1330"), 'default'),
  getGridTemplate: stryMutAct_9fa48("1331") ? () => undefined : (stryCov_9fa48("1331"), () => stryMutAct_9fa48("1332") ? "" : (stryCov_9fa48("1332"), '1fr 1fr 1fr')),
  setLeftExpand: stryMutAct_9fa48("1333") ? () => undefined : (stryCov_9fa48("1333"), state => set(stryMutAct_9fa48("1334") ? {} : (stryCov_9fa48("1334"), {
    leftExpand: state
  }))),
  setCenterExpand: stryMutAct_9fa48("1335") ? () => undefined : (stryCov_9fa48("1335"), state => set(stryMutAct_9fa48("1336") ? {} : (stryCov_9fa48("1336"), {
    centerExpand: state
  }))),
  setRightExpand: stryMutAct_9fa48("1337") ? () => undefined : (stryCov_9fa48("1337"), state => set(stryMutAct_9fa48("1338") ? {} : (stryCov_9fa48("1338"), {
    rightExpand: state
  }))),
  togglePanel: panel => {
    if (stryMutAct_9fa48("1339")) {
      {}
    } else {
      stryCov_9fa48("1339");
      if (stryMutAct_9fa48("1342") ? panel !== 'left' : stryMutAct_9fa48("1341") ? false : stryMutAct_9fa48("1340") ? true : (stryCov_9fa48("1340", "1341", "1342"), panel === (stryMutAct_9fa48("1343") ? "" : (stryCov_9fa48("1343"), 'left')))) {
        if (stryMutAct_9fa48("1344")) {
          {}
        } else {
          stryCov_9fa48("1344");
          const {
            leftExpand
          } = get();
          const next = (stryMutAct_9fa48("1347") ? leftExpand !== 'default' : stryMutAct_9fa48("1346") ? false : stryMutAct_9fa48("1345") ? true : (stryCov_9fa48("1345", "1346", "1347"), leftExpand === (stryMutAct_9fa48("1348") ? "" : (stryCov_9fa48("1348"), 'default')))) ? stryMutAct_9fa48("1349") ? "" : (stryCov_9fa48("1349"), 'expand-right') : (stryMutAct_9fa48("1352") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("1351") ? false : stryMutAct_9fa48("1350") ? true : (stryCov_9fa48("1350", "1351", "1352"), leftExpand === (stryMutAct_9fa48("1353") ? "" : (stryCov_9fa48("1353"), 'expand-right')))) ? stryMutAct_9fa48("1354") ? "" : (stryCov_9fa48("1354"), 'default') : leftExpand;
          set(stryMutAct_9fa48("1355") ? {} : (stryCov_9fa48("1355"), {
            leftExpand: next as PanelExpandState
          }));
        }
      } else if (stryMutAct_9fa48("1358") ? panel !== 'center' : stryMutAct_9fa48("1357") ? false : stryMutAct_9fa48("1356") ? true : (stryCov_9fa48("1356", "1357", "1358"), panel === (stryMutAct_9fa48("1359") ? "" : (stryCov_9fa48("1359"), 'center')))) {
        if (stryMutAct_9fa48("1360")) {
          {}
        } else {
          stryCov_9fa48("1360");
          const {
            centerExpand
          } = get();
          const next = (stryMutAct_9fa48("1363") ? centerExpand !== 'default' : stryMutAct_9fa48("1362") ? false : stryMutAct_9fa48("1361") ? true : (stryCov_9fa48("1361", "1362", "1363"), centerExpand === (stryMutAct_9fa48("1364") ? "" : (stryCov_9fa48("1364"), 'default')))) ? stryMutAct_9fa48("1365") ? "" : (stryCov_9fa48("1365"), 'expand-left') : (stryMutAct_9fa48("1368") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("1367") ? false : stryMutAct_9fa48("1366") ? true : (stryCov_9fa48("1366", "1367", "1368"), centerExpand === (stryMutAct_9fa48("1369") ? "" : (stryCov_9fa48("1369"), 'expand-left')))) ? stryMutAct_9fa48("1370") ? "" : (stryCov_9fa48("1370"), 'expand-right') : (stryMutAct_9fa48("1373") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("1372") ? false : stryMutAct_9fa48("1371") ? true : (stryCov_9fa48("1371", "1372", "1373"), centerExpand === (stryMutAct_9fa48("1374") ? "" : (stryCov_9fa48("1374"), 'expand-right')))) ? stryMutAct_9fa48("1375") ? "" : (stryCov_9fa48("1375"), 'default') : stryMutAct_9fa48("1376") ? "" : (stryCov_9fa48("1376"), 'default');
          set(stryMutAct_9fa48("1377") ? {} : (stryCov_9fa48("1377"), {
            centerExpand: next as PanelExpandState
          }));
        }
      } else {
        if (stryMutAct_9fa48("1378")) {
          {}
        } else {
          stryCov_9fa48("1378");
          const {
            rightExpand
          } = get();
          const next = (stryMutAct_9fa48("1381") ? rightExpand !== 'default' : stryMutAct_9fa48("1380") ? false : stryMutAct_9fa48("1379") ? true : (stryCov_9fa48("1379", "1380", "1381"), rightExpand === (stryMutAct_9fa48("1382") ? "" : (stryCov_9fa48("1382"), 'default')))) ? stryMutAct_9fa48("1383") ? "" : (stryCov_9fa48("1383"), 'expand-left') : (stryMutAct_9fa48("1386") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("1385") ? false : stryMutAct_9fa48("1384") ? true : (stryCov_9fa48("1384", "1385", "1386"), rightExpand === (stryMutAct_9fa48("1387") ? "" : (stryCov_9fa48("1387"), 'expand-left')))) ? stryMutAct_9fa48("1388") ? "" : (stryCov_9fa48("1388"), 'default') : rightExpand;
          set(stryMutAct_9fa48("1389") ? {} : (stryCov_9fa48("1389"), {
            rightExpand: next as PanelExpandState
          }));
        }
      }
    }
  },
  resetExpand: stryMutAct_9fa48("1390") ? () => undefined : (stryCov_9fa48("1390"), () => set(stryMutAct_9fa48("1391") ? {} : (stryCov_9fa48("1391"), {
    leftExpand: stryMutAct_9fa48("1392") ? "" : (stryCov_9fa48("1392"), 'default'),
    centerExpand: stryMutAct_9fa48("1393") ? "" : (stryCov_9fa48("1393"), 'default'),
    rightExpand: stryMutAct_9fa48("1394") ? "" : (stryCov_9fa48("1394"), 'default'),
    expandMode: 'normal' as CanvasExpandMode
  }))),
  // Expand mode
  expandMode: 'normal' as CanvasExpandMode,
  setExpandMode: mode => {
    if (stryMutAct_9fa48("1395")) {
      {}
    } else {
      stryCov_9fa48("1395");
      set(stryMutAct_9fa48("1396") ? {} : (stryCov_9fa48("1396"), {
        expandMode: mode
      }));
      try {
        if (stryMutAct_9fa48("1397")) {
          {}
        } else {
          stryCov_9fa48("1397");
          localStorage.setItem(stryMutAct_9fa48("1398") ? "" : (stryCov_9fa48("1398"), 'canvas-expand-mode'), mode);
        }
      } catch {/* ignore */}
    }
  },
  toggleMaximize: () => {
    if (stryMutAct_9fa48("1399")) {
      {}
    } else {
      stryCov_9fa48("1399");
      const next = (stryMutAct_9fa48("1402") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("1401") ? false : stryMutAct_9fa48("1400") ? true : (stryCov_9fa48("1400", "1401", "1402"), get().expandMode === (stryMutAct_9fa48("1403") ? "" : (stryCov_9fa48("1403"), 'maximize')))) ? stryMutAct_9fa48("1404") ? "" : (stryCov_9fa48("1404"), 'normal') : stryMutAct_9fa48("1405") ? "" : (stryCov_9fa48("1405"), 'maximize');
      set(stryMutAct_9fa48("1406") ? {} : (stryCov_9fa48("1406"), {
        expandMode: next as CanvasExpandMode
      }));
      try {
        if (stryMutAct_9fa48("1407")) {
          {}
        } else {
          stryCov_9fa48("1407");
          localStorage.setItem(stryMutAct_9fa48("1408") ? "" : (stryCov_9fa48("1408"), 'canvas-expand-mode'), next);
        }
      } catch {/* ignore */}
    }
  },
  // Drag state
  draggedNodeId: null,
  dragOverNodeId: null,
  draggedPositions: {},
  isDragging: stryMutAct_9fa48("1409") ? true : (stryCov_9fa48("1409"), false),
  startDrag: stryMutAct_9fa48("1410") ? () => undefined : (stryCov_9fa48("1410"), nodeId => set(stryMutAct_9fa48("1411") ? {} : (stryCov_9fa48("1411"), {
    draggedNodeId: nodeId,
    isDragging: stryMutAct_9fa48("1412") ? false : (stryCov_9fa48("1412"), true)
  }))),
  endDrag: stryMutAct_9fa48("1413") ? () => undefined : (stryCov_9fa48("1413"), (nodeId, position) => set(stryMutAct_9fa48("1414") ? () => undefined : (stryCov_9fa48("1414"), s => stryMutAct_9fa48("1415") ? {} : (stryCov_9fa48("1415"), {
    draggedNodeId: null,
    dragOverNodeId: null,
    isDragging: stryMutAct_9fa48("1416") ? true : (stryCov_9fa48("1416"), false),
    draggedPositions: stryMutAct_9fa48("1417") ? {} : (stryCov_9fa48("1417"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  setDragOver: stryMutAct_9fa48("1418") ? () => undefined : (stryCov_9fa48("1418"), nodeId => set(stryMutAct_9fa48("1419") ? {} : (stryCov_9fa48("1419"), {
    dragOverNodeId: nodeId
  }))),
  updateDraggedPosition: stryMutAct_9fa48("1420") ? () => undefined : (stryCov_9fa48("1420"), (nodeId, position) => set(stryMutAct_9fa48("1421") ? () => undefined : (stryCov_9fa48("1421"), s => stryMutAct_9fa48("1422") ? {} : (stryCov_9fa48("1422"), {
    draggedPositions: stryMutAct_9fa48("1423") ? {} : (stryCov_9fa48("1423"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  clearDragPositions: stryMutAct_9fa48("1424") ? () => undefined : (stryCov_9fa48("1424"), () => set(stryMutAct_9fa48("1425") ? {} : (stryCov_9fa48("1425"), {
    draggedPositions: {},
    draggedNodeId: null,
    isDragging: stryMutAct_9fa48("1426") ? true : (stryCov_9fa48("1426"), false)
  }))),
  clearDragPosition: stryMutAct_9fa48("1427") ? () => undefined : (stryCov_9fa48("1427"), nodeId => set(s => {
    if (stryMutAct_9fa48("1428")) {
      {}
    } else {
      stryCov_9fa48("1428");
      const {
        [nodeId]: _,
        ...rest
      } = s.draggedPositions;
      return stryMutAct_9fa48("1429") ? {} : (stryCov_9fa48("1429"), {
        draggedPositions: rest
      });
    }
  })),
  // Left/Right Drawer
  leftDrawerOpen: stryMutAct_9fa48("1430") ? true : (stryCov_9fa48("1430"), false),
  rightDrawerOpen: stryMutAct_9fa48("1431") ? true : (stryCov_9fa48("1431"), false),
  leftDrawerWidth: 300,
  rightDrawerWidth: 360,
  toggleLeftDrawer: stryMutAct_9fa48("1432") ? () => undefined : (stryCov_9fa48("1432"), () => set(stryMutAct_9fa48("1433") ? () => undefined : (stryCov_9fa48("1433"), s => stryMutAct_9fa48("1434") ? {} : (stryCov_9fa48("1434"), {
    leftDrawerOpen: stryMutAct_9fa48("1435") ? s.leftDrawerOpen : (stryCov_9fa48("1435"), !s.leftDrawerOpen)
  })))),
  toggleRightDrawer: stryMutAct_9fa48("1436") ? () => undefined : (stryCov_9fa48("1436"), () => set(stryMutAct_9fa48("1437") ? () => undefined : (stryCov_9fa48("1437"), s => stryMutAct_9fa48("1438") ? {} : (stryCov_9fa48("1438"), {
    rightDrawerOpen: stryMutAct_9fa48("1439") ? s.rightDrawerOpen : (stryCov_9fa48("1439"), !s.rightDrawerOpen)
  })))),
  openRightDrawer: stryMutAct_9fa48("1440") ? () => undefined : (stryCov_9fa48("1440"), () => set(stryMutAct_9fa48("1441") ? {} : (stryCov_9fa48("1441"), {
    rightDrawerOpen: stryMutAct_9fa48("1442") ? false : (stryCov_9fa48("1442"), true)
  }))),
  submitCanvas: () => {
    if (stryMutAct_9fa48("1443")) {
      {}
    } else {
      stryCov_9fa48("1443");
      console.log(stryMutAct_9fa48("1444") ? "" : (stryCov_9fa48("1444"), '[Command] /submit triggered'));
    }
  },
  setLeftDrawerWidth: stryMutAct_9fa48("1445") ? () => undefined : (stryCov_9fa48("1445"), width => set(stryMutAct_9fa48("1446") ? {} : (stryCov_9fa48("1446"), {
    leftDrawerWidth: stryMutAct_9fa48("1447") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1447"), Math.min(400, stryMutAct_9fa48("1448") ? Math.min(100, width) : (stryCov_9fa48("1448"), Math.max(100, width))))
  }))),
  setRightDrawerWidth: stryMutAct_9fa48("1449") ? () => undefined : (stryCov_9fa48("1449"), width => set(stryMutAct_9fa48("1450") ? {} : (stryCov_9fa48("1450"), {
    rightDrawerWidth: stryMutAct_9fa48("1451") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1451"), Math.min(400, stryMutAct_9fa48("1452") ? Math.min(100, width) : (stryCov_9fa48("1452"), Math.max(100, width))))
  })))
})), stryMutAct_9fa48("1453") ? {} : (stryCov_9fa48("1453"), {
  name: stryMutAct_9fa48("1454") ? "" : (stryCov_9fa48("1454"), 'vibex-ui-store')
})), stryMutAct_9fa48("1455") ? {} : (stryCov_9fa48("1455"), {
  name: stryMutAct_9fa48("1456") ? "" : (stryCov_9fa48("1456"), 'UIStore')
})));