'use client';

import { DesignStepLayout } from '@/components/design/DesignStepLayout';
import { useState } from 'react';

/**
 * Step 3: Domain Model Page
 * 领域模型分析
 * 
 * F1.1: StepNavigator 集成
 */

export default function DomainModelPage() {
  const [input, setInput] = useState('');

  return (
    <DesignStepLayout currentStep={3}>
      <div className="domain-model-step">
        <h1>领域模型</h1>
        <p className="step-subtitle">识别核心实体、值对象和聚合根</p>

        <div className="input-section">
          <label htmlFor="model-input">描述你的领域实体</label>
          <textarea
            id="model-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：订单(Order)、商品(Product)、用户(User) 等..."
            rows={5}
          />
        </div>

        <style jsx>{`
          .domain-model-step { max-width: 800px; margin: 0 auto; }
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
