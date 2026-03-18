/**
 * ComponentSelectionStep - Epic 5: Component Selection
 * 
 * Select UI components, preview effect, then project creation
 */

'use client';

import { useState } from 'react';
import { useMachine } from '@xstate/react';
import { flowMachine, FlowEvent } from '../flow-container/flowMachine';
import styles from './ComponentSelectionStep.module.css';

const COMPONENT_CATEGORIES = [
  {
    category: 'Navigation',
    components: [
      { id: 'navbar', name: 'Navbar', description: 'Top navigation bar with logo and links' },
      { id: 'sidebar', name: 'Sidebar', description: 'Collapsible sidebar with menu items' },
      { id: 'tabs', name: 'Tabs', description: 'Tab navigation for content sections' },
      { id: 'breadcrumb', name: 'Breadcrumb', description: 'Page hierarchy navigation' },
    ],
  },
  {
    category: 'Forms',
    components: [
      { id: 'input', name: 'Input Field', description: 'Text input with validation states' },
      { id: 'select', name: 'Select', description: 'Dropdown select with search' },
      { id: 'checkbox', name: 'Checkbox', description: 'Checkbox with label' },
      { id: 'radio', name: 'Radio Group', description: 'Radio button group' },
      { id: 'form', name: 'Form', description: 'Form container with validation' },
    ],
  },
  {
    category: 'Data Display',
    components: [
      { id: 'table', name: 'Table', description: 'Data table with sorting' },
      { id: 'card', name: 'Card', description: 'Content card container' },
      { id: 'list', name: 'List', description: 'List view component' },
      { id: 'modal', name: 'Modal', description: 'Dialog modal component' },
    ],
  },
  {
    category: 'Feedback',
    components: [
      { id: 'button', name: 'Button', description: 'Primary and secondary buttons' },
      { id: 'alert', name: 'Alert', description: 'Notification alert banners' },
      { id: 'tooltip', name: 'Tooltip', description: 'Hover tooltip component' },
      { id: 'progress', name: 'Progress', description: 'Progress bar and indicators' },
    ],
  },
];

export function ComponentSelectionStep() {
  const [state, send] = useMachine(flowMachine);
  const [selectedComponents, setSelectedComponents] = useState<string[]>(
    state.context.selectedComponents.map(c => c.id)
  );

  const toggleComponent = (id: string) => {
    const newSelected = selectedComponents.includes(id)
      ? selectedComponents.filter(c => c !== id)
      : [...selectedComponents, id];
    
    setSelectedComponents(newSelected);
    send({ type: 'TOGGLE_COMPONENT', id } satisfies FlowEvent);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Select Components</h2>
        <p className={styles.subtitle}>
          Choose the UI components you need for your project.
        </p>
      </div>

      <div className={styles.categories}>
        {COMPONENT_CATEGORIES.map(({ category, components }) => (
          <div key={category} className={styles.category}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.componentGrid}>
              {components.map((comp) => (
                <label key={comp.id} className={styles.componentCard}>
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(comp.id)}
                    onChange={() => toggleComponent(comp.id)}
                  />
                  <div className={styles.cardContent}>
                    <span className={styles.cardIcon}>
                      {selectedComponents.includes(comp.id) ? '✓' : '○'}
                    </span>
                    <span className={styles.cardName}>{comp.name}</span>
                    <span className={styles.cardDesc}>{comp.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <span className={styles.summaryCount}>
          {selectedComponents.length} components selected
        </span>
      </div>
    </div>
  );
}
