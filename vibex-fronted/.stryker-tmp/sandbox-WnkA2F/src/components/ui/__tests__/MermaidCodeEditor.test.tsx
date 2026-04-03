/**
 * Mermaid Code Editor Tests
 */
// @ts-nocheck


import { render } from '@testing-library/react';
import { MermaidCodeEditor } from '../MermaidCodeEditor';

describe('MermaidCodeEditor', () => {
  it('should render', () => {
    const { container } = render(<MermaidCodeEditor value="" onChange={() => {}} />);
    expect(container).toBeInTheDocument();
  });
});
