/**
 * Projects New Page
 * 
 * 创建新项目页面 - 支持空白项目和模板创建
 * 路由: /projects/new
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjectTemplateStore } from '@/stores/projectTemplateStore';
import { DDDTemplateSelector } from '@/components/project-templates/DDDTemplateSelector';
import { projectApi } from '@/services/api/modules/project';
import { getUserId } from '@/lib/auth-token';
import { Plus, FileText, ArrowLeft } from 'lucide-react';
import styles from './new-project.module.css';

export default function NewProjectPage() {
  const router = useRouter();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleCreateBlank = async () => {
    if (!projectName.trim()) {
      setShowNameInput(true);
      return;
    }
    
    setIsCreating(true);
    try {
      const userId = getUserId() || 'anonymous';
      const project = await projectApi.createProject({
        name: projectName,
        description: '',
        userId,
      });
      router.push(`/project?id=${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string, name: string): Promise<{ projectId: string }> => {
    setIsCreating(true);
    try {
      const userId = getUserId() || 'anonymous';
      // Create project via API
      const project = await projectApi.createProject({
        name,
        description: `从模板创建: ${templateId}`,
        userId,
      });
      // TODO: Populate with template data (contexts, flows, components)
      setIsCreating(false);
      return { projectId: project.id };
    } catch (error) {
      console.error('Failed to create project from template:', error);
      setIsCreating(false);
      throw error;
    }
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.gridOverlay} />
      </div>

      {/* Back */}
      <Link href="/dashboard" className={styles.backLink}>
        <ArrowLeft size={18} />
        <span>返回项目列表</span>
      </Link>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>创建新项目</h1>
          <p className={styles.subtitle}>选择一个选项开始你的 DDD 建模之旅</p>
        </header>

        {/* Project Creation Options */}
        <div className={styles.options}>
          {/* Blank Project */}
          <div className={styles.optionCard}>
            <div className={styles.optionIcon}>
              <Plus size={32} />
            </div>
            <div className={styles.optionBody}>
              <h2 className={styles.optionTitle}>空白项目</h2>
              <p className={styles.optionDesc}>从零开始，手动构建领域模型</p>
              
              {showNameInput && (
                <div className={styles.nameInput}>
                  <input
                    type="text"
                    placeholder="输入项目名称"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateBlank()}
                    autoFocus
                    className={styles.input}
                  />
                </div>
              )}
              
              <button
                className={styles.primaryBtn}
                onClick={handleCreateBlank}
                disabled={isCreating}
              >
                {isCreating && !showTemplateSelector ? '创建中...' : '创建空白项目'}
              </button>
            </div>
          </div>

          {/* From Template */}
          <div 
            className={styles.optionCard}
            onClick={() => setShowTemplateSelector(true)}
          >
            <div className={styles.optionIcon}>
              <FileText size={32} />
            </div>
            <div className={styles.optionBody}>
              <h2 className={styles.optionTitle}>从模板创建</h2>
              <p className={styles.optionDesc}>使用预设模板快速启动标准 DDD 项目</p>
              
              <div className={styles.templateHints}>
                <span className={styles.hint}>电商系统</span>
                <span className={styles.hint}>用户管理</span>
                <span className={styles.hint}>通用业务</span>
              </div>
              
              <button className={styles.secondaryBtn}>
                浏览模板
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <DDDTemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onCreateProject={handleCreateFromTemplate}
        />
      )}
    </div>
  );
}
