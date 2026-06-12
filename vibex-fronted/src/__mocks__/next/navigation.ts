import { vi } from 'vitest';

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
};

export const useRouter = () => mockRouter;
export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => '/';
export const redirect = vi.fn();
export const notFound = vi.fn();
