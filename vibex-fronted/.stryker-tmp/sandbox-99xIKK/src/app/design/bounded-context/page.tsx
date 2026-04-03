// @ts-nocheck
'use client';

import { DesignStepLayout } from '@/components/design/DesignStepLayout';
import { useState } from 'react';
import { useDDDStateRestore } from '@/hooks/ddd/useDDDStateRestore';

/**
 * Step 2: Bounded Context Page
 * 限界上下文分析
 * 
 * F1.1: StepNavigator 集成（通过 DesignStepLayout）
 * F1.3: 已完成步骤可点击跳转
 */

export default function BoundedContextPage() {
  const [input, setInput] = useState('');
  // F2.3: Restore DDD state from sessionStorage on page mount
  useDDDStateRestore();

  return (
    <DesignStepLayout currentStep={2}>
      <div className="bounded-context-step">
        <h1>限界上下文</h1>
        <p className="step-subtitle">识别业务边界，划分领域职责</p>

        {/* 输入区域 */}
        <div className="input-section">
          <label htmlFor="context-input">描述你的业务领域</label>
          <textarea
            id="context-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：电商平台包含商品管理、订单处理、支付、物流等核心业务..."
            rows={5}
          />
        </div>

        <style jsx>{`
          .bounded-context-step {
            max-width: 800px;
            margin: 0 auto;
          }
          .step-subtitle {
            color: #666;
            margin-bottom: 2rem;
          }
          .input-section {
            margin-top: 2rem;
          }
          .input-section label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .input-section textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            resize: vertical;
          }
          .input-section textarea:focus {
            outline: none;
            border-color: #1976d2;
          }
        `}</style>
      </div>
    </DesignStepLayout>
  );
}
