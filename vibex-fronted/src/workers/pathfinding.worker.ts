/**
 * pathfinding.worker.ts — S71-E3: 大型画布性能优化
 *
 * Offloads expensive path computation to a WebWorker.
 * Receives path requests, computes A* paths, posts results back.
 */

export interface PathRequest {
  id: string;
  method: 'findPath';
  params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    obstacles: Array<{ x: number; y: number; width: number; height: number }>;
  };
}

export interface PathResult {
  id: string;
  path: Array<{ x: number; y: number }>;
  duration: number;
}

/**
 * Manhattan distance heuristic for A*.
 */
function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Simple A* pathfinding on a grid.
 * Grid cell size: 20px.
 */
function astar(
  sx: number, sy: number,
  ex: number, ey: number,
  obstacles: PathRequest['params']['obstacles'],
  gridSize = 20
): Array<{ x: number; y: number }> {
  // Round to grid
  const start = { x: Math.round(sx / gridSize) * gridSize, y: Math.round(sy / gridSize) * gridSize };
  const end = { x: Math.round(ex / gridSize) * gridSize, y: Math.round(ey / gridSize) * gridSize };

  const open: Array<{ x: number; y: number; g: number; f: number; parent?: { x: number; y: number } }> = [
    { x: start.x, y: start.y, g: 0, f: heuristic(start.x, start.y, end.x, end.y) }
  ];
  const closed = new Set<string>();
  const dirs = [
    [gridSize, 0], [-gridSize, 0], [0, gridSize], [0, -gridSize],
    [gridSize, gridSize], [-gridSize, -gridSize], [gridSize, -gridSize], [-gridSize, gridSize],
  ];

  while (open.length > 0) {
    // Pop lowest f
    open.sort((a, b) => a.f - b.f);
    const curr = open.shift()!;

    if (curr.x === end.x && curr.y === end.y) {
      // Reconstruct path
      const path: Array<{ x: number; y: number }> = [];
      let node: typeof curr | undefined = curr;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = (node as any).parent;
      }
      return path;
    }

    closed.add(`${curr.x},${curr.y}`);

    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const key = `${nx},${ny}`;

      if (closed.has(key)) continue;

      // Check obstacles
      const inObstacle = obstacles.some(o =>
        nx >= o.x && nx <= o.x + o.width && ny >= o.y && ny <= o.y + o.height
      );
      if (inObstacle) continue;

      const g = curr.g + Math.hypot(dx, dy);
      const existing = open.find(n => n.x === nx && n.y === ny);
      if (!existing || g < existing.g) {
        if (existing) {
          existing.g = g;
          existing.f = g + heuristic(nx, ny, end.x, end.y);
          (existing as any).parent = curr;
        } else {
          open.push({ x: nx, y: ny, g, f: g + heuristic(nx, ny, end.x, end.y), parent: curr });
        }
      }
    }
  }

  // No path found — return direct line
  return [{ x: start.x, y: start.y }, { x: end.x, y: end.y }];
}

self.onmessage = (e: MessageEvent<PathRequest>) => {
  const req = e.data;
  const t0 = performance.now();

  if (req.method === 'findPath') {
    const path = astar(
      req.params.startX, req.params.startY,
      req.params.endX, req.params.endY,
      req.params.obstacles
    );
    const duration = Math.round(performance.now() - t0);
    const result: PathResult = { id: req.id, path, duration };
    self.postMessage(result);
  }
};
