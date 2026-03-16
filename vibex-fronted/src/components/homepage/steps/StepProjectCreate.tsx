// Step 5: Project Create Component

import { useCallback, useState } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';
import type { StepComponentProps } from './types';

export function StepProjectCreate({ onNavigate, isActive }: StepComponentProps) {
  // Subscribe to store state
  const requirementText = useConfirmationStore((s) => s.requirementText);
  const boundedContexts = useConfirmationStore((s) => s.boundedContexts);
  const domainModels = useConfirmationStore((s) => s.domainModels);
  const businessFlow = useConfirmationStore((s) => s.businessFlow);
  const createdProjectId = useConfirmationStore((s) => s.createdProjectId);

  // Local state
  const [isCreating, setIsCreating] = useState(false);

  // Store actions
  const setCurrentStep = useConfirmationStore((s) => s.setCurrentStep);
  const setCreatedProjectId = useConfirmationStore((s) => s.setCreatedProjectId);

  // Handle project creation
  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Simulate project creation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Set created project ID
      const projectId = `project-${Date.now()}`;
      setCreatedProjectId(projectId);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  }, [setCreatedProjectId]);

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
              <button className="btn-primary">
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
                  {businessFlow.states?.length || 0} 个状态
                </span>
              </div>
            </div>

            <div className="actions">
              <button 
                className="btn-secondary"
                onClick={handlePrevious}
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
