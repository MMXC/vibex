// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: 200,
    height: 20,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circle',
    width: 60,
    height: 60,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rect',
    width: 200,
    height: 100,
  },
};
