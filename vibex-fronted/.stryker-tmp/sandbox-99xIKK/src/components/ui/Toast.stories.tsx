// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  args: {
    type: 'info',
    message: 'This is an informational toast',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    message: 'Action completed successfully',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    message: 'Please review your input',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    message: 'An error occurred',
  },
};
