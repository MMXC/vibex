/**
 * Prototype Preview Tests
 */

import { render } from '@testing-library/react';
import { PrototypePreview } from '../prototype-preview/PrototypePreview';

describe('PrototypePreview', () => {
  it('should render', () => {
    const { container } = render(<PrototypePreview pages={[]} />);
    expect(container).toBeInTheDocument();
  });
});
