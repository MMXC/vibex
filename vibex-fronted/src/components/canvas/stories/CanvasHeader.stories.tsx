import type { Meta, StoryObj } from '@storybook/react';
import { CanvasHeader } from '../CanvasHeader';

const meta: Meta<typeof CanvasHeader> = {
  title: 'Canvas/CanvasHeader',
  component: CanvasHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof CanvasHeader>;

export const Default: Story = {
  args: { mode: 'edit' },
};

export const ProjectMode: Story = {
  args: { mode: 'project' },
};
