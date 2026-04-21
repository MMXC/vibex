import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

function CheckboxTest() {
  return (
    <input type="checkbox" data-testid="cb" checked={false} onChange={() => console.log('onChange called')} />
  );
}

it('fireEvent.change on checkbox', async () => {
  render(<CheckboxTest />);
  const cb = screen.getByTestId('cb');
  fireEvent.change(cb, { target: { checked: true } });
});

it('userEvent.click on checkbox', async () => {
  const user = userEvent.setup();
  render(<CheckboxTest />);
  const cb = screen.getByTestId('cb');
  await user.click(cb);
});
