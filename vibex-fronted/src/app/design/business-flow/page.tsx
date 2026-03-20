'use client';

import { DesignStepLayout } from '@/components/design/DesignStepLayout';
import { useState } from 'react';

/**
 * Step 4: Business Flow Page
 * 业务流程设计
 * 
 * F1.1: StepNavigator 集成
 */

export default function BusinessFlowPage() {
  const [input, setInput] = useState('');

  return (
    <DesignStepLayout currentStep={4}>
      <div className="business-flow-step">
        <h1>业务流程</h1>
        <p className="step-subtitle">设计核心业务场景和用户交互流程</p>

        <div className="input-section">
          <label htmlFor="flow-input">描述业务流程</label>
          <textarea
            id="flow-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：用户下单流程、支付流程..."
            rows={5}
          />
        </div>

        <style jsx>{`
          .business-flow-step { max-width: 800px; margin: 0 auto; }
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
