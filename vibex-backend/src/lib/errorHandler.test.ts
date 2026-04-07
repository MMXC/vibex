import { errorHandler, asyncHandler, notFoundHandler, successResponse, paginatedResponse, AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from './errorHandler'

// Mock Hono context
interface MockResponse {
  headers: {
    get: jest.Mock;
    set: jest.Mock;
  };
  status: number;
}
interface MockContext {
  req: {
    path: string;
    method: string;
  };
  res: MockResponse;
  text: jest.Mock;
  json: jest.Mock;
}
const createMockContext = (path = '/test', method = 'GET'): MockContext => ({
  req: {
    path,
    method,
  },
  res: {
    headers: {
      get: jest.fn(),
      set: jest.fn(),
    },
    status: 200,
  },
  text: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.name).toBe('AppError')
    })

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { details: 'test' })
      expect(error.message).toBe('Custom error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.details).toEqual({ details: 'test' })
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual({ field: 'email' })
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError('User not found')
      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('NotFoundError')
    })

    it('should use default message when not provided', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with 401 status', () => {
      const error = new UnauthorizedError('Please login')
      expect(error.message).toBe('Please login')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.name).toBe('UnauthorizedError')
    })
  })

  describe('ForbiddenError', () => {
    it('should create forbidden error with 403 status', () => {
      const error = new ForbiddenError('Access denied')
      expect(error.message).toBe('Access denied')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.name).toBe('ForbiddenError')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error with 409 status', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.name).toBe('ConflictError')
    })
  })
})

describe('errorHandler middleware', () => {
  let mockContext: MockContext

  beforeEach(() => {
    mockContext = createMockContext('/api/test', 'GET')
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle AppError and return correct response', async () => {
    const error = new AppError('Internal error', 500, 'INTERNAL_ERROR')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('INTERNAL_ERROR')
    expect(response.error.message).toBe('Internal error')
    expect(response.timestamp).toBeDefined()
    expect(response.path).toBe('/api/test')
  })

  it('should handle ValidationError correctly', async () => {
    const error = new ValidationError('Invalid field', { field: 'name' })
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('VALIDATION_ERROR')
    expect(response.error.details).toEqual({ field: 'name' })
  })

  it('should handle NotFoundError correctly', async () => {
    const error = new NotFoundError('User not found')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('NOT_FOUND')
    expect(response.error.message).toBe('User not found')
  })

  it('should handle UnauthorizedError correctly', async () => {
    const error = new UnauthorizedError()
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('UNAUTHORIZED')
    expect(response.error.message).toBe('Unauthorized')
  })

  it('should handle ForbiddenError correctly', async () => {
    const error = new ForbiddenError('No permission')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('FORBIDDEN')
    expect(response.error.message).toBe('No permission')
  })

  it('should handle ConflictError correctly', async () => {
    const error = new ConflictError('Already exists')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('CONFLICT')
  })

  it('should handle generic Error with default values', async () => {
    const error = new Error('Something went wrong')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.code).toBe('INTERNAL_ERROR')
    expect(response.error.message).toBe('Something went wrong')
  })

  it('should include stack trace in non-production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = new Error('Test error')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.stack).toBeDefined()

    process.env.NODE_ENV = originalEnv
  })

  it('should not include stack trace in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    const error = new Error('Test error')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.stack).toBeUndefined()

    process.env.NODE_ENV = originalEnv
  })

  // Error Classification Tests
  describe('Error Classification', () => {
    it('should classify 4xx errors as client errors', async () => {
      const error = new ValidationError('Bad request')
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('VALIDATION_ERROR')
      expect(mockContext.text).toHaveBeenCalledWith(
        expect.any(String),
        400
      )
    })

    it('should classify 5xx errors as server errors', async () => {
      const error = new AppError('Server error', 500)
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      expect(mockContext.text).toHaveBeenCalledWith(
        expect.any(String),
        500
      )
    })

    it('should handle network errors gracefully', async () => {
      const error = new Error('ECONNREFUSED')
      ;(error as Error & { code?: string }).code = 'ECONNREFUSED'
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.message).toBeDefined()
    })

    it('should handle timeout errors', async () => {
      const error = new Error('Timeout')
      ;(error as Error & { code?: string }).code = 'ETIMEDOUT'
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.message).toBeDefined()
    })
  })

  // Error Code Mapping Tests
  describe('Error Code Mapping', () => {
    it('should map VALIDATION_ERROR to correct code', async () => {
      const error = new ValidationError('Invalid')
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('VALIDATION_ERROR')
    })

    it('should map NOT_FOUND to correct code', async () => {
      const error = new NotFoundError()
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('NOT_FOUND')
    })

    it('should map UNAUTHORIZED to correct code', async () => {
      const error = new UnauthorizedError()
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('UNAUTHORIZED')
    })

    it('should map FORBIDDEN to correct code', async () => {
      const error = new ForbiddenError()
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('FORBIDDEN')
    })

    it('should map CONFLICT to correct code', async () => {
      const error = new ConflictError()
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('CONFLICT')
    })

    it('should default to INTERNAL_ERROR for unknown errors', async () => {
      const error = new Error('Unknown')
      const next = jest.fn()

      await errorHandler(error, mockContext, next)

      const response = JSON.parse(mockContext.text.mock.calls[0][0])
      expect(response.error.code).toBe('INTERNAL_ERROR')
    })
  })
})

describe('asyncHandler', () => {
  it('should execute the handler successfully', async () => {
    const handler = jest.fn().mockResolvedValue({ success: true })
    const mockContext = createMockContext()
    const next = jest.fn()

    await asyncHandler(handler)(mockContext, next)

    expect(handler).toHaveBeenCalledWith(mockContext, next)
  })

  it('should catch synchronous errors', async () => {
    const handler = jest.fn().mockImplementation(() => {
      throw new AppError('Sync error', 400)
    })
    const mockContext = createMockContext()
    const next = jest.fn()

    // asyncHandler catches the error and calls errorHandler, which sends response
    await asyncHandler(handler)(mockContext, next)

    expect(handler).toHaveBeenCalled()
  })

  it('should catch asynchronous errors', async () => {
    const handler = jest.fn().mockRejectedValue(new AppError('Async error', 500))
    const mockContext = createMockContext()
    const next = jest.fn()

    // Should not throw uncaught error
    await asyncHandler(handler)(mockContext, next)

    expect(handler).toHaveBeenCalled()
  })

  it('should pass context and next to handler', async () => {
    let capturedContext: unknown
    let capturedNext: unknown
    
    const handler = jest.fn().mockImplementation((ctx: unknown, next: unknown) => {
      capturedContext = ctx
      capturedNext = next
    })
    
    const mockContext = createMockContext('/test-path', 'POST')
    const next = jest.fn()

    await asyncHandler(handler)(mockContext, next)

    expect(capturedContext).toBe(mockContext)
    expect(capturedNext).toBe(next)
  })
})

describe('notFoundHandler', () => {
  it('should return 404 with NOT_FOUND error', () => {
    const mockContext = createMockContext('/unknown', 'GET')
    
    notFoundHandler(mockContext)

    expect(mockContext.text).toHaveBeenCalled()
    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.success).toBe(false)
    expect(response.error.code).toBe('NOT_FOUND')
    expect(response.error.message).toContain('Cannot GET /unknown')
    expect(mockContext.text).toHaveBeenCalledWith(expect.any(String), 404)
  })

  it('should handle different HTTP methods', () => {
    const mockContext = createMockContext('/api/test', 'POST')
    
    notFoundHandler(mockContext)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.message).toContain('Cannot POST /api/test')
  })
})

describe('successResponse', () => {
  it('should return success response with data', () => {
    const mockContext = createMockContext()
    const data = { id: 1, name: 'Test' }

    const result = successResponse(mockContext, data, 'Created successfully')

    expect(mockContext.json).toHaveBeenCalled()
    const response = mockContext.json.mock.calls[0][0]
    expect(response.success).toBe(true)
    expect(response.message).toBe('Created successfully')
    expect(response.data).toEqual(data)
    expect(response.timestamp).toBeDefined()
  })

  it('should use default message when not provided', () => {
    const mockContext = createMockContext()
    const data = { id: 1 }

    successResponse(mockContext, data)

    const response = mockContext.json.mock.calls[0][0]
    expect(response.message).toBe('Success')
  })
})

describe('paginatedResponse', () => {
  it('should return paginated data with correct metadata', () => {
    const mockContext = createMockContext()
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const total = 100
    const page = 2
    const pageSize = 10

    paginatedResponse(mockContext, data, total, page, pageSize)

    expect(mockContext.json).toHaveBeenCalled()
    const response = mockContext.json.mock.calls[0][0]
    expect(response.success).toBe(true)
    expect(response.data).toEqual(data)
    expect(response.pagination.total).toBe(100)
    expect(response.pagination.page).toBe(2)
    expect(response.pagination.pageSize).toBe(10)
    expect(response.pagination.totalPages).toBe(10)
  })

  it('should calculate totalPages correctly for edge cases - no data', () => {
    const mockContext = createMockContext()
    
    // No data - total = 0
    paginatedResponse(mockContext, [], 0, 1, 10)
    const response = mockContext.json.mock.calls[0][0]
    expect(response.pagination.totalPages).toBe(0)
  })

  it('should calculate totalPages correctly for exact division', () => {
    const mockContext = createMockContext()
    
    // Exact division - 30/10 = 3
    paginatedResponse(mockContext, [1,2,3], 30, 1, 10)
    const response = mockContext.json.mock.calls[0][0]
    expect(response.pagination.totalPages).toBe(3)
  })

  it('should calculate totalPages correctly for partial page', () => {
    const mockContext = createMockContext()
    
    // Partial page - Math.ceil(15/10) = 2
    paginatedResponse(mockContext, [1], 15, 2, 10)
    const response = mockContext.json.mock.calls[0][0]
    expect(response.pagination.totalPages).toBe(2)
  })
})

// Boundary condition tests
describe('Boundary Conditions', () => {
  let mockContext: MockContext

  beforeEach(() => {
    mockContext = createMockContext()
  })

  it('should handle error with no message', async () => {
    const error = new Error()
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.message).toBe('Internal server error')
  })

  it('should handle error with very long message', async () => {
    const longMessage = 'A'.repeat(10000)
    const error = new Error(longMessage)
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.message).toHaveLength(10000)
  })

  it('should handle error with special characters in message', async () => {
    const error = new Error('Error with <script>alert("xss")</script>')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.message).toContain('<script>')
  })

  it('should handle error with Unicode characters', async () => {
    const error = new Error('错误信息 🔴 🎉')
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.message).toContain('错误信息')
  })

  it('should handle error with null details', async () => {
    const error = new AppError('Error', 500, 'CODE', null)
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.details).toBeUndefined()
  })

  it('should handle error with complex details object', async () => {
    const details = { 
      nested: { 
        deep: { 
          value: 'test' 
        } 
      },
      array: [1, 2, 3],
      nullValue: null
    }
    const error = new AppError('Error', 400, 'CODE', details)
    const next = jest.fn()

    await errorHandler(error, mockContext, next)

    const response = JSON.parse(mockContext.text.mock.calls[0][0])
    expect(response.error.details).toEqual(details)
  })

  it('should handle multiple rapid errors', async () => {
    const errors = [
      new ValidationError('Error 1'),
      new NotFoundError('Error 2'),
      new UnauthorizedError('Error 3'),
    ]

    for (const error of errors) {
      const ctx = createMockContext()
      await errorHandler(error, ctx, jest.fn())
    }

    // All should complete without hanging
    expect(true).toBe(true)
  })
})
