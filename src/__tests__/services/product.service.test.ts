import { getAllProducts, seedInitialProducts } from '../../services/productService';
import productModel from '../../models/productModel';

// Mock the productModel
jest.mock('../../models/productModel', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    insertMany: jest.fn()
  }
}));

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      // Arrange
      const mockProducts = [
        { _id: '1', title: 'Test Product 1', image: 'image1.jpg', price: 10, stock: 100 },
        { _id: '2', title: 'Test Product 2', image: 'image2.jpg', price: 20, stock: 200 }
      ];
      
      // Mock the find method
      (productModel.find as jest.Mock).mockResolvedValue(mockProducts);
      
      // Act
      const result = await getAllProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProducts);
      expect(result.length).toBe(2);
    });

    it('should handle errors when getting products', async () => {
      // Arrange
      const errorMessage = 'Database error';
      (productModel.find as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(getAllProducts()).rejects.toThrow(errorMessage);
      expect(productModel.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('seedInitialProducts', () => {
    it('should seed products when database is empty', async () => {
      // Arrange
      (productModel.find as jest.Mock).mockResolvedValue([]);
      (productModel.insertMany as jest.Mock).mockResolvedValue([]);
      
      // Act
      await seedInitialProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.insertMany).toHaveBeenCalledTimes(1);
      expect(productModel.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Dell labtop ' })
      ]));
    });

    it('should not seed products when database already has products', async () => {
      // Arrange
      const existingProducts = [
        { _id: '1', title: 'Existing Product', image: 'existing.jpg', price: 10, stock: 100 }
      ];
      (productModel.find as jest.Mock).mockResolvedValue(existingProducts);
      
      // Act
      await seedInitialProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(productModel.insertMany).not.toHaveBeenCalled();
    });
  });
});