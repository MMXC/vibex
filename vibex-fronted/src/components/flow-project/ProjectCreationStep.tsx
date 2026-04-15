/**
 * ProjectCreationStep - Epic 5: Project Creation
 *
 * Final step - project metadata and creation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMachine } from '@xstate/react';
import { flowMachine, FlowEvent } from '../flow-container/flowMachine';
import { projectApi } from '@/services/api/modules/project';
import { useAuthStore } from '@/stores/authStore';
import styles from './ProjectCreationStep.module.css';

const TECH_STACKS = [
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'nextjs', name: 'Next.js', icon: '▲' },
  { id: 'typescript', name: 'TypeScript', icon: '📘' },
  { id: 'tailwind', name: 'Tailwind CSS', icon: '💨' },
  { id: 'zustand', name: 'Zustand', icon: '📦' },
  { id: 'prisma', name: 'Prisma', icon: '◈' },
];

export function ProjectCreationStep() {
  const router = useRouter();
  const [state, send] = useMachine(flowMachine);
  const [projectName, setProjectName] = useState(state.context.projectMeta.name);
  const [projectDesc, setProjectDesc] = useState(state.context.projectMeta.description);
  const [selectedStack, setSelectedStack] = useState<string[]>(state.context.projectMeta.techStack);
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const toggleStack = (id: string) => {
    const newStack = selectedStack.includes(id)
      ? selectedStack.filter(s => s !== id)
      : [...selectedStack, id];
    setSelectedStack(newStack);
    send({ type: 'SET_PROJECT_META', meta: { techStack: newStack } } satisfies FlowEvent);
  };

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    setError(null);

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      setError('请先登录');
      setIsCreating(false);
      return;
    }

    try {
      const created = await projectApi.createProject({
        name: projectName,
        description: projectDesc,
        userId,
      });

      send({
        type: 'SET_PROJECT_META',
        meta: {
          name: projectName,
          description: projectDesc,
          techStack: selectedStack,
          createdAt: new Date().toISOString(),
        },
      });

      setCreatedProjectId(created.id);
      setIsCreating(false);
      setIsComplete(true);
      send({ type: 'SAVE' } satisfies FlowEvent);
    } catch (err) {
      setIsCreating(false);
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    }
  };

  if (isComplete && createdProjectId) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Project Created!</h2>
          <p className={styles.successDesc}>
            Your project "{projectName}" has been created successfully.
          </p>
          <div className={styles.projectDetails}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Tech Stack:</span>
              <span className={styles.detailValue}>{selectedStack.join(', ')}</span>
            </div>
          </div>
          <button
            className={styles.viewBtn}
            onClick={() => router.push(`/project?id=${createdProjectId}`)}
          >
            View Project →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Create Your Project</h2>
        <p className={styles.subtitle}>
          Give your project a name and select your tech stack.
        </p>
      </div>

      <div className={styles.form}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span className={styles.errorIcon}>⚠</span>
            <span className={styles.errorText}>{error}</span>
            <button
              type="button"
              className={styles.errorClose}
              onClick={() => setError(null)}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Project Name *</label>
          <input
            type="text"
            className={styles.input}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-awesome-project"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="A brief description of your project..."
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tech Stack</label>
          <div className={styles.stackGrid}>
            {TECH_STACKS.map((stack) => (
              <button
                key={stack.id}
                className={`${styles.stackBtn} ${selectedStack.includes(stack.id) ? styles.selected : ''}`}
                onClick={() => toggleStack(stack.id)}
              >
                <span className={styles.stackIcon}>{stack.icon}</span>
                <span className={styles.stackName}>{stack.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.summary}>
          <h4 className={styles.summaryTitle}>Summary</h4>
          <ul className={styles.summaryList}>
            <li>Contexts: {state.context.boundedContexts.filter(c => c.selected).length}</li>
            <li>Flow Nodes: {state.context.businessFlow.length}</li>
            <li>Components: {state.context.selectedComponents.length}</li>
          </ul>
        </div>

        <button
          className={styles.createBtn}
          onClick={handleCreate}
          disabled={!projectName.trim() || isCreating}
        >
          {isCreating ? 'Creating Project...' : 'Create Project →'}
        </button>
      </div>
    </div>
  );
}
