import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Modal Title',
    children: 'This is the modal content. You can put any content here.',
    onClose: () => {},
  },
};

export const WithFooter: Story = {
  args: {
    open: true,
    title: 'Confirmation',
    children: 'Are you sure you want to proceed?',
    onClose: () => {},
  },
};
