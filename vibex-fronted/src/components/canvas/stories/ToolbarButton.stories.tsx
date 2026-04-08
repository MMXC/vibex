import type { Meta, StoryObj } from '@storybook/react';
import { ToolbarButton } from '../ToolbarButton';
import { Undo2, Redo2 } from 'lucide-react';

const meta: Meta<typeof ToolbarButton> = {
  title: 'Canvas/ToolbarButton',
  component: ToolbarButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ToolbarButton>;

export const Default: Story = {
  args: { icon: Undo2, label: '撤销', onClick: () => {} },
};

export const Active: Story = {
  args: { ...Default.args, isActive: true },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const Loading: Story = {
  args: { ...Default.args, isLoading: true },
};
