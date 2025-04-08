import request from 'supertest';
import express from 'express';
import productRoute from '../../routes/productRoute';
import * as productService from '../../services/productService';

// Mock the product service
jest.mock('../../services/productService', () => ({
  getAllProducts: jest.fn()
}));

// Create a test app
const app = express();
app.use(express.json());
app.use('/product', productRoute);

describe('Product Routes', () => {
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    // Save the original console.error
    originalConsoleError = console.error;
    // Mock console.error to suppress error messages during tests
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore the original console.error
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /product', () => {
    it('should return all products with 200 status', async () => {
      // Arrange
      const mockProducts = [
        { _id: '1', title: 'Test Product 1', image: 'image1.jpg', price: 10, stock: 100 },
        { _id: '2', title: 'Test Product 2', image: 'image2.jpg', price: 20, stock: 200 }
      ];
      
      (productService.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
      
      // Act
      const response = await request(app).get('/product');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProducts);
      expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and return 500 status', async () => {
      // Arrange
      const errorMessage = 'Server error';
      (productService.getAllProducts as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Act
      const response = await request(app).get('/product');
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching products');
      expect(response.body).toHaveProperty('error', errorMessage);
      expect(productService.getAllProducts).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });
  });
});