/**
 * PreviewStep - 模板选择步骤组件 (Step 5)
 * 
 * E1-S1: 显示模板卡片列表，选择后触发 auto-fill
 * E1-S3: 根据 scenario 过滤模板推荐
 */

'use client';

import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { useTemplates } from '@/hooks/useTemplates';
import type { IndustryTemplate } from '@/hooks/useTemplates';
import type { ScenarioType } from '@/stores/onboarding/types';
import styles from './StepContent.module.css';

// E1-S2: 待填充的模板 requirement 内容（存入 localStorage）
const PENDING_TEMPLATE_REQ_KEY = 'vibex:pending_template_req';

export interface StepContentProps {
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}

/** 场景标签映射 */
const SCENARIO_TAGS: Record<ScenarioType, string[]> = {
  'new-feature': ['feature', 'new', 'saas', 'mobile', 'ecommerce'],
  'refactor': ['refactor'],
  'bugfix': ['bugfix'],
  'documentation': ['docs', 'documentation'],
  'other': [],
};

/** 过滤模板 by scenario */
function filterByScenario(
  templates: IndustryTemplate[],
  scenario?: ScenarioType
): IndustryTemplate[] {
  if (!scenario || scenario === 'other') return templates;
  const tags = SCENARIO_TAGS[scenario];
  if (tags.length === 0) return templates;
  return templates.filter((t) => {
    const text = `${t.name} ${t.description}`.toLowerCase();
    return tags.some((tag) => text.includes(tag));
  });
}

/** 选择模板后，将 requirement 内容存入 localStorage 供 Canvas auto-fill */
function storePendingTemplateRequirement(tmpl: IndustryTemplate) {
  try {
    const req = tmpl.chapters?.requirement ?? '';
    if (req) {
      localStorage.setItem(PENDING_TEMPLATE_REQ_KEY, req);
    }
  } catch {
    // localStorage 失败静默忽略
  }
}

export function PreviewStep({ onNext: _unusedOnNext, onPrev }: StepContentProps) {
  const scenario = useOnboardingStore((s) => s.scenario);
  const selectedTemplateId = useOnboardingStore((s) => s.selectedTemplateId);
  const setSelectedTemplateId = useOnboardingStore((s) => s.setSelectedTemplateId);
  const complete = useOnboardingStore((s) => s.complete);

  const { templates, selectTemplate, isLoading } = useTemplates();
  const filtered = filterByScenario(templates, scenario);

  const handleSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // E1-S2: 立即存储模板 requirement
    const tmpl = selectTemplate(templateId);
    if (tmpl) {
      storePendingTemplateRequirement(tmpl);
    }
  };

  const handleNext = () => {
    complete();
  };

  return (
    <div className={styles.container} data-testid="onboarding-step-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.content}
      >
        <div className={styles.icon}>🎨</div>
        <h2 className={styles.title}>选择项目模板</h2>
        <p className={styles.subtitle}>
          {scenario ? '根据你的场景推荐以下模板' : '选择一个模板快速开始'}
        </p>

        {isLoading ? (
          <div className={styles.templateLoading}>
            <div className={styles.spinner} />
            <span>加载模板中...</span>
          </div>
        ) : (
          <div className={styles.templateGrid} role="radiogroup" aria-label="项目模板">
            {filtered.map((tmpl, index) => (
              <motion.button
                key={tmpl.id}
                type="button"
                role="radio"
                aria-checked={selectedTemplateId === tmpl.id}
                data-testid="onboarding-template-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.06 }}
                className={`${styles.templateCard} ${selectedTemplateId === tmpl.id ? styles.templateCardSelected : ''}`}
                onClick={() => handleSelect(tmpl.id)}
              >
                <h3 className={styles.templateName}>{tmpl.name}</h3>
                <p className={styles.templateDesc}>{tmpl.description}</p>
                <div className={styles.templateTags}>
                  {scenario && (
                    <span className={styles.templateTag}>
                      {scenario === 'new-feature' ? '✨ 新功能' : '📦 其他'}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={onPrev} data-testid="onboarding-step-4-prev-btn">
            ← 上一步
          </button>
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            data-testid="onboarding-step-4-next-btn"
          >
            {selectedTemplateId ? '开始使用 🎯' : '跳过，直接开始'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PreviewStep;
