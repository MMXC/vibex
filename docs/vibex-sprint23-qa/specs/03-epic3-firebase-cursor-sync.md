# E3: Firebase Cursor Sync 规格文档

**项目**: vibex-sprint23-qa
**Epic**: E3
**QA 阶段**: 功能验收
**上游产出**: prd.md (S3.1-S3.3), architecture.md §3.4, IMPLEMENTATION_PLAN.md §3, tester-e3-firebase-cursor-report-20260503-0635.md

---

## UI 组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `RemoteCursor` | `src/components/presence/RemoteCursor.tsx` | Canvas 内渲染其他用户 cursor（SVG icon + username label） |
| `useCursorSync` | `src/hooks/useCursorSync.ts` | 100ms throttle 鼠标同步 hook |
| `presence.ts` | `src/lib/firebase/presence.ts` | Firebase presence 含 cursor: {x, y, nodeId, timestamp} |

---

## 四态定义

### 1. 理想态

**描述**: 当 Canvas 内有多个用户在线时（Firebase presence 实时同步），每个其他用户的 cursor 以 SVG icon 形式渲染在 Canvas 上，对应位置显示 username label。当前的本地 cursor 由浏览器原生控制，不在本组件范围内。

**UI 表现**:
- RemoteCursor SVG icon 位于 canvas 上的其他用户坐标（x, y）
- username label 跟随 cursor icon 显示（`data-testid="remote-cursor-label"`）
- Root 元素有 `data-testid="remote-cursor"`
- cursor 位置随 Firebase 实时更新，无卡顿（100ms throttle 已满足实时感）
- 多用户时渲染多个 RemoteCursor 实例（每个对应一个用户）

**验收 expect()**:

```typescript
describe('E3 Ideal State', () => {
  it('should render RemoteCursor with SVG icon and username label', () => {
    render(
      <RemoteCursor
        userId="u1"
        userName="Alice"
        position={{ x: 200, y: 300 }}
        nodeId="node_1"
        isMockMode={false}
      />
    );

    expect(screen.getByTestId('remote-cursor')).toBeInTheDocument();
    expect(screen.getByTestId('remote-cursor-label')).toHaveTextContent('Alice');
  });

  it('should position cursor at given x/y coordinates', () => {
    render(
      <RemoteCursor
        userId="u1"
        userName="Bob"
        position={{ x: 400, y: 150 }}
        isMockMode={false}
      />
    );

    const cursor = screen.getByTestId('remote-cursor');
    expect(cursor).toHaveStyle({ left: '400px', top: '150px' });
  });

  it('should render multiple cursors for multiple users', () => {
    render(
      <>
        <RemoteCursor userId="u1" userName="Alice" position={{ x: 100, y: 200 }} isMockMode={false} />
        <RemoteCursor userId="u2" userName="Bob" position={{ x: 300, y: 400 }} isMockMode={false} />
        <RemoteCursor userId="u3" userName="Charlie" position={{ x: 500, y: 100 }} isMockMode={false} />
      </>
    );

    const cursors = screen.getAllByTestId('remote-cursor');
    expect(cursors).toHaveLength(3);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should render cursor with nodeId context (label includes node)', () => {
    render(
      <RemoteCursor
        userId="u1"
        userName="David"
        position={{ x: 250, y: 350 }}
        nodeId="node_abc"
        isMockMode={false}
      />
    );

    const label = screen.getByTestId('remote-cursor-label');
    expect(label).toHaveTextContent(/David/);
    expect(label).toHaveAttribute('title', 'node_abc');
  });

  it('should update cursor position when Firebase presence changes', async () => {
    const { rerender } = render(
      <RemoteCursor
        userId="u1"
        userName="Eve"
        position={{ x: 100, y: 200 }}
        isMockMode={false}
      />
    );

    expect(screen.getByTestId('remote-cursor')).toHaveStyle({ left: '100px', top: '200px' });

    // Firebase 推送新位置
    rerender(
      <RemoteCursor
        userId="u1"
        userName="Eve"
        position={{ x: 500, y: 600 }}
        isMockMode={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('remote-cursor')).toHaveStyle({ left: '500px', top: '600px' });
    });
  });
});
```

---

### 2. 空状态

**描述**: 用户单人使用 Canvas（无其他用户在线），Firebase presence 中无其他用户数据。此时 `RemoteCursor` 组件不渲染（返回 `null`），这是正常降级行为，不需要任何 UI。

空状态不是"显示了 cursor 但是空"，而是"根本不存在 cursor DOM 节点"。

**验收 expect()**:

```typescript
describe('E3 Empty State', () => {
  it('should NOT render RemoteCursor when no other users are online', () => {
    // presence 中只有一个用户（自己）
    const presenceData = [
      { uid: 'me', name: 'Me', cursor: { x: 100, y: 200 } }
    ];

    render(
      <PresenceProvider initialData={presenceData}>
        <CanvasWithCursors />
      </PresenceProvider>
    );

    // 无其他用户，不应渲染任何 remote-cursor
    expect(screen.queryByTestId('remote-cursor')).not.toBeInTheDocument();
  });

  it('should return null from RemoteCursor when single user mode', () => {
    const result = render(
      <RemoteCursor userId="me" userName="Me" position={{ x: 100, y: 200 }} isMockMode={false} />
    );

    // 单人模式下不渲染，root 为 null
    expect(result.container.firstChild).toBeNull();
  });

  it('should not show any cursor labels in single-user mode', () => {
    render(
      <RemoteCursor userId="me" userName="Me" position={{ x: 100, y: 200 }} isMockMode={false} />
    );

    expect(screen.queryByTestId('remote-cursor-label')).not.toBeInTheDocument();
  });
});
```

---

### 3. 加载态

**描述**: Firebase 连接建立过程中（presence channel 初始化），RemoteCursor 不显示任何加载 UI。cursor 的出现是即时的（Firebase 推送）+ 隐式的（无 loading indicator）。用户不会感知"正在连接"，只会在其他用户 cursor 出现时注意到。

**验收 expect()**:

```typescript
describe('E3 Loading State', () => {
  it('should NOT show loading spinner for RemoteCursor', () => {
    render(
      <RemoteCursor
        userId="u1"
        userName="LoadingUser"
        position={{ x: 0, y: 0 }}
        isMockMode={false}
      />
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/loading|连接中|Connecting/)).not.toBeInTheDocument();
  });

  it('should show cursor immediately when Firebase presence resolves (no delay indicator)', async () => {
    // Firebase presence 推送数据后，cursor 应立即出现
    const presenceData = { uid: 'u1', name: 'Alice', cursor: { x: 300, y: 400 } };

    render(<CanvasWithPresence initialData={presenceData} />);

    await waitFor(() => {
      expect(screen.getByTestId('remote-cursor')).toBeInTheDocument();
    });

    // 无 loading placeholder
    expect(screen.queryByTestId('remote-cursor-skeleton')).not.toBeInTheDocument();
  });

  it('Firebase connection error should trigger error state (not loading state)', () => {
    // 连接失败 → 错误态，不是加载态
    render(
      <RemoteCursor
        userId="u1"
        userName="Alice"
        position={{ x: 100, y: 200 }}
        isMockMode={true} // mock 模式视为防护性不渲染
      />
    );

    expect(screen.queryByTestId('remote-cursor')).not.toBeInTheDocument();
    // 不显示任何 loading indicator
  });
});
```

---

### 4. 错误态

**覆盖场景**:

| 错误场景 | 处理策略 | UI 表现 |
|---------|---------|---------|
| Firebase mock 模式下（`isMockMode=true`） | 不渲染 cursor | RemoteCursor 返回 null，无 DOM |
| Firebase 写入失败（cursor 同步中断） | 静默重试，不影响本地操作 | 无 UI，用户无感知 |
| 其他用户离开（Firebase presence 移除） | cursor 立即从 DOM 移除 | 平滑消失，无报错 |

**验收 expect()**:

```typescript
describe('E3 Error State', () => {
  it('should not render cursor when isMockMode=true (protective)', () => {
    const result = render(
      <RemoteCursor
        userId="u1"
        userName="Alice"
        position={{ x: 200, y: 300 }}
        isMockMode={true}
      />
    );

    // isMockMode=true → 返回 null，无 DOM 节点
    expect(result.container.firstChild).toBeNull();
    expect(screen.queryByTestId('remote-cursor')).not.toBeInTheDocument();
  });

  it('should not render label when isMockMode=true', () => {
    render(
      <RemoteCursor
        userId="u1"
        userName="Alice"
        position={{ x: 200, y: 300 }}
        isMockMode={true}
      />
    );

    expect(screen.queryByTestId('remote-cursor-label')).not.toBeInTheDocument();
  });

  it('should remove cursor from DOM when user leaves (presence removed)', async () => {
    const { rerender } = render(
      <PresenceProvider>
        <CanvasWithCursors initialUsers={['u1', 'u2']} />
      </PresenceProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('remote-cursor')).toHaveLength(2);
    });

    // 用户 u2 离开
    rerender(
      <PresenceProvider>
        <CanvasWithCursors initialUsers={['u1']} />
      </PresenceProvider>
    );

    await waitFor(() => {
      const cursors = screen.queryAllByTestId('remote-cursor');
      expect(cursors).toHaveLength(1);
    });
  });

  it('useCursorSync hook writes cursor with 100ms throttle', () => {
    // 验证 throttle：100ms 内连续移动不重复写入
    const writeSpy = vi.fn();
    const { result } = renderHook(() =>
      useCursorSync({ onWrite: writeSpy, throttleMs: 100 })
    );

    // 快速连续移动 10 次（在 100ms 内）
    for (let i = 0; i < 10; i++) {
      result.current.moveTo({ x: i * 10, y: i * 20 });
    }

    // 实际只写入了 1-2 次（取决于时间边界）
    expect(writeSpy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('cursor write includes x, y, nodeId, timestamp', () => {
    const writeSpy = vi.fn();
    const { result } = renderHook(() =>
      useCursorSync({ onWrite: writeSpy, throttleMs: 100 })
    );

    result.current.moveTo({ x: 100, y: 200, nodeId: 'n1' });

    expect(writeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: expect.objectContaining({
          x: 100,
          y: 200,
          nodeId: 'n1',
          timestamp: expect.any(Number)
        })
      })
    );
  });
});
```

---

## 页面情绪地图（老妈测试）

- **用户进入时的情绪**: "我看到画布上有另一个人的光标在动——哦，是 Alice 在那边浏览设计图。" cursor sync 让多人协作变得有存在感，用户知道不是一个人在画布上。
- **用户迷路时的引导**: 用户不知道其他人能不能看到自己的 cursor → cursor 旁有 label 显示用户名，用户可以看到"我（本地）的 cursor 和别人的 cursor 样式是否一致"，无需额外引导。
- **用户出错时的兜底**: Firebase 连接偶尔抖动（网络问题），cursor 会消失几秒然后重新出现。用户不会看到任何错误消息，因为这是防护性行为。但若用户需要反馈问题（"为什么我看不到其他人的 cursor"），可以在 UI 上加一个小的连接状态指示器（绿色/黄色/红色点），但不阻塞核心操作。

---

## 测试覆盖清单

| ID | 测试点 | 方法 |
|----|--------|------|
| E3-T1 | RemoteCursor 渲染 SVG icon + username label | RTL 可见性断言 |
| E3-T2 | cursor 定位在正确的 x/y 坐标 | style 属性检查 |
| E3-T3 | 多用户渲染多个 RemoteCursor 实例 | 断言 length=3 |
| E3-T4 | cursor 位置随 Firebase 实时更新 | rerender + waitFor |
| E3-T5 | 单人使用时不渲染任何 cursor | queryByTestId → null |
| E3-T6 | isMockMode=true 返回 null（不渲染） | container.firstChild === null |
| E3-T7 | 用户离开后 cursor 平滑移除 | rerender + waitFor |
| E3-T8 | useCursorSync 100ms throttle | spy call count 断言 |
| E3-T9 | cursor 写入含 x/y/nodeId/timestamp | spy.toHaveBeenCalledWith |
| E3-T10 | 无 loading spinner | queryByRole('progressbar') → null |
| E3-T11 | TypeScript 0 errors | `pnpm exec tsc --noEmit` |
| E3-T12 | 4 个单元测试 100% 通过 | `npx vitest run firebase-presence-latency.test.ts` |