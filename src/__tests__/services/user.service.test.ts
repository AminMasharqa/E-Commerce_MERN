import { register, login } from '../../services/userService';
import userModel from '../../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the dependencies
jest.mock('../../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Service', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register function', () => {
    it('should return error if user already exists', async () => {
      // Mock findOne to return an existing user
      (userModel.findOne as jest.Mock).mockResolvedValue({
        email: 'existing@example.com'
      });

      const registerParams = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      const result = await register(registerParams);

      expect(result).toEqual({
        data: 'User Already exists!',
        statusCode: 400
      });
    });

    it('should successfully register a new user', async () => {
      // Mock findOne to return null (no existing user)
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const registerParams = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'new@example.com',
        password: 'password123'
      };

      const result = await register(registerParams);

      // Verify user model save was called
      expect(userModel.prototype.save).toHaveBeenCalled();

      // Check result
      expect(result).toEqual({
        data: 'mockToken',
        statusCode: 200
      });
    });
  });

  describe('login function', () => {
    it('should return error if user not found', async () => {
      // Mock findOne to return null
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      const loginParams = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const result = await login(loginParams);

      expect(result).toEqual({
        data: 'Incorrect email or password!',
        statusCode: 400
      });
    });

    it('should return error if password does not match', async () => {
      // Mock findOne to return a user
      (userModel.findOne as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        password: 'existingHashedPassword',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginParams = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const result = await login(loginParams);

      expect(result).toEqual({
        data: 'Incorrect email or password!',
        statusCode: 401
      });
    });

    it('should successfully login with correct credentials', async () => {
      // Mock findOne to return a user
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe'
      };
      (userModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const loginParams = {
        email: 'test@example.com',
        password: 'correctpassword'
      };

      const result = await login(loginParams);

      expect(result).toEqual({
        data: 'mockToken',
        statusCode: 200
      });
    });
  });
});