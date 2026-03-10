/**
 * API Modules Tests - Project
 */

import { projectApi } from './project';

describe('projectApi', () => {
  it('should have createProject method', () => {
    expect(typeof projectApi.createProject).toBe('function');
  });

  it('should have getProject method', () => {
    expect(typeof projectApi.getProject).toBe('function');
  });

  it('should have listProjects method', () => {
    expect(typeof projectApi.listProjects).toBe('function');
  });

  it('should have updateProject method', () => {
    expect(typeof projectApi.updateProject).toBe('function');
  });

  it('should have deleteProject method', () => {
    expect(typeof projectApi.deleteProject).toBe('function');
  });
});
