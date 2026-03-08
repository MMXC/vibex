const mockInterceptors = {
  request: {
    use: jest.fn(() => ({ eject: jest.fn() })),
  },
  response: {
    use: jest.fn(() => ({ eject: jest.fn() })),
  },
};

const mockAxiosInstance = {
  ...mockInterceptors,
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export default {
  create: jest.fn(() => mockAxiosInstance),
  mockAxiosInstance,
  mockInterceptors,
};
