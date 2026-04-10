import type { Meta, StoryObj } from '@storybook/react';
import { ConflictBubble } from '../ConflictBubble';

const meta: Meta<typeof ConflictBubble> = {
  title: 'Canvas/ConflictBubble',
  component: ConflictBubble,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ConflictBubble>;

export const Default: Story = {
  args: {},
};

export const Resolved: Story = {
  args: {},
};
