import userModel from "../../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register, login } from "../../services/userService";

// Create mock types to match requirements
type MockUserModel = {
  findOne: jest.Mock;
  [key: string]: any;
};

// Mocking dependencies
// Create a more explicit mock for userModel
jest.mock("../../models/userModel", () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      constructor: jest.fn().mockImplementation(() => ({
        _id: "user123",
        save: jest.fn().mockResolvedValue(true),
      })),
    },
  };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));
// Then in your test file, access the mocked functions directly
describe("register", () => {
  it("should register a new user successfully", async () => {
    // Setup mocks - use the mock directly without type casting
    (userModel.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
    (jwt.sign as jest.Mock).mockReturnValue("mockedJWTToken");

    // Rest of the test...
  });
});
describe("User Service", () => {
  // Properly type the environment variables
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    // Save original environment variables
    originalEnv = { ...process.env };
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      // Setup mocks
      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
      (jwt.sign as jest.Mock).mockReturnValue("mockedJWTToken");

      // Call the register function
      const result = await register({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      });

      // Assertions
      expect(
        (userModel as unknown as MockUserModel).findOne
      ).toHaveBeenCalledWith({ email: "john.doe@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          _id: "user123",
        },
        "test-secret"
      );
      expect(result.statusCode).toBe(200);
      expect(result.data).toBe("mockedJWTToken");
    });

    it("should return error if user already exists", async () => {
      // Setup mock - user already exists
      (userModel as unknown as MockUserModel).findOne.mockResolvedValue({
        _id: "existingUser123",
        email: "john.doe@example.com",
      });

      // Call the register function
      const result = await register({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      });

      // Assertions
      expect(
        (userModel as unknown as MockUserModel).findOne
      ).toHaveBeenCalledWith({ email: "john.doe@example.com" });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(400);
      expect(result.data).toBe("User Already exists!");
    });

    it("should use fallback secret when JWT_SECRET is not set", async () => {
      // Setup mocks
      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
      (jwt.sign as jest.Mock).mockReturnValue("mockedJWTToken");

      // Remove JWT_SECRET environment variable
      delete process.env.JWT_SECRET;

      // Call the register function
      const result = await register({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      });

      // Assertions
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "zz8GafWGnbKpALuIP61nusqsUfnKH1HB"
      );
      expect(result.statusCode).toBe(200);
      expect(result.data).toBe("mockedJWTToken");
    });
  });

  describe("login", () => {
    it("should login user successfully with correct credentials", async () => {
      // Setup mocks
      const mockUser = {
        _id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "hashedPassword123",
      };

      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(
        mockUser
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mockedJWTToken");

      // Call the login function
      const result = await login({
        email: "john.doe@example.com",
        password: "password123",
      });

      // Assertions
      expect(
        (userModel as unknown as MockUserModel).findOne
      ).toHaveBeenCalledWith({ email: "john.doe@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          _id: "user123",
        },
        "test-secret"
      );
      expect(result.statusCode).toBe(200);
      expect(result.data).toBe("mockedJWTToken");
    });

    it("should return error if user does not exist", async () => {
      // Setup mock - user doesn't exist
      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(null);

      // Call the login function
      const result = await login({
        email: "nonexistent@example.com",
        password: "password123",
      });

      // Assertions
      expect(
        (userModel as unknown as MockUserModel).findOne
      ).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(400);
      expect(result.data).toBe("Incorrect email or password!");
    });

    it("should return error if password is incorrect", async () => {
      // Setup mocks
      const mockUser = {
        _id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "hashedPassword123",
      };

      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(
        mockUser
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Call the login function
      const result = await login({
        email: "john.doe@example.com",
        password: "wrongPassword",
      });

      // Assertions
      expect(
        (userModel as unknown as MockUserModel).findOne
      ).toHaveBeenCalledWith({ email: "john.doe@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        "hashedPassword123"
      );
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      expect(result.data).toBe("Incorrect email or password!");
    });

    it("should use fallback secret when JWT_SECRET is not set", async () => {
      // Setup mocks
      const mockUser = {
        _id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "hashedPassword123",
      };

      (userModel as unknown as MockUserModel).findOne.mockResolvedValue(
        mockUser
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mockedJWTToken");

      // Remove JWT_SECRET environment variable
      delete process.env.JWT_SECRET;

      // Call the login function
      const result = await login({
        email: "john.doe@example.com",
        password: "password123",
      });

      // Assertions
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        "zz8GafWGnbKpALuIP61nusqsUfnKH1HB"
      );
      expect(result.statusCode).toBe(200);
      expect(result.data).toBe("mockedJWTToken");
    });
  });
});
