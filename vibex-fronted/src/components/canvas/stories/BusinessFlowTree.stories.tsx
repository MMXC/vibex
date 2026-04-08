import type { Meta, StoryObj } from '@storybook/react';
import { BusinessFlowTree } from '../BusinessFlowTree';

const meta: Meta<typeof BusinessFlowTree> = {
  title: 'Canvas/BusinessFlowTree',
  component: BusinessFlowTree,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BusinessFlowTree>;

export const Default: Story = {
  args: {
    canvasId: 'canvas-1',
    readonly: false,
  },
};
