/**
 * collabSessionStore — S66-E5: Collaboration Session History & Replay
 *
 * Records collaboration WebSocket events into sessions and replays them.
 * Persisted via IndexedDB (idb) for offline access.
 *
 * E5 scope:
 * - D5.1: collabSessionStore — session recording + IndexedDB persistence
 * - D5.2: Session list/get/delete CRUD
 * - D5.3: Replay engine — speed control (0.5x/1x/2x/4x), pause/resume
 * - D5.4: WebSocket event capture handler
 * - D5.5: SessionReplayPanel UI
 *
 * S78-E3: 内联评论 — extends with comments Record + CRUD actions
 */

import { create } from 'zustand';
import { openDB } from 'idb';

// ==================== Types ====================

/** WebSocket event types captured during a session */
export type SessionEventType =
  | 'node:focused'
  | 'node:unfocused'
  | 'node:focus'
  | 'node:blur'
  | 'cursor:move'
  | 'user:join'
  | 'user:leave'
  | 'editing:start'
  | 'editing:end';

/** A single captured collaboration event */
export interface SessionEvent {
  eventId: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: number;       // Date.now() when captured
  userId: string;
  userName: string;
  avatar?: string;
  /** NodeId for node-related events */
  nodeId?: string;
  /** Cursor position */
  x?: number;
  y?: number;
}

/** A recorded collaboration session */
export interface SessionRecording {
  sessionId: string;
  name: string;
  canvasId: string;
  startTime: number;     // Date.now()
  endTime?: number;      // Date.now() when stopped
  participantIds: string[];
  participantNames: string[];
  eventCount: number;
}

/** Playback speed options */
export type ReplaySpeed = 0.5 | 1 | 2 | 4;

/** Replay state */
export interface ReplayState {
  sessionId: string | null;
  isPlaying: boolean;
  currentIndex: number;   // Index into events array
  speed: ReplaySpeed;
  startedAt: number | null;  // Date.now() when playback started
}

// ==================== S78-E3: Comment Types ====================

/** A single reply in a comment thread */
export interface CommentReply {
  replyId: string;
  userId: string;
  userName: string;
  avatar?: string;
  text: string;
  timestamp: number;
  mentions: string[];  // user IDs mentioned via @
}

/** A comment thread on a node */
export interface CommentThread {
  commentId: string;
  nodeId: string;
  userId: string;
  userName: string;
  avatar?: string;
  text: string;
  timestamp: number;
  mentions: string[];   // user IDs mentioned via @
  replies: CommentReply[];
}

// ==================== IndexedDB ====================

const DB_NAME = 'vibex-collab-sessions';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const EVENTS_STORE = 'events';

let _db: Awaited<ReturnType<typeof openDB>> | null = null;

async function initDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'eventId' });
        store.createIndex('by-session', 'sessionId');
      }
    },
  });
  return _db;
}

// ==================== Event Counter (for devtools) ====================

let _sessionIdCounter = 0;
let _eventIdCounter = 0;
let _commentIdCounter = 0;
let _replyIdCounter = 0;

function newSessionId(): string {
  return `session-${Date.now()}-${++_sessionIdCounter}`;
}

function newEventId(): string {
  return `event-${Date.now()}-${++_eventIdCounter}`;
}

function newCommentId(): string {
  return `comment-${Date.now()}-${++_commentIdCounter}`;
}

function newReplyId(): string {
  return `reply-${Date.now()}-${++_replyIdCounter}`;
}

// ==================== Store Interface ====================

export interface CollabSessionState {
  // Recording state
  isRecording: boolean;
  currentSessionId: string | null;
  currentEvents: SessionEvent[];

  // Sessions list
  sessions: SessionRecording[];
  sessionsLoaded: boolean;

  // Replay
  replay: ReplayState;
  replayEvents: SessionEvent[];

  // Recording actions
  startRecording: (canvasId: string, name?: string) => void;
  stopRecording: () => Promise<string | null>; // returns sessionId
  addEvent: (event: Omit<SessionEvent, 'eventId' | 'sessionId' | 'timestamp'>) => void;

  // Session CRUD
  loadSessions: () => Promise<void>;
  getSession: (sessionId: string) => Promise<SessionRecording | null>;
  getSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Replay actions
  startReplay: (sessionId: string) => Promise<void>;
  pauseReplay: () => void;
  resumeReplay: () => void;
  setReplaySpeed: (speed: ReplaySpeed) => void;
  stopReplay: () => void;

  // Export actions (S73-E5)
  exportSessionMarkdown: (sessionId: string) => Promise<string>;
  exportSessionPDF: (sessionId: string) => Promise<void>;

  // S78-E3: Comments
  comments: Record<string, CommentThread>;  // keyed by nodeId

  /** Add a new comment to a node */
  addComment: (
    nodeId: string,
    text: string,
    userId: string,
    userName: string,
    mentions?: string[],
    avatar?: string,
  ) => CommentThread;

  /** Get all comment threads for a node */
  getComments: (nodeId: string) => CommentThread[];

  /** Get total comment count for a node (all threads + replies) */
  getCommentCount: (nodeId: string) => number;

  /** Delete a comment thread (and all its replies) */
  deleteComment: (nodeId: string, commentId: string) => void;

  /** Add a reply to an existing comment thread */
  addReply: (
    nodeId: string,
    commentId: string,
    text: string,
    userId: string,
    userName: string,
    mentions?: string[],
    avatar?: string,
  ) => CommentReply | null;
}

// ==================== Store Implementation ====================

export const useCollabSessionStore = create<CollabSessionState>()((set, get) => ({
  isRecording: false,
  currentSessionId: null,
  currentEvents: [],
  sessions: [],
  sessionsLoaded: false,
  replay: {
    sessionId: null,
    isPlaying: false,
    currentIndex: 0,
    speed: 1,
    startedAt: null,
  },
  replayEvents: [],

  // S78-E3: Comments state
  comments: {},

  // ==================== Recording ====================

  startRecording(canvasId: string, name?: string) {
    const sessionId = newSessionId();
    const sessionName = name ?? `Session ${new Date().toLocaleString('zh-CN')}`;
    const now = Date.now();

    set({
      isRecording: true,
      currentSessionId: sessionId,
      currentEvents: [],
    });

    // Register in store
    const state = get();
    const recording: SessionRecording = {
      sessionId,
      name: sessionName,
      canvasId,
      startTime: now,
      participantIds: [],
      participantNames: [],
      eventCount: 0,
    };

    // Persist to IndexedDB
    initDB().then((db) => db.put(SESSIONS_STORE, recording));
  },

  async stopRecording() {
    const { currentSessionId, currentEvents } = get();
    if (!currentSessionId) return null;

    const endTime = Date.now();
    const participantIds = [...new Set(currentEvents.map((e) => e.userId))];
    const participantNames = [...new Set(currentEvents.map((e) => e.userName))];

    const session: SessionRecording = {
      sessionId: currentSessionId,
      name: `Session ${new Date(currentSessionId.split('-')[1]).toLocaleString('zh-CN')}`,
      canvasId: '',
      startTime: Number(currentSessionId.split('-')[1]) || Date.now(),
      endTime,
      participantIds,
      participantNames,
      eventCount: currentEvents.length,
    };

    // Persist session + all events
    const db = await initDB();
    await db.put(SESSIONS_STORE, session);
    for (const event of currentEvents) {
      await db.put(EVENTS_STORE, event);
    }

    set({ isRecording: false, currentSessionId: null, currentEvents: [] });

    // Reload sessions list
    await get().loadSessions();

    return currentSessionId;
  },

  addEvent(event) {
    const { isRecording, currentSessionId, currentEvents } = get();
    if (!isRecording || !currentSessionId) return;

    const fullEvent: SessionEvent = {
      ...event,
      eventId: newEventId(),
      sessionId: currentSessionId,
      timestamp: Date.now(),
    };

    set({ currentEvents: [...currentEvents, fullEvent] });
  },

  // ==================== Session CRUD ====================

  async loadSessions() {
    const db = await initDB();
    const sessions = await db.getAll(SESSIONS_STORE);
    // Sort by startTime descending (newest first)
    sessions.sort((a, b) => b.startTime - a.startTime);
    set({ sessions, sessionsLoaded: true });
  },

  async getSession(sessionId) {
    const db = await initDB();
    return (await db.get(SESSIONS_STORE, sessionId)) ?? null;
  },

  async getSessionEvents(sessionId) {
    const db = await initDB();
    const events = await db.getAllFromIndex(EVENTS_STORE, 'by-session', sessionId);
    events.sort((a, b) => a.timestamp - b.timestamp);
    return events;
  },

  async deleteSession(sessionId) {
    const db = await initDB();
    // Delete all events for this session
    const events = await db.getAllFromIndex(EVENTS_STORE, 'by-session', sessionId);
    const tx = db.transaction([SESSIONS_STORE, EVENTS_STORE], 'readwrite');
    await tx.objectStore(SESSIONS_STORE).delete(sessionId);
    for (const event of events) {
      await tx.objectStore(EVENTS_STORE).delete(event.eventId);
    }
    await tx.done;

    // Reload
    await get().loadSessions();
  },

  // ==================== Replay ====================

  async startReplay(sessionId) {
    const events = await get().getSessionEvents(sessionId);
    set({
      replay: {
        sessionId,
        isPlaying: true,
        currentIndex: 0,
        speed: 1,
        startedAt: Date.now(),
      },
      replayEvents: events,
    });
  },

  pauseReplay() {
    const { replay } = get();
    if (!replay.isPlaying) return;
    set({ replay: { ...replay, isPlaying: false } });
  },

  resumeReplay() {
    const { replay } = get();
    if (replay.isPlaying) return;
    set({ replay: { ...replay, isPlaying: true, startedAt: Date.now() } });
  },

  setReplaySpeed(speed: ReplaySpeed) {
    const { replay } = get();
    set({ replay: { ...replay, speed } });
  },

  stopReplay() {
    set({
      replay: {
        sessionId: null,
        isPlaying: false,
        currentIndex: 0,
        speed: 1,
        startedAt: null,
      },
      replayEvents: [],
    });
  },

  // ==================== Export (S73-E5) ====================

  async exportSessionMarkdown(sessionId: string): Promise<string> {
    const session = await get().getSession(sessionId);
    const events = await get().getSessionEvents(sessionId);

    if (!session) {
      return `# Session: ${sessionId}\n\n_Session not found._`;
    }

    const lines: string[] = [];
    lines.push(`# Session: ${session.name}`);
    lines.push('');
    lines.push('## Metadata');
    lines.push(`- **Session ID**: ${session.sessionId}`);
    lines.push(`- **Canvas ID**: ${session.canvasId}`);
    lines.push(`- **Start Time**: ${new Date(session.startTime).toLocaleString('zh-CN')}`);
    if (session.endTime) {
      lines.push(`- **End Time**: ${new Date(session.endTime).toLocaleString('zh-CN')}`);
    }
    lines.push(`- **Participants**: ${session.participantNames.join(', ') || 'None'}`);
    lines.push(`- **Event Count**: ${session.eventCount}`);
    lines.push('');

    lines.push('## Events');
    lines.push('');

    for (const event of events) {
      const ts = new Date(event.timestamp).toLocaleString('zh-CN');
      const label = SESSION_EVENT_LABELS[event.type] ?? event.type;
      lines.push(`### [${ts}] ${label}`);
      lines.push(`- **User**: ${event.userName} (${event.userId})`);
      if (event.nodeId) {
        lines.push(`- **Node**: ${event.nodeId}`);
      }
      if (event.x !== undefined && event.y !== undefined) {
        lines.push(`- **Position**: (${event.x}, ${event.y})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  },

  async exportSessionPDF(sessionId: string): Promise<void> {
    const session = await get().getSession(sessionId);
    if (!session) return;

    const events = await get().getSessionEvents(sessionId);

    const printContent = `
      <html><head><title>Session: ${session.name}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
        h1 { border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
        h2 { color: #6366f1; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .meta { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .meta p { margin: 4px 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>🤝 ${session.name}</h1>
      <div class="meta">
        <p><strong>Session ID:</strong> ${session.sessionId}</p>
        <p><strong>Canvas:</strong> ${session.canvasId}</p>
        <p><strong>Time:</strong> ${new Date(session.startTime).toLocaleString('zh-CN')} → ${session.endTime ? new Date(session.endTime).toLocaleString('zh-CN') : 'In progress'}</p>
        <p><strong>Participants:</strong> ${session.participantNames.join(', ') || 'None'}</p>
      </div>
      <h2>📋 Event Log (${events.length} events)</h2>
      <table>
        <thead><tr><th>Time</th><th>Type</th><th>User</th><th>Node</th><th>Position</th></tr></thead>
        <tbody>
          ${events.map(e => `<tr>
            <td>${new Date(e.timestamp).toLocaleString('zh-CN')}</td>
            <td>${SESSION_EVENT_LABELS[e.type] ?? e.type}</td>
            <td>${e.userName}</td>
            <td>${e.nodeId ?? '-'}</td>
            <td>${e.x !== undefined && e.y !== undefined ? `(${e.x}, ${e.y})` : '-'}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
      </body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  },

  // ==================== S78-E3: Comments ====================

  addComment(nodeId, text, userId, userName, mentions = [], avatar) {
    const commentId = newCommentId();
    const thread: CommentThread = {
      commentId,
      nodeId,
      userId,
      userName,
      avatar,
      text,
      timestamp: Date.now(),
      mentions,
      replies: [],
    };

    set((state) => ({
      comments: {
        ...state.comments,
        [nodeId]: [...(state.comments[nodeId] ?? []), thread],
      },
    }));

    return thread;
  },

  getComments(nodeId) {
    return get().comments[nodeId] ?? [];
  },

  getCommentCount(nodeId) {
    const threads = get().comments[nodeId] ?? [];
    return threads.reduce((acc, t) => acc + 1 + t.replies.length, 0);
  },

  deleteComment(nodeId, commentId) {
    set((state) => {
      const threads = state.comments[nodeId] ?? [];
      return {
        comments: {
          ...state.comments,
          [nodeId]: threads.filter((t) => t.commentId !== commentId),
        },
      };
    });
  },

  addReply(nodeId, commentId, text, userId, userName, mentions = [], avatar) {
    const threads = get().comments[nodeId];
    if (!threads) return null;

    const threadIndex = threads.findIndex((t) => t.commentId === commentId);
    if (threadIndex < 0) return null;

    const reply: CommentReply = {
      replyId: newReplyId(),
      userId,
      userName,
      avatar,
      text,
      timestamp: Date.now(),
      mentions,
    };

    const updatedThreads = threads.map((t) =>
      t.commentId === commentId ? { ...t, replies: [...t.replies, reply] } : t,
    );

    set((state) => ({
      comments: {
        ...state.comments,
        [nodeId]: updatedThreads,
      },
    }));

    return reply;
  },
}));

// ==================== Event Type Labels ====================

export const SESSION_EVENT_LABELS: Record<SessionEventType, string> = {
  'node:focused': '节点获得焦点',
  'node:unfocused': '节点失去焦点',
  'node:focus': '节点锁定',
  'node:blur': '节点解锁',
  'cursor:move': '光标移动',
  'user:join': '用户加入',
  'user:leave': '用户离开',
  'editing:start': '开始编辑',
  'editing:end': '结束编辑',
};
