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

function newSessionId(): string {
  return `session-${Date.now()}-${++_sessionIdCounter}`;
}

function newEventId(): string {
  return `event-${Date.now()}-${++_eventIdCounter}`;
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
