/**
 * API Service Index Tests
 */

describe('API Service', () => {
  const mockApiService = {
    project: {
      createProject: vi.fn(),
      getProject: vi.fn(),
      getProjects: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    },
    requirement: {
      createRequirement: vi.fn(),
      getRequirement: vi.fn(),
      listRequirements: vi.fn(),
      updateRequirement: vi.fn(),
      deleteRequirement: vi.fn(),
    },
    domain: {
      generateBoundedContext: vi.fn(),
      generateDomainModel: vi.fn(),
    },
    flow: {
      generateFlow: vi.fn(),
      getFlow: vi.fn(),
    },
    prototype: {
      generatePrototype: vi.fn(),
      getPrototype: vi.fn(),
    },
  };

  beforeEach(() => vi.clearAllMocks());

  describe('Project API', () => {
    it('should have project methods', () => {
      expect(mockApiService.project.createProject).toBeDefined();
      expect(mockApiService.project.getProject).toBeDefined();
      expect(mockApiService.project.getProjects).toBeDefined();
      expect(mockApiService.project.updateProject).toBeDefined();
      expect(mockApiService.project.deleteProject).toBeDefined();
    });

    it('should call createProject', async () => {
      await mockApiService.project.createProject({ name: 'Test' });
      expect(mockApiService.project.createProject).toHaveBeenCalled();
    });

    it('should call getProject', async () => {
      await mockApiService.project.getProject('1');
      expect(mockApiService.project.getProject).toHaveBeenCalledWith('1');
    });

    it('should call getProjects', async () => {
      await mockApiService.project.getProjects();
      expect(mockApiService.project.getProjects).toHaveBeenCalled();
    });

    it('should call updateProject', async () => {
      await mockApiService.project.updateProject('1', { name: 'Updated' });
      expect(mockApiService.project.updateProject).toHaveBeenCalledWith('1', { name: 'Updated' });
    });

    it('should call deleteProject', async () => {
      await mockApiService.project.deleteProject('1');
      expect(mockApiService.project.deleteProject).toHaveBeenCalledWith('1');
    });
  });

  describe('Requirement API', () => {
    it('should have requirement methods', () => {
      expect(mockApiService.requirement.createRequirement).toBeDefined();
      expect(mockApiService.requirement.getRequirement).toBeDefined();
      expect(mockApiService.requirement.listRequirements).toBeDefined();
      expect(mockApiService.requirement.updateRequirement).toBeDefined();
      expect(mockApiService.requirement.deleteRequirement).toBeDefined();
    });

    it('should call createRequirement', async () => {
      await mockApiService.requirement.createRequirement({ text: 'test' });
      expect(mockApiService.requirement.createRequirement).toHaveBeenCalled();
    });

    it('should call getRequirement', async () => {
      await mockApiService.requirement.getRequirement('1');
      expect(mockApiService.requirement.getRequirement).toHaveBeenCalledWith('1');
    });

    it('should call listRequirements', async () => {
      await mockApiService.requirement.listRequirements();
      expect(mockApiService.requirement.listRequirements).toHaveBeenCalled();
    });
  });

  describe('Domain API', () => {
    it('should have domain methods', () => {
      expect(mockApiService.domain.generateBoundedContext).toBeDefined();
      expect(mockApiService.domain.generateDomainModel).toBeDefined();
    });

    it('should call generateBoundedContext', async () => {
      await mockApiService.domain.generateBoundedContext({ text: 'test' });
      expect(mockApiService.domain.generateBoundedContext).toHaveBeenCalled();
    });

    it('should call generateDomainModel', async () => {
      await mockApiService.domain.generateDomainModel({});
      expect(mockApiService.domain.generateDomainModel).toHaveBeenCalled();
    });
  });

  describe('Flow API', () => {
    it('should have flow methods', () => {
      expect(mockApiService.flow.generateFlow).toBeDefined();
      expect(mockApiService.flow.getFlow).toBeDefined();
    });

    it('should call generateFlow', async () => {
      await mockApiService.flow.generateFlow({});
      expect(mockApiService.flow.generateFlow).toHaveBeenCalled();
    });
  });

  describe('Prototype API', () => {
    it('should have prototype methods', () => {
      expect(mockApiService.prototype.generatePrototype).toBeDefined();
      expect(mockApiService.prototype.getPrototype).toBeDefined();
    });

    it('should call generatePrototype', async () => {
      await mockApiService.prototype.generatePrototype({});
      expect(mockApiService.prototype.generatePrototype).toHaveBeenCalled();
    });
  });
});
