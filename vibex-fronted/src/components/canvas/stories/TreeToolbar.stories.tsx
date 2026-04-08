import type { Meta, StoryObj } from '@storybook/react';
import { TreeToolbar } from '../TreeToolbar';

const meta: Meta<typeof TreeToolbar> = {
  title: 'Canvas/TreeToolbar',
  component: TreeToolbar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof TreeToolbar>;

export const Default: Story = {
  args: {
    onExpandAll: () => {},
    onCollapseAll: () => {},
    onFilter: () => {},
  },
};
