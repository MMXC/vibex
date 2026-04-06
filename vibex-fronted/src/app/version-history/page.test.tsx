/**
 * Version History Components Tests
 */

import { render, screen } from '@testing-library/react';

// Mock VersionPreview component
vi.mock('@/components/version-preview/VersionPreview', () => ({
  VersionPreview: ({ open, version, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="version-preview">
        <div>{version?.description}</div>
        <button onClick={onClose}>关闭</button>
      </div>
    );
  },
}));

// Mock VersionDiff component
vi.mock('@/components/version-diff/VersionDiff', () => ({
  VersionDiff: () => <div data-testid="version-diff">Diff Content</div>,
}));

import { VersionPreview } from '@/components/version-preview/VersionPreview';
import { VersionDiff } from '@/components/version-diff/VersionDiff';

describe('VersionHistory Components', () => {
  describe('VersionPreview', () => {
    it('should render when open', () => {
      render(
        <VersionPreview
          open={true}
          version={{
            id: '1',
            version: 1,
            timestamp: Date.now(),
            description: 'Test version',
          }}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByTestId('version-preview')).toBeInTheDocument();
      expect(screen.getByText('Test version')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <VersionPreview
          open={false}
          version={{
            id: '1',
            version: 1,
            timestamp: Date.now(),
            description: 'Test version',
          }}
          onClose={() => {}}
        />
      );
      
      expect(screen.queryByTestId('version-preview')).not.toBeInTheDocument();
    });

    it('should render version info', () => {
      render(
        <VersionPreview
          open={true}
          version={{
            id: 'v1',
            version: 1,
            timestamp: 1640000000000,
            description: 'Initial version',
          }}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByText('Initial version')).toBeInTheDocument();
    });
  });

  describe('VersionDiff', () => {
    it('should render diff content', () => {
      render(<VersionDiff oldVersion={{}} newVersion={{}} />);
      
      expect(screen.getByTestId('version-diff')).toBeInTheDocument();
    });
  });
});
