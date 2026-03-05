import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ],
    placeholder: 'Select an option',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Country',
    options: [
      { value: 'cn', label: 'China' },
      { value: 'us', label: 'United States' },
      { value: 'jp', label: 'Japan' },
    ],
    placeholder: 'Select your country',
  },
};
