import type { Meta, StoryObj } from '@storybook/react';
import PresenceLayer from '../PresenceLayer';

const meta: Meta<typeof PresenceLayer> = {
  title: 'Canvas/PresenceLayer',
  component: PresenceLayer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof PresenceLayer>;

export const Default: Story = {
  args: {},
};

export const Multiple: Story = {
  args: {},
};
