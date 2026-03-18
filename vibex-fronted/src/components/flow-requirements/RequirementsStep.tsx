/**
 * RequirementsStep - Epic 2: Requirements Input
 * 
 * Requirements input with text area, examples, submit, and persistence
 */

'use client';

import { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { flowMachine } from '../flow-container/flowMachine';
import styles from './RequirementsStep.module.css';

const EXAMPLE_PROMPTS = [
  'Build an e-commerce platform with user auth, product catalog, shopping cart, and checkout',
  'Create a task management app with boards, lists, cards, due dates, and team collaboration',
  'Develop a real-time chat application with channels, direct messages, and file sharing',
  'Build a blog platform with posts, categories, comments, and admin dashboard',
];

export function RequirementsStep() {
  const [state, send] = useMachine(flowMachine);
  const [requirements, setRequirements] = useState(state.context.requirements);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load from context
    setRequirements(state.context.requirements);
  }, [state.context.requirements]);

  const handleExampleClick = (example: string) => {
    setRequirements(example);
  };

  const handleSubmit = async () => {
    if (!requirements.trim()) return;
    
    setIsSubmitting(true);
    
    // Send to state machine
    send({ type: 'SET_REQUIREMENTS', requirements } as any);
    
    // Auto-analyze examples (mock AI suggestion)
    const detectedExamples = EXAMPLE_PROMPTS.filter(
      ex => ex.split(' ').some(word => requirements.toLowerCase().includes(word.toLowerCase()))
    );
    
    if (detectedExamples.length > 0) {
      send({ type: 'SET_EXAMPLES', examples: detectedExamples.slice(0, 3) } as any);
    }
    
    // Save to persistence
    send({ type: 'SAVE' } as any);
    
    setIsSubmitting(false);
    
    // Auto-advance to next step
    send({ type: 'GO_NEXT' } as any);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>What do you want to build?</h2>
        <p className={styles.subtitle}>
          Describe your project requirements in natural language. 
          Our AI will help structure and refine them.
        </p>
      </div>

      <div className={styles.inputSection}>
        <textarea
          className={styles.textarea}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="E.g., Build a task management app with real-time collaboration, drag-and-drop boards, and team workspaces..."
          rows={6}
        />
        
        <div className={styles.charCount}>
          {requirements.length} / 2000 characters
        </div>
      </div>

      <div className={styles.examples}>
        <h3 className={styles.examplesTitle}>Or start with an example:</h3>
        <div className={styles.examplesGrid}>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              className={styles.exampleCard}
              onClick={() => handleExampleClick(example)}
            >
              {example.length > 80 ? example.slice(0, 80) + '...' : example}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!requirements.trim() || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
