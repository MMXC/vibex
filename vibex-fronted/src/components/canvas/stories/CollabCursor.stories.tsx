import type { Meta, StoryObj } from '@storybook/react';
import { CollabCursor } from '../CollabCursor';

const meta: Meta<typeof CollabCursor> = {
  title: 'Canvas/CollabCursor',
  component: CollabCursor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof CollabCursor>;

export const Active: Story = {
  args: { userId: 'u1', userName: 'Alice', x: 100, y: 200, color: '#6366f1', status: 'active' },
};

export const Idle: Story = {
  args: { ...Active.args, status: 'idle' },
};
