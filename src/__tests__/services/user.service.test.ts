import { register, login } from '../../services/userService';
import userModel from '../../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the dependencies
jest.mock('../../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set JWT secret
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock findOne to return null (user doesn't exist)
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123'
      });

      // Verify registration result
      expect(result).toEqual({
        data: 'mockToken',
        statusCode: 200
      });

      // Verify model usage
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com'
      });

      // Verify user was created with correct data
      expect(userModel).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'hashedPassword'
      }));
    });

    it('should prevent registering an existing user', async () => {
      // Mock findOne to return an existing user
      (userModel.findOne as jest.Mock).mockResolvedValue({
        email: 'existing@example.com'
      });

      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123'
      });

      // Verify error result
      expect(result).toEqual({
        data: 'User Already exists!',
        statusCode: 400
      });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      // Mock findOne to return a user
      (userModel.findOne as jest.Mock).mockResolvedValue({
        _id: 'userId',
        email: 'test@example.com',
        password: 'hashedPassword'
      });

      // Mock password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const result = await login({
        email: 'test@example.com',
        password: 'correctpassword'
      });

      // Verify login result
      expect(result).toEqual({
        data: 'mockToken',
        statusCode: 200
      });
    });

    it('should reject login for non-existent user', async () => {
      // Mock findOne to return null
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await login({
        email: 'nonexistent@example.com',
        password: 'password123'
      });

      // Verify error result
      expect(result).toEqual({
        data: 'Incorrect email or password!',
        statusCode: 400
      });
    });

    it('should reject login with incorrect password', async () => {
      // Mock findOne to return a user
      (userModel.findOne as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        password: 'hashedPassword'
      });

      // Mock password comparison to fail
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      // Verify error result
      expect(result).toEqual({
        data: 'Incorrect email or password!',
        statusCode: 401
      });
    });
  });
});