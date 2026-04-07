/**
 * MSW Mock Handlers
 * API Mock 服务器 - 用于开发调试和测试
 *
 * Endpoints:
 * - Auth: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
 * - Projects: /api/projects, /api/projects/:id
 * - Messages: /api/messages
 * - Requirements: /api/requirements
 * - Agents: /api/agents
 * - Pages: /api/pages
 */
// @ts-nocheck


import { http, HttpResponse, delay } from 'msw';

// ==================== Types ====================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'user' | 'guest';
}

interface AuthResponse {
  token: string;
  user: User;
}

interface Project {
  id: string;
  name: string;
  userId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  projectId: string;
  createdAt: string;
}

interface Requirement {
  id: string;
  userId: string;
  content: string;
  status: 'draft' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  prompt: string;
  model?: string;
  userId: string;
  createdAt: string;
}

interface Page {
  id: string;
  name: string;
  projectId: string;
  content?: string;
  createdAt: string;
}

// ==================== Mock Data ====================

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: undefined,
  role: 'user',
};

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'My First Project',
    userId: 'user-1',
    description: 'A test project',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Second Project',
    userId: 'user-1',
    description: 'Another project',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, I want to build a web app',
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockRequirements: Requirement[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    content: 'Build a web application for managing tasks',
    status: 'completed',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Analysis Agent',
    prompt: 'You are an analysis agent',
    model: 'gpt-4',
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockPages: Page[] = [
  {
    id: 'page-1',
    name: 'Home',
    projectId: 'proj-1',
    content: '<h1>Welcome</h1>',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// ==================== Handlers ====================

export const handlers = [
  // ==================== Auth ====================

  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { email: string; password: string };

    if (body.email && body.password) {
      return HttpResponse.json<AuthResponse>({
        token: 'mock-token-' + Date.now(),
        user: mockUser,
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    if (body.email && body.password) {
      return HttpResponse.json<AuthResponse>({
        token: 'mock-token-' + Date.now(),
        user: { ...mockUser, name: body.name, email: body.email },
      });
    }

    return HttpResponse.json({ error: 'Invalid data' }, { status: 400 });
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', async () => {
    await delay(100);
    return HttpResponse.json({ user: mockUser });
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(100);
    return HttpResponse.json({ success: true });
  }),

  // ==================== Projects ====================

  // GET /api/projects
  http.get('/api/projects', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const projects = userId
      ? mockProjects.filter((p) => p.userId === userId)
      : mockProjects;

    return HttpResponse.json({ projects });
  }),

  // POST /api/projects
  http.post('/api/projects', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Project>;

    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: body.name || 'New Project',
      userId: body.userId || 'user-1',
      description: body.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ project: newProject });
  }),

  // GET /api/projects/:id
  http.get('/api/projects/:id', async ({ params }) => {
    await delay(100);
    const project = mockProjects.find((p) => p.id === params.id);

    if (project) {
      return HttpResponse.json({ project });
    }

    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  // PUT /api/projects/:id
  http.put('/api/projects/:id', async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Project>;
    const index = mockProjects.findIndex((p) => p.id === params.id);

    if (index >= 0) {
      const updated = {
        ...mockProjects[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json({ project: updated });
    }

    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  // DELETE /api/projects/:id
  http.delete('/api/projects/:id', async ({ params }) => {
    await delay(200);
    const index = mockProjects.findIndex((p) => p.id === params.id);

    if (index >= 0) {
      return HttpResponse.json({ success: true });
    }

    return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  }),

  // ==================== Messages ====================

  // GET /api/messages
  http.get('/api/messages', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    const messages = projectId
      ? mockMessages.filter((m) => m.projectId === projectId)
      : mockMessages;

    return HttpResponse.json({ messages });
  }),

  // POST /api/messages
  http.post('/api/messages', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Message>;

    const newMessage: Message = {
      id: 'msg-' + Date.now(),
      role: body.role || 'user',
      content: body.content || '',
      projectId: body.projectId || 'proj-1',
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newMessage);
  }),

  // DELETE /api/messages/:id
  http.delete('/api/messages/:id', async ({ params }) => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  // ==================== Requirements ====================

  // GET /api/requirements
  http.get('/api/requirements', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const requirements = userId
      ? mockRequirements.filter((r) => r.userId === userId)
      : mockRequirements;

    return HttpResponse.json({ requirements });
  }),

  // POST /api/requirements
  http.post('/api/requirements', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Requirement>;

    const newRequirement: Requirement = {
      id: 'req-' + Date.now(),
      userId: body.userId || 'user-1',
      content: body.content || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ requirement: newRequirement });
  }),

  // ==================== Agents ====================

  // GET /api/agents
  http.get('/api/agents', async () => {
    await delay(200);
    return HttpResponse.json({ agents: mockAgents });
  }),

  // POST /api/agents
  http.post('/api/agents', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Agent>;

    const newAgent: Agent = {
      id: 'agent-' + Date.now(),
      name: body.name || 'New Agent',
      prompt: body.prompt || '',
      model: body.model,
      userId: body.userId || 'user-1',
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ agent: newAgent });
  }),

  // ==================== Pages ====================

  // GET /api/pages
  http.get('/api/pages', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    const pages = projectId
      ? mockPages.filter((p) => p.projectId === projectId)
      : mockPages;

    return HttpResponse.json({ pages });
  }),

  // POST /api/pages
  http.post('/api/pages', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Page>;

    const newPage: Page = {
      id: 'page-' + Date.now(),
      name: body.name || 'New Page',
      projectId: body.projectId || 'proj-1',
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ page: newPage });
  }),
];
