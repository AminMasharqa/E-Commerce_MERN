import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validateJWT, ExtendRequest } from '../../middlewares/validateJWT';

// Mock jwt library
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  JsonWebTokenError: jest.fn(),
  TokenExpiredError: jest.fn()
}));

describe('validateJWT Middleware', () => {
  // Save original environment and console methods
  const originalEnv = process.env;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Mock request, response, and next function
  let req: Partial<ExtendRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    
    // Mock console methods to prevent noise in test output
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    req = {
      headers: {},
      user: undefined
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  afterEach(() => {
    // Restore environment and console methods
    process.env = originalEnv;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  it('should add user data to request when token is valid', () => {
    // Setup
    const mockToken = 'valid.jwt.token';
    const mockUser = { _id: 'user123', email: 'test@example.com' };
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Mock jwt.verify to return user data
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);
    process.env.JWT_SECRET = 'test-secret';
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should use fallback secret when JWT_SECRET is not set', () => {
    // Setup
    const mockToken = 'valid.jwt.token';
    const mockUser = { _id: 'user123', email: 'test@example.com' };
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Mock jwt.verify to return user data
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);
    delete process.env.JWT_SECRET;
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'zz8GafWGnbKpALuIP61nusqsUfnKH1HB');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should return 401 when no authorization header is provided', () => {
    // Setup - no authorization header
    req.headers = {};
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header is required' });
  });

  it('should return 401 when authorization header is null or undefined', () => {
    // Setup - undefined authorization header
    req.headers = { authorization: undefined };
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header is required' });
    
    // Now test with null authorization header
    req.headers = { authorization: null as any };
    
    // Call middleware again
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Same assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header is required' });
  });

  it('should return 401 when authorization format is invalid', () => {
    // Setup - invalid format (missing "Bearer")
    req.headers = { authorization: 'InvalidToken' };
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Authorization format should be: Bearer [token]' 
    });
  });

  it('should return 401 when authorization has more than 2 parts', () => {
    // Setup - too many parts
    req.headers = { authorization: 'Bearer token extra-part' };
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Authorization format should be: Bearer [token]' 
    });
  });

  it('should return 401 when authorization has less than 2 parts', () => {
    // Setup - not enough parts
    req.headers = { authorization: 'BearerOnly' };
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Authorization format should be: Bearer [token]' 
    });
  });

  it('should return 401 when token is invalid', () => {
    // Setup
    const mockToken = 'invalid.jwt.token';
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Create a JsonWebTokenError instance
    const tokenError = new Error('Invalid token');
    (tokenError as any).name = 'JsonWebTokenError';
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw tokenError;
    });
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    // Setup
    const mockToken = 'expired.jwt.token';
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Create a TokenExpiredError instance
    const expiredError = new Error('Token expired');
    (expiredError as any).name = 'TokenExpiredError';
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw expiredError;
    });
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    // Setup
    const mockToken = 'expired.jwt.token';
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Create an actual TokenExpiredError
    // We need to properly mock the instance check
    const TokenExpiredError = jwt.TokenExpiredError;
    const expiredError = Object.create(TokenExpiredError.prototype);
    expiredError.name = 'TokenExpiredError';
    expiredError.message = 'Token expired';
    
    // Mock jwt.verify to throw our proper TokenExpiredError
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw expiredError;
    });
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should return 401 when token verification throws JsonWebTokenError', () => {
    // Setup
    const mockToken = 'invalid.jwt.token';
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Create an actual JsonWebTokenError
    // We need to properly mock the instance check
    const JsonWebTokenError = jwt.JsonWebTokenError;
    const tokenError = Object.create(JsonWebTokenError.prototype);
    tokenError.name = 'JsonWebTokenError';
    tokenError.message = 'Invalid token';
    
    // Mock jwt.verify to throw our proper JsonWebTokenError
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw tokenError;
    });
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle optional chaining on req.headers.authorization', () => {
    // Setup - make headers undefined to trigger the optional chaining
    req = {
      headers: undefined as any,
      user: undefined
    };
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header is required' });
  });

  it('should return 401 for any other error', () => {
    // Setup
    const mockToken = 'problematic.jwt.token';
    req.headers = { authorization: `Bearer ${mockToken}` };
    
    // Mock jwt.verify to throw generic error
    const genericError = new Error('Unexpected error');
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw genericError;
    });
    
    // Call middleware
    validateJWT(req as ExtendRequest, res as Response, next);
    
    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
    expect(console.error).toHaveBeenCalled();
  });
});