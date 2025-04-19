import request from "supertest";
import express from "express";
import cartRoute from "../../routes/cartRoute";
import * as cartService from "../../services/cartService";
import { validateJWT } from "../../middlewares/validateJWT";

// Mock the middleware and services
jest.mock("../../middlewares/validateJWT", () => ({
  validateJWT: jest.fn((req, res, next) => {
    req.user = { _id: "testUserId" };
    next();
  })
}));

jest.mock("../../services/cartService");

describe("Cart Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new express application for testing
    app = express();
    app.use(express.json());
    app.use("/cart", cartRoute);
  });

  describe("GET /cart", () => {
    it("should return active cart for user", async () => {
      // Setup mock response
      const mockCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [],
        totalAmount: 0,
        status: "active"
      };
      
      (cartService.getActiveCartForUser as jest.Mock).mockResolvedValue(mockCart);
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCart);
      expect(validateJWT).toHaveBeenCalled();
      expect(cartService.getActiveCartForUser).toHaveBeenCalledWith({ userId: "testUserId" });
    });

    it("should return 400 if user ID is missing from token", async () => {
      // Override the default mock to simulate missing user ID
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {}; // User object without _id
        next();
      });
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
      expect(cartService.getActiveCartForUser).not.toHaveBeenCalled();
    });

    it("should return 400 if user object is null", async () => {
      // Override the default mock to simulate null user
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = null;
        next();
      });
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
      expect(cartService.getActiveCartForUser).not.toHaveBeenCalled();
    });

    it("should handle errors correctly", async () => {
      // Setup mock to throw error
      (cartService.getActiveCartForUser as jest.Mock).mockRejectedValue(new Error("Database error"));
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /cart/items", () => {
    it("should add item to cart successfully", async () => {
      // Setup mock response
      const mockAddedCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [{
          product: { _id: "product123" },
          quantity: 2,
          unitPrice: 10
        }],
        totalAmount: 20
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: mockAddedCart,
        statusCode: 200
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAddedCart);
      expect(cartService.addItemToCart).toHaveBeenCalledWith({
        userId: "testUserId",
        productId: "product123",
        quantity: 2
      });
    });

    it("should return 400 if user ID is missing from token", async () => {
      // Override the default mock to simulate missing user ID
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {}; // User object without _id
        next();
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
      expect(cartService.addItemToCart).not.toHaveBeenCalled();
    });

    it("should return error when required fields are missing", async () => {
      // Make request without required fields
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({});
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Missing required fields");
      expect(cartService.addItemToCart).not.toHaveBeenCalled();
    });

    it("should handle string error responses correctly", async () => {
      // Setup mock to return string error
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: "Item already exists in cart!",
        statusCode: 400
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.text).toBe("Item already exists in cart!");
    });

    it("should handle null data correctly", async () => {
      // Setup mock to return null data
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: null,
        statusCode: 204
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(204);
      expect(response.text).toBe("");
    });

    it("should handle service errors correctly", async () => {
      // Setup mock to throw error
      (cartService.addItemToCart as jest.Mock).mockRejectedValue(new Error("Service error"));
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("An unexpected error occurred");
    });
  });

  describe("PUT /cart/items", () => {
    it("should update item in cart successfully", async () => {
      // Setup mock response
      const mockUpdatedCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [{
          product: { _id: "product123" },
          quantity: 5, // Updated quantity
          unitPrice: 10
        }],
        totalAmount: 50
      };
      
      (cartService.updateItemInCart as jest.Mock).mockResolvedValue({
        data: mockUpdatedCart,
        statusCode: 200
      });
      
      // Make request
      const response = await request(app)
        .put("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 5
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedCart);
      expect(cartService.updateItemInCart).toHaveBeenCalledWith({
        userId: "testUserId",
        productId: "product123",
        quantity: 5
      });
    });

    it("should return 400 if user ID is missing from token", async () => {
      // Override the default mock to simulate missing user ID
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {}; // User object without _id
        next();
      });
      
      // Make request
      const response = await request(app)
        .put("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 5
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
      expect(cartService.updateItemInCart).not.toHaveBeenCalled();
    });

    it("should return error when required fields are missing", async () => {
      // Make request without required fields
      const response = await request(app)
        .put("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({});
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(cartService.updateItemInCart).not.toHaveBeenCalled();
    });

    it("should handle service errors correctly", async () => {
      // Setup mock to throw error
      (cartService.updateItemInCart as jest.Mock).mockRejectedValue(new Error("Service error"));
      
      // Make request
      const response = await request(app)
        .put("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 5
        });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("An unexpected error occurred");
    });
  });

  describe("DELETE /cart/items/:productId", () => {
    it("should delete item from cart successfully", async () => {
      // Setup mock response
      const mockUpdatedCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [], // Item removed
        totalAmount: 0
      };
      
      (cartService.deletItemInCart as jest.Mock).mockResolvedValue({
        data: mockUpdatedCart,
        statusCode: 200
      });
      
      // Make request
      const response = await request(app)
        .delete("/cart/items/product123")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedCart);
      expect(cartService.deletItemInCart).toHaveBeenCalledWith({
        userId: "testUserId",
        productId: "product123"
      });
    });

    it("should return 400 if user ID is missing from token", async () => {
      // Override the default mock to simulate missing user ID
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {}; // User object without _id
        next();
      });
      
      // Make request
      const response = await request(app)
        .delete("/cart/items/product123")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
      expect(cartService.deletItemInCart).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      // Setup mock to throw error
      (cartService.deletItemInCart as jest.Mock).mockRejectedValue(new Error("Service error"));
      
      // Make request
      const response = await request(app)
        .delete("/cart/items/product123")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("An unexpected error occurred");
    });
  });

  describe("GET /cart/debug-token", () => {
    it("should return user information from token", async () => {
      // Make request
      const response = await request(app)
        .get("/cart/debug-token")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toEqual({ _id: "testUserId" });
      expect(response.body).toHaveProperty("message", "Token is valid");
    });
  });

  describe("POST /cart/items response handling", () => {
    it("should handle string responses with correct content type", async () => {
      // Setup mock to return string data with specific status code
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: "Custom string response message",
        statusCode: 418 // Using a non-standard code to verify it's being used
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(418);
      expect(response.type).toBe("text/plain");
      expect(response.text).toBe("Custom string response message");
    });
  
    it("should use fallback status code 500 when statusCode is missing for string responses", async () => {
      // Setup mock to return string data without status code
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: "Error message without status code",
        // statusCode intentionally omitted
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(500); // Should use fallback
      expect(response.type).toBe("text/plain");
      expect(response.text).toBe("Error message without status code");
    });
  
    it("should handle null data response correctly", async () => {
      // Setup mock to return null data
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: null,
        statusCode: 204
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(204);
      expect(response.text).toBe(""); // Empty response body
    });
  
    it("should handle undefined data response correctly", async () => {
      // Setup mock to return undefined data
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: undefined,
        statusCode: 204
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(204);
      expect(response.text).toBe(""); // Empty response body
    });
  
    it("should use fallback status code 500 when statusCode is missing for null/undefined responses", async () => {
      // Setup mock to return null data without status code
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: null,
        // statusCode intentionally omitted
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(500); // Should use fallback
      expect(response.text).toBe(""); // Empty response body
    });
  
    it("should handle object responses with correct content type", async () => {
      // Setup mock to return object data
      const mockCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [{
          product: { _id: "product123" },
          quantity: 2,
          unitPrice: 10
        }],
        totalAmount: 20
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: mockCart,
        statusCode: 201 // Created status
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.type).toBe("application/json");
      expect(response.body).toEqual(mockCart);
    });
  
    it("should use fallback status code 500 when statusCode is missing for object responses", async () => {
      // Setup mock to return object data without status code
      const mockCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [{
          product: { _id: "product123" },
          quantity: 2,
          unitPrice: 10
        }],
        totalAmount: 20
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: mockCart,
        // statusCode intentionally omitted
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(500); // Should use fallback
      expect(response.body).toEqual(mockCart);
    });
  
    it("should handle error in the service correctly", async () => {
      // Setup mock to throw error
      (cartService.addItemToCart as jest.Mock).mockRejectedValue(new Error("Database connection error"));
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "An unexpected error occurred" });
    });
  
    it("should handle empty object in response", async () => {
      // Setup mock to return empty object
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: {},
        statusCode: 200
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  
    it("should handle array in response", async () => {
      // Setup mock to return array
      (cartService.addItemToCart as jest.Mock).mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        statusCode: 200
      });
      
      // Make request
      const response = await request(app)
        .post("/cart/items")
        .set("Authorization", "Bearer validToken")
        .send({
          productId: "product123",
          quantity: 2
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  // Test getUserIdFromRequest function indirectly
  describe("getUserIdFromRequest function", () => {
    it("should handle null user object", async () => {
      // Override the default mock to simulate null user
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = null;
        next();
      });
      
      // Make request to any endpoint that uses getUserIdFromRequest
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
    });

    it("should handle user object without _id property", async () => {
      // Override the default mock to simulate user without _id
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = { email: "test@example.com" }; // Missing _id
        next();
      });
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "User ID not found in token" });
    });

    it("should handle user object with non-string _id", async () => {
      // Override the default mock to simulate user with non-string _id that needs toString()
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = {
          _id: {
            toString: () => "testUserId"
          }
        };
        next();
      });
      
      // Setup mock for getActiveCartForUser
      const mockCart = {
        _id: "cart123",
        userId: "testUserId",
        items: [],
        totalAmount: 0,
        status: "active"
      };
      (cartService.getActiveCartForUser as jest.Mock).mockResolvedValue(mockCart);
      
      // Make request
      const response = await request(app)
        .get("/cart")
        .set("Authorization", "Bearer validToken");
      
      // Assertions
      expect(response.status).toBe(200);
      expect(cartService.getActiveCartForUser).toHaveBeenCalledWith({ userId: "testUserId" });
    });
  });
});