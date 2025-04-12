import express from 'express';
import request from 'supertest';
import userRouter from '../../routes/userRoute';
import * as userService from '../../services/userService';

// Mock the userService
jest.mock('../../services/userService');

describe('User Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/user', userRouter);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /user/register', () => {
    it('should successfully register a user', async () => {
      // Mock the register service method
      (userService.register as jest.Mock).mockResolvedValue({
        statusCode: 200,
        data: 'mockToken'
      });

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(registerData);

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('mockToken');

      // Verify the service method was called with correct parameters
      expect(userService.register).toHaveBeenCalledWith(registerData);
    });

    it('should handle registration failure', async () => {
      // Mock the register service method to return an error
      (userService.register as jest.Mock).mockResolvedValue({
        statusCode: 400,
        data: 'User Already exists!'
      });

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/register')
        .send(registerData);

      expect(response.statusCode).toBe(400);
      expect(response.text).toBe('User Already exists!');
    });
  });

  describe('POST /user/login', () => {
    it('should successfully login a user', async () => {
      // Mock the login service method
      (userService.login as jest.Mock).mockResolvedValue({
        statusCode: 200,
        data: 'mockToken'
      });

      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('mockToken');

      // Verify the service method was called with correct parameters
      expect(userService.login).toHaveBeenCalledWith(loginData);
    });

    it('should handle login failure', async () => {
      // Mock the login service method to return an error
      (userService.login as jest.Mock).mockResolvedValue({
        statusCode: 401,
        data: 'Incorrect email or password!'
      });

      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/user/login')
        .send(loginData);

      expect(response.statusCode).toBe(401);
      expect(response.text).toBe('Incorrect email or password!');
    });
  });
});