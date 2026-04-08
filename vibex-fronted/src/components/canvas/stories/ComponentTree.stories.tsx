import type { Meta, StoryObj } from '@storybook/react';
import { ComponentTree } from '../ComponentTree';

const meta: Meta<typeof ComponentTree> = {
  title: 'Canvas/ComponentTree',
  component: ComponentTree,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof ComponentTree>;

export const Default: Story = {
  args: {
    canvasId: 'canvas-1',
    readonly: false,
  },
};
