import productModel from '../../models/productModel';
import { getAllProducts, seedInitialProducts, searchProducts } from '../../services/productService';

// Mock productModel
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
      // Mock data
      const mockProducts = [
        { _id: 'product1', title: 'Dell Laptop', price: 10, stock: 100 },
        { _id: 'product2', title: 'HP Laptop', price: 20, stock: 200 }
      ];
      
      // Setup mock
      (productModel.find as jest.Mock).mockResolvedValue(mockProducts);
      
      // Execute
      const result = await getAllProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should handle errors', async () => {
      // Setup mock to throw error
      (productModel.find as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Execute and assert
      await expect(getAllProducts()).rejects.toThrow('Database error');
    });
  });

  describe('seedInitialProducts', () => {
    it('should seed products when none exist', async () => {
      // Mock empty products list
      (productModel.find as jest.Mock).mockResolvedValue([]);
      
      // Execute
      await seedInitialProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalled();
      expect(productModel.insertMany).toHaveBeenCalled();
      // Check that it inserted the sample Dell laptop
      expect(productModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Dell labtop ',
            price: 10,
            stock: 100
          })
        ])
      );
    });

    it('should not seed products when products already exist', async () => {
      // Mock existing products
      const mockProducts = [
        { _id: 'product1', title: 'Existing Product', price: 10, stock: 100 }
      ];
      (productModel.find as jest.Mock).mockResolvedValue(mockProducts);
      
      // Execute
      await seedInitialProducts();
      
      // Assert
      expect(productModel.find).toHaveBeenCalled();
      expect(productModel.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('searchProducts', () => {
    it('should return all products when search term is empty', async () => {
      // Mock data
      const mockProducts = [
        { _id: 'product1', title: 'Dell Laptop', price: 10, stock: 100 },
        { _id: 'product2', title: 'HP Laptop', price: 20, stock: 200 }
      ];
      
      // Setup mock
      (productModel.find as jest.Mock).mockResolvedValue(mockProducts);
      
      // Test with empty string
      const result1 = await searchProducts('');
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockProducts);
      
      // Reset mock counter
      jest.clearAllMocks();
      
      // Test with undefined
      const result2 = await searchProducts(undefined as any);
      expect(productModel.find).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(mockProducts);
    });

    it('should search products by title with regex', async () => {
      // Mock filtered products
      const mockFilteredProducts = [
        { _id: 'product1', title: 'Dell Laptop', price: 10, stock: 100 }
      ];
      
      // Setup mock
      (productModel.find as jest.Mock).mockResolvedValue(mockFilteredProducts);
      
      // Execute
      const result = await searchProducts('Dell');
      
      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        title: { $regex: 'Dell', $options: 'i' }
      });
      expect(result).toEqual(mockFilteredProducts);
    });

    it('should handle whitespace in search term', async () => {
      // Mock filtered products
      const mockFilteredProducts = [
        { _id: 'product1', title: 'Dell Laptop', price: 10, stock: 100 }
      ];
      
      // Setup mock
      (productModel.find as jest.Mock).mockResolvedValue(mockFilteredProducts);
      
      // Execute with whitespace
      const result = await searchProducts('   Dell   ');
      
      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        title: { $regex: '   Dell   ', $options: 'i' }
      });
      expect(result).toEqual(mockFilteredProducts);
    });
  });
});