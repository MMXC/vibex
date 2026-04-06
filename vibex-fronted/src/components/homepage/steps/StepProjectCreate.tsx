// Step 5: Project Create Component

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirmationStore } from '@/stores/confirmationStore';
import type { BusinessFlow as ConfirmationBusinessFlow } from '@/stores/confirmationStore';
import { useAuthStore } from '@/stores/authStore';
import { projectApi } from '@/services/api';
import type { StepComponentProps } from './types';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// Union type for BusinessFlow compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBusinessFlow = any;

export function StepProjectCreate({ onNavigate, isActive }: StepComponentProps) {
  const router = useRouter();
  
  // Subscribe to store state
  const requirementText = useConfirmationStore((s) => s.requirementText);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const businessFlow = useConfirmationStore((s) => s.businessFlow);
  const createdProjectId = useConfirmationStore((s) => s.createdProjectId);

  // Get user ID from auth store
  const userId = useAuthStore((s) => s.user?.id || 'anonymous');

  // Local state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const setCreatedProjectId = useConfirmationStore((s) => s.setCreatedProjectId);

  // Handle project creation
  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Prepare project data from store
      const projectData = {
        name: requirementText.slice(0, 50) || 'Untitled Project',
        description: requirementText,
        userId,
      };

      // Call API to create project
      const result = await projectApi.createProject(projectData);
      
      // Set created project ID
      setCreatedProjectId(result.id);
    } catch (err) {
      canvasLogger.default.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  }, [requirementText, userId, setCreatedProjectId]);

  // Handle navigation to previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep('flow');
    onNavigate(4);
  }, [setCurrentStep, onNavigate]);

  // Check if project is already created
  const hasProject = !!createdProjectId;

  return (
    <div className="step-project-create">
      {/* Project Summary */}
      <div className="project-summary">
        <h2>项目创建</h2>
        
        {hasProject ? (
          <div className="project-created">
            <div className="success-icon">✓</div>
            <h3>项目创建成功！</h3>
            <p className="project-id">项目 ID: {createdProjectId}</p>
            
            <div className="project-actions">
              <button 
                className="btn-primary"
                onClick={() => router.push(`/project?id=${createdProjectId}`)}
              >
                查看项目 →
              </button>
              <button 
                className="btn-secondary"
                onClick={handlePrevious}
              >
                ← 返回业务流程
              </button>
            </div>
          </div>
        ) : (
          <div className="project-setup">
            <div className="summary-section">
              <h3>项目摘要</h3>
              
              <div className="summary-item">
                <span className="label">需求:</span>
                <span className="value">{requirementText || '未填写'}</span>
              </div>
              
              <div className="summary-item">
                <span className="label">限界上下文:</span>
                <span className="value">{boundedContexts.length} 个</span>
              </div>
              
              <div className="summary-item">
                <span className="label">领域模型:</span>
                <span className="value">{domainModels.length} 个</span>
              </div>
              
              <div className="summary-item">
                <span className="label">业务流程状态:</span>
                <span className="value">
                  {(businessFlow as AnyBusinessFlow).states?.length || 0} 个状态
                </span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="actions">
              <button 
                className="btn-secondary"
                onClick={handlePrevious}
                disabled={isCreating}
              >
                ← 上一步
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateProject}
                disabled={isCreating}
              >
                {isCreating ? '创建中...' : '🚀 创建项目'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepProjectCreate;
