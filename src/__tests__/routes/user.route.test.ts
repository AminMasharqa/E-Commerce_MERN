import request from "supertest";
import express from "express";
import userRoute from "../../routes/userRoute";
import * as userService from "../../services/userService";

// Mock services
jest.mock("../../services/userService");

describe("User Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh express application for testing
    app = express();
    app.use(express.json());
    app.use("/user", userRoute);
  });

  describe("POST /user/register", () => {
    it("should register a new user successfully", async () => {
      // Mock the service response
      const mockToken = "mocked.jwt.token";
      (userService.register as jest.Mock).mockResolvedValue({
        data: mockToken,
        statusCode: 200
      });
      
      // Test data
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123"
      };
      
      // Make request
      const response = await request(app)
        .post("/user/register")
        .send(userData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.text).toBe(mockToken);
      expect(userService.register).toHaveBeenCalledWith(userData);
    });

    it("should return error if registration fails", async () => {
      // Mock service to return an error
      (userService.register as jest.Mock).mockResolvedValue({
        data: "User Already exists!",
        statusCode: 400
      });
      
      // Test data
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "existing@example.com",
        password: "password123"
      };
      
      // Make request
      const response = await request(app)
        .post("/user/register")
        .send(userData);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.text).toBe("User Already exists!");
    });
  });

  describe("POST /user/login", () => {
    it("should login user successfully with correct credentials", async () => {
      // Mock the service response
      const mockToken = "mocked.jwt.token";
      (userService.login as jest.Mock).mockResolvedValue({
        data: mockToken,
        statusCode: 200
      });
      
      // Test data
      const loginData = {
        email: "john.doe@example.com",
        password: "password123"
      };
      
      // Make request
      const response = await request(app)
        .post("/user/login")
        .send(loginData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.text).toBe(mockToken);
      expect(userService.login).toHaveBeenCalledWith(loginData);
    });

    it("should return error with incorrect credentials", async () => {
      // Mock service to return an error
      (userService.login as jest.Mock).mockResolvedValue({
        data: "Incorrect email or password!",
        statusCode: 401
      });
      
      // Test data
      const loginData = {
        email: "john.doe@example.com",
        password: "wrongPassword"
      };
      
      // Make request
      const response = await request(app)
        .post("/user/login")
        .send(loginData);
      
      // Assertions
      expect(response.status).toBe(401);
      expect(response.text).toBe("Incorrect email or password!");
    });
  });
});