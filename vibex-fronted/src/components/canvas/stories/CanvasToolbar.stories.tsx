import type { Meta, StoryObj } from '@storybook/react';
import { CanvasToolbar } from '../CanvasToolbar';

const meta: Meta<typeof CanvasToolbar> = {
  title: 'Canvas/CanvasToolbar',
  component: CanvasToolbar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof CanvasToolbar>;

export const Default: Story = {
  args: {
    onUndo: () => {},
    onRedo: () => {},
  },
};

export const Empty: Story = {
  args: { onUndo: () => {}, onRedo: () => {} },
};
