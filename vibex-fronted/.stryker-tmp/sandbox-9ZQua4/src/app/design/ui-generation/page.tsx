// @ts-nocheck
'use client';

import { DesignStepLayout } from '@/components/design/DesignStepLayout';
import { useState } from 'react';

/**
 * Step 5: UI Generation Page
 * UI 原型生成
 * 
 * F1.1: StepNavigator 集成
 */

export default function UIGenerationPage() {
  const [input, setInput] = useState('');

  return (
    <DesignStepLayout currentStep={5}>
      <div className="ui-generation-step">
        <h1>UI生成</h1>
        <p className="step-subtitle">基于 DDD 分析结果生成 UI 原型和组件代码</p>

        <div className="input-section">
          <label htmlFor="ui-input">描述需要的页面</label>
          <textarea
            id="ui-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：商品列表页面、用户注册表单..."
            rows={5}
          />
        </div>

        <style jsx>{`
          .ui-generation-step { max-width: 800px; margin: 0 auto; }
          .step-subtitle { color: #666; margin-bottom: 2rem; }
          .input-section { margin-top: 2rem; }
          .input-section label { display: block; font-weight: 500; margin-bottom: 0.5rem; }
          .input-section textarea {
            width: 100%; padding: 0.75rem;
            border: 1px solid #ddd; border-radius: 8px;
            font-size: 1rem; resize: vertical;
          }
          .input-section textarea:focus { outline: none; border-color: #1976d2; }
        `}</style>
      </div>
    </DesignStepLayout>
  );
}
