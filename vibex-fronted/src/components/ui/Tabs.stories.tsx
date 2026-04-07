import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';
import { useState } from 'react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    const [activeIndex, setActiveIndex] = useState(0);
    return (
      <Tabs
        activeIndex={activeIndex}
        onChange={setActiveIndex}
        items={[
          { key: 'tab1', label: 'Tab 1', content: 'Content for Tab 1' },
          { key: 'tab2', label: 'Tab 2', content: 'Content for Tab 2' },
          { key: 'tab3', label: 'Tab 3', content: 'Content for Tab 3' },
        ]}
      />
    );
  },
};

export const TwoTabs: Story = {
  render: () => {
    const [activeIndex, setActiveIndex] = useState(0);
    return (
      <Tabs
        activeIndex={activeIndex}
        onChange={setActiveIndex}
        items={[
          { key: 'tab1', label: 'First', content: 'First tab content' },
          { key: 'tab2', label: 'Second', content: 'Second tab content' },
        ]}
      />
    );
  },
};
