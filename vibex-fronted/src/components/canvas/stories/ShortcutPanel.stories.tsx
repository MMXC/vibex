import type { Meta, StoryObj } from '@storybook/react';
import { ShortcutPanel } from '../ShortcutPanel';

const meta: Meta<typeof ShortcutPanel> = {
  title: 'Canvas/ShortcutPanel',
  component: ShortcutPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof ShortcutPanel>;

export const Open: Story = {
  args: { isOpen: true },
};

export const Closed: Story = {
  args: { isOpen: false },
};
