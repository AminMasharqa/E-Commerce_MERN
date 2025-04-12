// src/__tests__/routes/cart.route.test.ts
import request from "supertest";
import express from "express";
import cartRoute from "../../routes/cartRoute";
import * as cartService from "../../services/cartService";
import validateJWT from "../../middlewares/validateJWT";

// Mock dependencies
jest.mock("../../services/cartService");
jest.mock("../../middlewares/validateJWT");

// Create a properly configured test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/cart", cartRoute);

// Mock JWT middleware
(validateJWT as jest.Mock).mockImplementation((req, res, next) => {
  req.user = { _id: "testuser123" };
  next();
});

describe("Cart Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /cart", () => {
    it("should fetch cart for authenticated user", async () => {
      const mockCart = {
        _id: "cart123",
        userId: "testuser123",
        items: [],
        totalAmount: 0,
        status: "active",
      };

      (cartService.getActiveCartForUser as jest.Mock).mockResolvedValueOnce(mockCart);
      
      const response = await request(app).get("/cart");
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCart);
      expect(cartService.getActiveCartForUser).toHaveBeenCalledWith({
        userId: "testuser123",
      });
    });

    it("should handle missing user ID", async () => {
      (validateJWT as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = { /* no _id property */ };
        next();
      });
      
      const response = await request(app).get("/cart");
      
      expect(response.status).toBe(400);
      expect(response.text).toBe("User ID not found in token");
      expect(cartService.getActiveCartForUser).not.toHaveBeenCalled();
    });

    it("should handle errors when fetching cart", async () => {
      (cartService.getActiveCartForUser as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch cart")
      );
      
      const response = await request(app).get("/cart");
      
      expect(response.status).toBe(500);
      expect(response.text).toBe("An error occurred while fetching the cart");
    });
  });

  describe("POST /cart/items", () => {
    it("should add item to cart successfully", async () => {
      const mockProduct = {
        _id: "product123",
        title: "Test Product",
        price: 10,
        stock: 100,
      };

      const mockResponse = {
        statusCode: 200,
        data: {
          _id: "cart123",
          userId: "testuser123",
          items: [{ product: mockProduct, quantity: 2, unitPrice: 10 }],
          totalAmount: 20,
          status: "active",
        },
      };

      (cartService.addItemToCart as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post("/cart/items")
        .send({
          productId: "product123",
          quantity: 2,
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
      expect(cartService.addItemToCart).toHaveBeenCalledWith({
        userId: "testuser123",
        productId: "product123",
        quantity: 2,
      });
    });

    it("should handle product not found", async () => {
      // Create a test endpoint for string responses
      app.post('/test/string-response', (req, res) => {
        res.status(404).contentType('text/plain').send("Test string response");
      });

      // Verify supertest can handle text responses correctly
      const testResponse = await request(app).post('/test/string-response');
      expect(testResponse.status).toBe(404);
      expect(testResponse.text).toBe("Test string response");
      
      // Now test the real endpoint
      const mockResponse = {
        statusCode: 404,
        data: "Product not found"
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post("/cart/items")
        .send({
          productId: "nonexistent",
          quantity: 2,
        });
      
      expect(response.status).toBe(404);
      // Get text content directly from the response
      expect(response.text).toBe("Product not found");
    });

    it("should handle item already in cart", async () => {
      const mockResponse = {
        statusCode: 400,
        data: "Item already exists in cart!"
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post("/cart/items")
        .send({
          productId: "product123",
          quantity: 2,
        });
      
      expect(response.status).toBe(400);
      expect(response.text).toBe("Item already exists in cart!");
    });

    it("should handle insufficient stock", async () => {
      const mockResponse = {
        statusCode: 400,
        data: "low stock for this product "
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post("/cart/items")
        .send({
          productId: "product123",
          quantity: 200, // More than available
        });
      
      expect(response.status).toBe(400);
      expect(response.text).toBe("low stock for this product ");
    });

    it("should handle server errors", async () => {
      const mockResponse = {
        statusCode: 500,
        data: { 
          message: "Failed to add item to cart",
          error: "Database error"
        }
      };
      
      (cartService.addItemToCart as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post("/cart/items")
        .send({
          productId: "product123",
          quantity: 2,
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual(mockResponse.data);
    });
  });
});