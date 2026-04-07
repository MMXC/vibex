/**
 * GitHub Import Service Tests
 */
// @ts-nocheck


import {
  parseGitHubUrl,
  generateRequirementFromRepo,
  GitHubRepoInfo,
  PackageJsonInfo,
} from '../github-import';

// Note: We only test pure functions here since fetch-based functions
// require complex mocking that causes test flakiness

describe('GitHub Import Service', () => {
  describe('parseGitHubUrl', () => {
    it('should parse full GitHub URL', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL with .git extension', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse short owner/repo format', () => {
      const result = parseGitHubUrl('owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse github.com/owner/repo format', () => {
      const result = parseGitHubUrl('github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for invalid URL', () => {
      const result = parseGitHubUrl('invalid-url');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseGitHubUrl('');
      expect(result).toBeNull();
    });

    it('should handle URL with special characters in repo name', () => {
      const result = parseGitHubUrl('https://github.com/owner/my-repo-123');
      expect(result).toEqual({ owner: 'owner', repo: 'my-repo-123' });
    });
  });

  describe('generateRequirementFromRepo', () => {
    const mockRepoInfo: GitHubRepoInfo = {
      name: 'test-repo',
      fullName: 'owner/test-repo',
      description: 'A test repository',
      owner: 'owner',
      ownerAvatar: 'https://avatar.com/owner.png',
      stars: 100,
      forks: 20,
      language: 'TypeScript',
      license: 'MIT',
      defaultBranch: 'main',
      createdAt: '2023-01-01',
      updatedAt: '2023-12-01',
    };

    it('should generate requirement with repo info', () => {
      const result = generateRequirementFromRepo(mockRepoInfo);
      expect(result).toContain('导入 GitHub 仓库: owner/test-repo');
      expect(result).toContain('## 项目描述');
      expect(result).toContain('A test repository');
    });

    it('should include package.json dependencies', () => {
      const mockPackageJson: PackageJsonInfo = {
        name: 'test-package',
        version: '1.0.0',
        description: 'A test package',
        dependencies: {
          react: '^18.0.0',
          typescript: '^5.0.0',
        },
        devDependencies: {
          jest: '^29.0.0',
        },
        scripts: {
          test: 'jest',
        },
      };

      const result = generateRequirementFromRepo(mockRepoInfo, mockPackageJson);
      expect(result).toContain('## 技术栈');
      expect(result).toContain('react: ^18.0.0');
      expect(result).toContain('typescript: ^5.0.0');
      expect(result).toContain('jest: ^29.0.0');
    });

    it('should include README summary', () => {
      const readme = 'This is a test README with some content.';
      const result = generateRequirementFromRepo(mockRepoInfo, null, readme);
      expect(result).toContain('## README');
      expect(result).toContain('This is a test README');
    });

    it('should truncate long README', () => {
      const longReadme = 'a'.repeat(2000);
      const result = generateRequirementFromRepo(mockRepoInfo, null, longReadme);
      expect(result).toContain('...');
    });

    it('should handle missing description', () => {
      const repoWithoutDesc: GitHubRepoInfo = {
        ...mockRepoInfo,
        description: null,
      };
      const result = generateRequirementFromRepo(repoWithoutDesc);
      expect(result).not.toContain('## 项目描述');
    });

    it('should handle empty README', () => {
      const result = generateRequirementFromRepo(mockRepoInfo, null, '');
      expect(result).not.toContain('## README');
    });

    it('should handle package.json with only dependencies', () => {
      const mockPackageJson: PackageJsonInfo = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
        },
      };

      const result = generateRequirementFromRepo(mockRepoInfo, mockPackageJson);
      expect(result).toContain('react: ^18.0.0');
      expect(result).toContain('### 生产依赖');
    });

    it('should handle package.json with only devDependencies', () => {
      const mockPackageJson: PackageJsonInfo = {
        name: 'test-package',
        version: '1.0.0',
        devDependencies: {
          jest: '^29.0.0',
        },
      };

      const result = generateRequirementFromRepo(mockRepoInfo, mockPackageJson);
      expect(result).toContain('jest: ^29.0.0');
      expect(result).toContain('### 开发依赖');
    });
  });
});