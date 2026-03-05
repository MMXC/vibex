import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
};
