/**
 * NavigationStore Tests
 */

import { useNavigationStore } from '../navigationStore';

describe('NavigationStore', () => {
  beforeEach(() => {
    useNavigationStore.getState().setBreadcrumbs([]);
  });

  describe('Initial State', () => {
    it('should have empty breadcrumbs initially', () => {
      expect(useNavigationStore.getState().breadcrumbs).toEqual([]);
    });

    it('should have default global nav items', () => {
      expect(useNavigationStore.getState().globalNavItems.length).toBeGreaterThan(0);
    });

    it('should have default project nav items', () => {
      expect(useNavigationStore.getState().projectNavItems.length).toBeGreaterThan(0);
    });

    it('should have isMobileMenuOpen false initially', () => {
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });

  describe('setBreadcrumbs', () => {
    it('should set breadcrumbs', () => {
      const { setBreadcrumbs } = useNavigationStore.getState();
      const crumbs = [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
      ];
      
      setBreadcrumbs(crumbs);
      
      expect(useNavigationStore.getState().breadcrumbs).toEqual(crumbs);
    });
  });

  describe('setGlobalNav', () => {
    it('should set current global nav', () => {
      const { setGlobalNav } = useNavigationStore.getState();
      
      setGlobalNav('templates');
      
      expect(useNavigationStore.getState().currentGlobalNav).toBe('templates');
    });
  });

  describe('setProjectNav', () => {
    it('should set current project nav', () => {
      const { setProjectNav } = useNavigationStore.getState();
      
      setProjectNav('chat');
      
      expect(useNavigationStore.getState().currentProjectNav).toBe('chat');
    });
  });

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      const { setCurrentProject } = useNavigationStore.getState();
      const project = { id: 'proj-1', name: 'Test Project', role: 'owner' as const };
      
      setCurrentProject(project);
      
      expect(useNavigationStore.getState().currentProject).toEqual(project);
    });

    it('should reset project nav to dashboard when switching projects', () => {
      const { setCurrentProject, setProjectNav } = useNavigationStore.getState();
      setProjectNav('chat');
      
      setCurrentProject({ id: 'proj-1', name: 'Test', role: 'owner' });
      
      expect(useNavigationStore.getState().currentProjectNav).toBe('dashboard');
    });
  });

  describe('toggleMobileMenu', () => {
    it('should toggle mobile menu', () => {
      const { toggleMobileMenu } = useNavigationStore.getState();
      
      toggleMobileMenu();
      
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);
      
      toggleMobileMenu();
      
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });

  describe('closeMobileMenu', () => {
    it('should close mobile menu', () => {
      const { toggleMobileMenu, closeMobileMenu } = useNavigationStore.getState();
      toggleMobileMenu();
      
      closeMobileMenu();
      
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });
});
