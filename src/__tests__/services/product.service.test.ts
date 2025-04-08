// src/__tests__/services/product.service.test.ts

import * as productService from '../../services/productService';
import productModel from '../../models/productModel';

// Mock the productModel
jest.mock('../../models/productModel', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    insertMany: jest.fn()
  }
}));

// Mock data for reuse across tests
const mockProducts = [
  { _id: '1', title: 'Test Product 1', image: 'image1.jpg', price: 10, stock: 100 },
  { _id: '2', title: 'Test Product 2', image: 'image2.jpg', price: 20, stock: 200 }
];

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for commonly used methods
    (productModel.find as jest.Mock).mockResolvedValue(mockProducts);
  });

  // Group tests by function
  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const result = await productService.getAllProducts();
      
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProducts);
    });

    it('should handle errors when getting products', async () => {
      const errorMessage = 'Database error';
      (productModel.find as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(productService.getAllProducts()).rejects.toThrow(errorMessage);
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('seedInitialProducts', () => {
    it('should seed products when database is empty', async () => {
      // Override the default mock for this specific test
      (productModel.find as jest.Mock).mockResolvedValueOnce([]);
      
      await productService.seedInitialProducts();
      
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.insertMany).toHaveBeenCalledTimes(1);
    });

    it('should not seed products when database already has products', async () => {
      await productService.seedInitialProducts();
      
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('searchProducts', () => {
    it('should return all products when search term is empty', async () => {
      const result = await productService.searchProducts('');
      
      expect(productModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockProducts);
    });

    it('should search products by title when search term is provided', async () => {
      const searchTerm = 'laptop';
      await productService.searchProducts(searchTerm);
      
      expect(productModel.find).toHaveBeenCalledWith({
        title: { $regex: searchTerm, $options: 'i' }
      });
    });
  });

  // When adding a new function, simply add a new describe block here
  // describe('newFunction', () => {
  //   it('should ...', async () => {
  //     // Test implementation
  //   });
  // });
});