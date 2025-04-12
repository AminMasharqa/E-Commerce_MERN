import { validateJWT } from '../../middlewares/validateJWT';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

jest.mock('jsonwebtoken');

describe('validateJWT Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 403 if no authorization header is provided', () => {
    req.headers = {}; // Empty headers
    validateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Authorization header was not provided');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if bearer token is not found', () => {
    req.headers = { authorization: 'Bearer' }; // No token after "Bearer"
    validateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Bearer token not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token verification fails', () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    validateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Token verification failed');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if payload is empty or invalid', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    (jwt.verify as jest.Mock).mockReturnValue({}); // No userId or payload

    validateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Invalid token payload');
    expect(next).not.toHaveBeenCalled();
  });

  it('should successfully validate token and call next', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    const mockPayload = { userId: '12345' };
    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    validateJWT(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});
