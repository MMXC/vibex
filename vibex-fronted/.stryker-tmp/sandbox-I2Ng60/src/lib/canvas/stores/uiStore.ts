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
export const useUIStore = create<UIStore>()(devtools(persist(stryMutAct_9fa48("1570") ? () => undefined : (stryCov_9fa48("1570"), (set, get) => stryMutAct_9fa48("1571") ? {} : (stryCov_9fa48("1571"), {
  // Panel collapse
  contextPanelCollapsed: stryMutAct_9fa48("1572") ? true : (stryCov_9fa48("1572"), false),
  flowPanelCollapsed: stryMutAct_9fa48("1573") ? true : (stryCov_9fa48("1573"), false),
  componentPanelCollapsed: stryMutAct_9fa48("1574") ? true : (stryCov_9fa48("1574"), false),
  toggleContextPanel: stryMutAct_9fa48("1575") ? () => undefined : (stryCov_9fa48("1575"), () => set(stryMutAct_9fa48("1576") ? () => undefined : (stryCov_9fa48("1576"), s => stryMutAct_9fa48("1577") ? {} : (stryCov_9fa48("1577"), {
    contextPanelCollapsed: stryMutAct_9fa48("1578") ? s.contextPanelCollapsed : (stryCov_9fa48("1578"), !s.contextPanelCollapsed)
  })))),
  toggleFlowPanel: stryMutAct_9fa48("1579") ? () => undefined : (stryCov_9fa48("1579"), () => set(stryMutAct_9fa48("1580") ? () => undefined : (stryCov_9fa48("1580"), s => stryMutAct_9fa48("1581") ? {} : (stryCov_9fa48("1581"), {
    flowPanelCollapsed: stryMutAct_9fa48("1582") ? s.flowPanelCollapsed : (stryCov_9fa48("1582"), !s.flowPanelCollapsed)
  })))),
  toggleComponentPanel: stryMutAct_9fa48("1583") ? () => undefined : (stryCov_9fa48("1583"), () => set(stryMutAct_9fa48("1584") ? () => undefined : (stryCov_9fa48("1584"), s => stryMutAct_9fa48("1585") ? {} : (stryCov_9fa48("1585"), {
    componentPanelCollapsed: stryMutAct_9fa48("1586") ? s.componentPanelCollapsed : (stryCov_9fa48("1586"), !s.componentPanelCollapsed)
  })))),
  // Expand state
  leftExpand: stryMutAct_9fa48("1587") ? "" : (stryCov_9fa48("1587"), 'default'),
  centerExpand: stryMutAct_9fa48("1588") ? "" : (stryCov_9fa48("1588"), 'default'),
  rightExpand: stryMutAct_9fa48("1589") ? "" : (stryCov_9fa48("1589"), 'default'),
  getGridTemplate: stryMutAct_9fa48("1590") ? () => undefined : (stryCov_9fa48("1590"), () => stryMutAct_9fa48("1591") ? "" : (stryCov_9fa48("1591"), '1fr 1fr 1fr')),
  setLeftExpand: stryMutAct_9fa48("1592") ? () => undefined : (stryCov_9fa48("1592"), state => set(stryMutAct_9fa48("1593") ? {} : (stryCov_9fa48("1593"), {
    leftExpand: state
  }))),
  setCenterExpand: stryMutAct_9fa48("1594") ? () => undefined : (stryCov_9fa48("1594"), state => set(stryMutAct_9fa48("1595") ? {} : (stryCov_9fa48("1595"), {
    centerExpand: state
  }))),
  setRightExpand: stryMutAct_9fa48("1596") ? () => undefined : (stryCov_9fa48("1596"), state => set(stryMutAct_9fa48("1597") ? {} : (stryCov_9fa48("1597"), {
    rightExpand: state
  }))),
  togglePanel: panel => {
    if (stryMutAct_9fa48("1598")) {
      {}
    } else {
      stryCov_9fa48("1598");
      if (stryMutAct_9fa48("1601") ? panel !== 'left' : stryMutAct_9fa48("1600") ? false : stryMutAct_9fa48("1599") ? true : (stryCov_9fa48("1599", "1600", "1601"), panel === (stryMutAct_9fa48("1602") ? "" : (stryCov_9fa48("1602"), 'left')))) {
        if (stryMutAct_9fa48("1603")) {
          {}
        } else {
          stryCov_9fa48("1603");
          const {
            leftExpand
          } = get();
          const next = (stryMutAct_9fa48("1606") ? leftExpand !== 'default' : stryMutAct_9fa48("1605") ? false : stryMutAct_9fa48("1604") ? true : (stryCov_9fa48("1604", "1605", "1606"), leftExpand === (stryMutAct_9fa48("1607") ? "" : (stryCov_9fa48("1607"), 'default')))) ? stryMutAct_9fa48("1608") ? "" : (stryCov_9fa48("1608"), 'expand-right') : (stryMutAct_9fa48("1611") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("1610") ? false : stryMutAct_9fa48("1609") ? true : (stryCov_9fa48("1609", "1610", "1611"), leftExpand === (stryMutAct_9fa48("1612") ? "" : (stryCov_9fa48("1612"), 'expand-right')))) ? stryMutAct_9fa48("1613") ? "" : (stryCov_9fa48("1613"), 'default') : leftExpand;
          set(stryMutAct_9fa48("1614") ? {} : (stryCov_9fa48("1614"), {
            leftExpand: next as PanelExpandState
          }));
        }
      } else if (stryMutAct_9fa48("1617") ? panel !== 'center' : stryMutAct_9fa48("1616") ? false : stryMutAct_9fa48("1615") ? true : (stryCov_9fa48("1615", "1616", "1617"), panel === (stryMutAct_9fa48("1618") ? "" : (stryCov_9fa48("1618"), 'center')))) {
        if (stryMutAct_9fa48("1619")) {
          {}
        } else {
          stryCov_9fa48("1619");
          const {
            centerExpand
          } = get();
          const next = (stryMutAct_9fa48("1622") ? centerExpand !== 'default' : stryMutAct_9fa48("1621") ? false : stryMutAct_9fa48("1620") ? true : (stryCov_9fa48("1620", "1621", "1622"), centerExpand === (stryMutAct_9fa48("1623") ? "" : (stryCov_9fa48("1623"), 'default')))) ? stryMutAct_9fa48("1624") ? "" : (stryCov_9fa48("1624"), 'expand-left') : (stryMutAct_9fa48("1627") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("1626") ? false : stryMutAct_9fa48("1625") ? true : (stryCov_9fa48("1625", "1626", "1627"), centerExpand === (stryMutAct_9fa48("1628") ? "" : (stryCov_9fa48("1628"), 'expand-left')))) ? stryMutAct_9fa48("1629") ? "" : (stryCov_9fa48("1629"), 'expand-right') : (stryMutAct_9fa48("1632") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("1631") ? false : stryMutAct_9fa48("1630") ? true : (stryCov_9fa48("1630", "1631", "1632"), centerExpand === (stryMutAct_9fa48("1633") ? "" : (stryCov_9fa48("1633"), 'expand-right')))) ? stryMutAct_9fa48("1634") ? "" : (stryCov_9fa48("1634"), 'default') : stryMutAct_9fa48("1635") ? "" : (stryCov_9fa48("1635"), 'default');
          set(stryMutAct_9fa48("1636") ? {} : (stryCov_9fa48("1636"), {
            centerExpand: next as PanelExpandState
          }));
        }
      } else {
        if (stryMutAct_9fa48("1637")) {
          {}
        } else {
          stryCov_9fa48("1637");
          const {
            rightExpand
          } = get();
          const next = (stryMutAct_9fa48("1640") ? rightExpand !== 'default' : stryMutAct_9fa48("1639") ? false : stryMutAct_9fa48("1638") ? true : (stryCov_9fa48("1638", "1639", "1640"), rightExpand === (stryMutAct_9fa48("1641") ? "" : (stryCov_9fa48("1641"), 'default')))) ? stryMutAct_9fa48("1642") ? "" : (stryCov_9fa48("1642"), 'expand-left') : (stryMutAct_9fa48("1645") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("1644") ? false : stryMutAct_9fa48("1643") ? true : (stryCov_9fa48("1643", "1644", "1645"), rightExpand === (stryMutAct_9fa48("1646") ? "" : (stryCov_9fa48("1646"), 'expand-left')))) ? stryMutAct_9fa48("1647") ? "" : (stryCov_9fa48("1647"), 'default') : rightExpand;
          set(stryMutAct_9fa48("1648") ? {} : (stryCov_9fa48("1648"), {
            rightExpand: next as PanelExpandState
          }));
        }
      }
    }
  },
  resetExpand: stryMutAct_9fa48("1649") ? () => undefined : (stryCov_9fa48("1649"), () => set(stryMutAct_9fa48("1650") ? {} : (stryCov_9fa48("1650"), {
    leftExpand: stryMutAct_9fa48("1651") ? "" : (stryCov_9fa48("1651"), 'default'),
    centerExpand: stryMutAct_9fa48("1652") ? "" : (stryCov_9fa48("1652"), 'default'),
    rightExpand: stryMutAct_9fa48("1653") ? "" : (stryCov_9fa48("1653"), 'default'),
    expandMode: 'normal' as CanvasExpandMode
  }))),
  // Expand mode
  expandMode: 'normal' as CanvasExpandMode,
  setExpandMode: mode => {
    if (stryMutAct_9fa48("1654")) {
      {}
    } else {
      stryCov_9fa48("1654");
      set(stryMutAct_9fa48("1655") ? {} : (stryCov_9fa48("1655"), {
        expandMode: mode
      }));
      try {
        if (stryMutAct_9fa48("1656")) {
          {}
        } else {
          stryCov_9fa48("1656");
          localStorage.setItem(stryMutAct_9fa48("1657") ? "" : (stryCov_9fa48("1657"), 'canvas-expand-mode'), mode);
        }
      } catch {/* ignore */}
    }
  },
  toggleMaximize: () => {
    if (stryMutAct_9fa48("1658")) {
      {}
    } else {
      stryCov_9fa48("1658");
      const next = (stryMutAct_9fa48("1661") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("1660") ? false : stryMutAct_9fa48("1659") ? true : (stryCov_9fa48("1659", "1660", "1661"), get().expandMode === (stryMutAct_9fa48("1662") ? "" : (stryCov_9fa48("1662"), 'maximize')))) ? stryMutAct_9fa48("1663") ? "" : (stryCov_9fa48("1663"), 'normal') : stryMutAct_9fa48("1664") ? "" : (stryCov_9fa48("1664"), 'maximize');
      set(stryMutAct_9fa48("1665") ? {} : (stryCov_9fa48("1665"), {
        expandMode: next as CanvasExpandMode
      }));
      try {
        if (stryMutAct_9fa48("1666")) {
          {}
        } else {
          stryCov_9fa48("1666");
          localStorage.setItem(stryMutAct_9fa48("1667") ? "" : (stryCov_9fa48("1667"), 'canvas-expand-mode'), next);
        }
      } catch {/* ignore */}
    }
  },
  // Drag state
  draggedNodeId: null,
  dragOverNodeId: null,
  draggedPositions: {},
  isDragging: stryMutAct_9fa48("1668") ? true : (stryCov_9fa48("1668"), false),
  startDrag: stryMutAct_9fa48("1669") ? () => undefined : (stryCov_9fa48("1669"), nodeId => set(stryMutAct_9fa48("1670") ? {} : (stryCov_9fa48("1670"), {
    draggedNodeId: nodeId,
    isDragging: stryMutAct_9fa48("1671") ? false : (stryCov_9fa48("1671"), true)
  }))),
  endDrag: stryMutAct_9fa48("1672") ? () => undefined : (stryCov_9fa48("1672"), (nodeId, position) => set(stryMutAct_9fa48("1673") ? () => undefined : (stryCov_9fa48("1673"), s => stryMutAct_9fa48("1674") ? {} : (stryCov_9fa48("1674"), {
    draggedNodeId: null,
    dragOverNodeId: null,
    isDragging: stryMutAct_9fa48("1675") ? true : (stryCov_9fa48("1675"), false),
    draggedPositions: stryMutAct_9fa48("1676") ? {} : (stryCov_9fa48("1676"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  setDragOver: stryMutAct_9fa48("1677") ? () => undefined : (stryCov_9fa48("1677"), nodeId => set(stryMutAct_9fa48("1678") ? {} : (stryCov_9fa48("1678"), {
    dragOverNodeId: nodeId
  }))),
  updateDraggedPosition: stryMutAct_9fa48("1679") ? () => undefined : (stryCov_9fa48("1679"), (nodeId, position) => set(stryMutAct_9fa48("1680") ? () => undefined : (stryCov_9fa48("1680"), s => stryMutAct_9fa48("1681") ? {} : (stryCov_9fa48("1681"), {
    draggedPositions: stryMutAct_9fa48("1682") ? {} : (stryCov_9fa48("1682"), {
      ...s.draggedPositions,
      [nodeId]: position
    })
  })))),
  clearDragPositions: stryMutAct_9fa48("1683") ? () => undefined : (stryCov_9fa48("1683"), () => set(stryMutAct_9fa48("1684") ? {} : (stryCov_9fa48("1684"), {
    draggedPositions: {},
    draggedNodeId: null,
    isDragging: stryMutAct_9fa48("1685") ? true : (stryCov_9fa48("1685"), false)
  }))),
  clearDragPosition: stryMutAct_9fa48("1686") ? () => undefined : (stryCov_9fa48("1686"), nodeId => set(s => {
    if (stryMutAct_9fa48("1687")) {
      {}
    } else {
      stryCov_9fa48("1687");
      const {
        [nodeId]: _,
        ...rest
      } = s.draggedPositions;
      return stryMutAct_9fa48("1688") ? {} : (stryCov_9fa48("1688"), {
        draggedPositions: rest
      });
    }
  })),
  // Left/Right Drawer
  leftDrawerOpen: stryMutAct_9fa48("1689") ? true : (stryCov_9fa48("1689"), false),
  rightDrawerOpen: stryMutAct_9fa48("1690") ? true : (stryCov_9fa48("1690"), false),
  leftDrawerWidth: 300,
  rightDrawerWidth: 360,
  toggleLeftDrawer: stryMutAct_9fa48("1691") ? () => undefined : (stryCov_9fa48("1691"), () => set(stryMutAct_9fa48("1692") ? () => undefined : (stryCov_9fa48("1692"), s => stryMutAct_9fa48("1693") ? {} : (stryCov_9fa48("1693"), {
    leftDrawerOpen: stryMutAct_9fa48("1694") ? s.leftDrawerOpen : (stryCov_9fa48("1694"), !s.leftDrawerOpen)
  })))),
  toggleRightDrawer: stryMutAct_9fa48("1695") ? () => undefined : (stryCov_9fa48("1695"), () => set(stryMutAct_9fa48("1696") ? () => undefined : (stryCov_9fa48("1696"), s => stryMutAct_9fa48("1697") ? {} : (stryCov_9fa48("1697"), {
    rightDrawerOpen: stryMutAct_9fa48("1698") ? s.rightDrawerOpen : (stryCov_9fa48("1698"), !s.rightDrawerOpen)
  })))),
  openRightDrawer: stryMutAct_9fa48("1699") ? () => undefined : (stryCov_9fa48("1699"), () => set(stryMutAct_9fa48("1700") ? {} : (stryCov_9fa48("1700"), {
    rightDrawerOpen: stryMutAct_9fa48("1701") ? false : (stryCov_9fa48("1701"), true)
  }))),
  submitCanvas: () => {
    if (stryMutAct_9fa48("1702")) {
      {}
    } else {
      stryCov_9fa48("1702");
      console.log(stryMutAct_9fa48("1703") ? "" : (stryCov_9fa48("1703"), '[Command] /submit triggered'));
    }
  },
  setLeftDrawerWidth: stryMutAct_9fa48("1704") ? () => undefined : (stryCov_9fa48("1704"), width => set(stryMutAct_9fa48("1705") ? {} : (stryCov_9fa48("1705"), {
    leftDrawerWidth: stryMutAct_9fa48("1706") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1706"), Math.min(400, stryMutAct_9fa48("1707") ? Math.min(100, width) : (stryCov_9fa48("1707"), Math.max(100, width))))
  }))),
  setRightDrawerWidth: stryMutAct_9fa48("1708") ? () => undefined : (stryCov_9fa48("1708"), width => set(stryMutAct_9fa48("1709") ? {} : (stryCov_9fa48("1709"), {
    rightDrawerWidth: stryMutAct_9fa48("1710") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("1710"), Math.min(400, stryMutAct_9fa48("1711") ? Math.min(100, width) : (stryCov_9fa48("1711"), Math.max(100, width))))
  })))
})), stryMutAct_9fa48("1712") ? {} : (stryCov_9fa48("1712"), {
  name: stryMutAct_9fa48("1713") ? "" : (stryCov_9fa48("1713"), 'vibex-ui-store')
})), stryMutAct_9fa48("1714") ? {} : (stryCov_9fa48("1714"), {
  name: stryMutAct_9fa48("1715") ? "" : (stryCov_9fa48("1715"), 'UIStore')
})));