import type { Meta, StoryObj } from '@storybook/react';
import { BoundedContextTree } from '../BoundedContextTree';

const meta: Meta<typeof BoundedContextTree> = {
  title: 'Canvas/BoundedContextTree',
  component: BoundedContextTree,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BoundedContextTree>;

export const Default: Story = {
  args: {
    canvasId: 'canvas-1',
    readonly: false,
  },
};
