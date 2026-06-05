/**
 * SessionReplayPanel — S66-E5: Collaboration Session History & Replay UI
 *
 * Displays recorded sessions and provides replay playback controls.
 * Accessible via canvas toolbar or HistoryPanel.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useCollabSessionStore,
  SESSION_EVENT_LABELS,
  type SessionRecording,
  type SessionEvent,
  type ReplaySpeed,
} from '@/lib/collaboration/collabSessionStore';
import styles from './SessionReplayPanel.module.css';

interface SessionReplayPanelProps {
  canvasId: string;
  className?: string;
}

export function SessionReplayPanel({ canvasId, className }: SessionReplayPanelProps) {
  const {
    isRecording,
    currentEvents,
    sessions,
    sessionsLoaded,
    replay,
    replayEvents,
    startRecording,
    stopRecording,
    loadSessions,
    deleteSession,
    getSessionEvents,
    startReplay,
    pauseReplay,
    resumeReplay,
    setReplaySpeed,
    stopReplay,
  } = useCollabSessionStore();

  const [selectedSession, setSelectedSession] = useState<SessionRecording | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<SessionEvent[]>([]);
  const [sessionName, setSessionName] = useState('');
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load sessions on mount
  useEffect(() => {
    if (!sessionsLoaded) {
      loadSessions();
    }
  }, [sessionsLoaded, loadSessions]);

  // Replay engine — advance event index on timer
  useEffect(() => {
    if (replay.isPlaying && replayEvents.length > 0) {
      const scheduleNext = () => {
        if (!useCollabSessionStore.getState().replay.isPlaying) return;
        const state = useCollabSessionStore.getState();
        const { currentIndex, speed } = state.replay;

        if (currentIndex >= state.replayEvents.length) {
          useCollabSessionStore.getState().stopReplay();
          return;
        }

        const events = state.replayEvents;
        const currentEvent = events[currentIndex];
        const nextEvent = events[currentIndex + 1];
        const baseDelay = nextEvent ? Math.max(50, nextEvent.timestamp - currentEvent.timestamp) : 1000;
        const delay = baseDelay / speed;

        replayTimerRef.current = setTimeout(() => {
          const s = useCollabSessionStore.getState();
          if (s.replay.isPlaying) {
            useCollabSessionStore.setState({
              replay: { ...s.replay, currentIndex: s.replay.currentIndex + 1 },
            });
            scheduleNext();
          }
        }, delay);
      };

      scheduleNext();
    } else {
      if (replayTimerRef.current) {
        clearTimeout(replayTimerRef.current);
        replayTimerRef.current = null;
      }
    }

    return () => {
      if (replayTimerRef.current) {
        clearTimeout(replayTimerRef.current);
      }
    };
  }, [replay.isPlaying, replayEvents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartRecording = () => {
    const name = sessionName.trim() || undefined;
    startRecording(canvasId, name);
    setSessionName('');
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleSelectSession = async (session: SessionRecording) => {
    setSelectedSession(session);
    const events = await getSessionEvents(session.sessionId);
    setSelectedEvents(events);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (selectedSession?.sessionId === sessionId) {
      setSelectedSession(null);
      setSelectedEvents([]);
    }
    await deleteSession(sessionId);
  };

  const handleStartReplay = async () => {
    if (!selectedSession) return;
    await startReplay(selectedSession.sessionId);
  };

  const currentReplayEvent = replayEvents[replay.currentIndex];

  return (
    <div className={`${styles.panel} ${className ?? ''}`} role="region" aria-label="协作会话历史">
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>协作会话历史</h3>
      </div>

      {/* Recording Controls */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>录制</div>
        {isRecording ? (
          <div className={styles.recordingActive}>
            <span className={styles.recordingDot} aria-hidden="true" />
            <span>录制中 ({currentEvents.length} 事件)</span>
            <button
              className={styles.btnStop}
              onClick={handleStopRecording}
              aria-label="停止录制"
            >
              停止
            </button>
          </div>
        ) : (
          <div className={styles.recordingControls}>
            <input
              type="text"
              className={styles.input}
              placeholder="会话名称（可选）"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              aria-label="会话名称"
            />
            <button
              className={styles.btnRecord}
              onClick={handleStartRecording}
              aria-label="开始录制"
            >
              开始录制
            </button>
          </div>
        )}
      </div>

      {/* Session List */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>已录制的会话</div>
        {!sessionsLoaded ? (
          <div className={styles.loading}>加载中...</div>
        ) : sessions.length === 0 ? (
          <div className={styles.empty}>暂无录制记录</div>
        ) : (
          <ul className={styles.sessionList} role="list">
            {sessions.map((session) => (
              <li
                key={session.sessionId}
                className={`${styles.sessionItem} ${selectedSession?.sessionId === session.sessionId ? styles.selected : ''}`}
              >
                <button
                  className={styles.sessionBtn}
                  onClick={() => handleSelectSession(session)}
                  aria-label={`选择会话: ${session.name}`}
                >
                  <div className={styles.sessionName}>{session.name}</div>
                  <div className={styles.sessionMeta}>
                    {new Date(session.startTime).toLocaleString('zh-CN')} ·{' '}
                    {session.eventCount} 事件 · {session.participantNames.length} 人
                  </div>
                </button>
                <button
                  className={styles.btnDelete}
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.sessionId); }}
                  aria-label={`删除会话: ${session.name}`}
                  title="删除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Replay Controls */}
      {selectedSession && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>回放: {selectedSession.name}</div>

          {/* Speed controls */}
          <div className={styles.speedControls} role="group" aria-label="回放速度">
            {([0.5, 1, 2, 4] as ReplaySpeed[]).map((speed) => (
              <button
                key={speed}
                className={`${styles.speedBtn} ${replay.speed === speed ? styles.activeSpeed : ''}`}
                onClick={() => setReplaySpeed(speed)}
                aria-pressed={replay.speed === speed}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Playback controls */}
          <div className={styles.playbackControls}>
            {replay.sessionId === selectedSession.sessionId ? (
              <>
                {replay.isPlaying ? (
                  <button className={styles.btn} onClick={pauseReplay} aria-label="暂停">⏸</button>
                ) : (
                  <button className={styles.btn} onClick={resumeReplay} aria-label="继续">▶</button>
                )}
                <button className={styles.btn} onClick={stopReplay} aria-label="停止">⏹</button>
              </>
            ) : (
              <button className={styles.btnPrimary} onClick={handleStartReplay}>
                ▶ 开始回放
              </button>
            )}
          </div>

          {/* Progress */}
          {replay.sessionId === selectedSession.sessionId && (
            <div className={styles.progress}>
              <div
                className={styles.progressBar}
                style={{ width: `${replayEvents.length > 0 ? (replay.currentIndex / replayEvents.length) * 100 : 0}%` }}
                role="progressbar"
                aria-valuenow={replay.currentIndex}
                aria-valuemin={0}
                aria-valuemax={replayEvents.length}
              />
              <span className={styles.progressText}>
                {replay.currentIndex} / {replayEvents.length}
              </span>
            </div>
          )}

          {/* Current event */}
          {currentReplayEvent && (
            <div className={styles.currentEvent}>
              <span className={styles.eventBadge}>{SESSION_EVENT_LABELS[currentReplayEvent.type]}</span>
              {currentReplayEvent.nodeId && (
                <span className={styles.eventNode}>节点: {currentReplayEvent.nodeId.slice(0, 8)}...</span>
              )}
              <span className={styles.eventUser}>{currentReplayEvent.userName}</span>
            </div>
          )}

          {/* Event list */}
          <div className={styles.eventList}>
            {selectedEvents.map((event, i) => (
              <div
                key={event.eventId}
                className={`${styles.eventItem} ${i === replay.currentIndex && replay.sessionId === selectedSession.sessionId ? styles.eventActive : ''}`}
              >
                <span className={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString('zh-CN')}
                </span>
                <span className={styles.eventType}>{SESSION_EVENT_LABELS[event.type]}</span>
                {event.nodeId && <span className={styles.eventNode}>{event.nodeId.slice(0, 6)}...</span>}
                <span className={styles.eventUser}>{event.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
