import type { Meta, StoryObj } from '@storybook/react';
import { TreeNode } from '../TreeNode';

const meta: Meta<typeof TreeNode> = {
  title: 'Canvas/TreeNode',
  component: TreeNode,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof TreeNode>;

export const Default: Story = {
  args: {
    node: { id: 'n1', label: '用户管理', type: 'component' },
    isActive: true,
    isSelected: false,
    isReadonly: false,
  },
};

export const Hover: Story = {
  args: { ...Default.args, isActive: false },
};

export const Selected: Story = {
  args: { ...Default.args, isSelected: true },
};

export const Editing: Story = {
  args: { ...Default.args, isActive: true },
};
