/**
 * aiGenerateStore — S91 E1: AI Template Generation
 *
 * Manages AI template generation job state and polling.
 * Uses getState() static method for Vitest compatibility.
 */

import { create } from 'zustand';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GeneratedComponent {
  type: string;
  props?: Record<string, unknown>;
  children?: GeneratedComponent[];
  style?: Record<string, string | number>;
}

export interface TemplateGenerationResult {
  name: string;
  description: string;
  category: string;
  tags: string[];
  components: GeneratedComponent[];
}

export interface AIJob {
  id: string;
  prompt: string;
  status: JobStatus;
  result?: TemplateGenerationResult;
  error?: string;
  created_at: number;
  updated_at: number;
}

interface AIGenerateState {
  // Dialog open state
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;

  // Active job being polled
  activeJob: AIJob | null;
  setActiveJob: (job: AIJob | null) => void;

  // Generation history
  history: AIJob[];
  setHistory: (jobs: AIJob[]) => void;
  addToHistory: (job: AIJob) => void;

  // Loading states
  isGenerating: boolean;
  setGenerating: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;

  // Reset
  reset: () => void;
}

export const useAIGenerateStore = create<AIGenerateState>((set) => ({
  dialogOpen: false,
  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false, activeJob: null, isGenerating: false, error: null }),

  activeJob: null,
  setActiveJob: (job) => set({ activeJob: job, isGenerating: job?.status === 'pending' || job?.status === 'processing' }),

  history: [],
  setHistory: (jobs) => set({ history: jobs }),
  addToHistory: (job) => set((s) => ({ history: [job, ...s.history.filter(j => j.id !== job.id)] })),

  isGenerating: false,
  setGenerating: (v) => set({ isGenerating: v }),
  error: null,
  setError: (e) => set({ error: e }),

  reset: () => set({ dialogOpen: false, activeJob: null, history: [], isGenerating: false, error: null }),
}));

// Polling helper — poll until completed/failed or timeout
export async function pollJobUntilDone(
  jobId: string,
  onUpdate: (job: AIJob) => void,
  maxWaitMs = 30000,
  intervalMs = 2000
): Promise<AIJob> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`/api/templates/ai-generate/${jobId}`);
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const data = await res.json() as { ok: boolean; job: AIJob };
    const job = data.job;
    onUpdate(job);
    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Generation timed out');
}
