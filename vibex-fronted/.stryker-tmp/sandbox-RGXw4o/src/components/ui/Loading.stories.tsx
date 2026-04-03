// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Loading } from './Loading';

const meta: Meta<typeof Loading> = {
  title: 'UI/Loading',
  component: Loading,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['spinner', 'dots', 'pulse'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {
  args: {
    text: 'Loading...',
  },
};

export const Spinner: Story = {
  args: {
    variant: 'spinner',
    text: 'Loading content...',
  },
};

export const Dots: Story = {
  args: {
    variant: 'dots',
    text: 'Loading',
  },
};

export const Pulse: Story = {
  args: {
    variant: 'pulse',
    text: 'Please wait',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    text: 'Small loading',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    text: 'Large loading',
  },
};

export const FullScreen: Story = {
  args: {
    fullScreen: true,
    text: 'Loading full screen',
  },
};
