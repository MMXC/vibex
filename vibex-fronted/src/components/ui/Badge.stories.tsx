import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
  },
};
