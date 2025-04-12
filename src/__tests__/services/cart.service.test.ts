// src/__tests__/services/cart.service.test.ts
import mongoose from 'mongoose';
import { cartModel } from '../../models/cartModel';
import productModel from '../../models/productModel';
import { addItemToCart, getActiveCartForUser } from '../../services/cartService';

// Mock the models
jest.mock('../../models/cartModel');
jest.mock('../../models/productModel');

describe('Cart Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveCartForUser', () => {
    it('should return existing cart if found', async () => {
      const mockCart = { 
        _id: 'cart123', 
        userId: 'user123', 
        items: [],
        status: 'active',
        totalAmount: 0
      };
      
      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(mockCart);
      
      const result = await getActiveCartForUser({ userId: 'user123' });
      
      expect(cartModel.findOne).toHaveBeenCalledWith({ userId: 'user123', status: 'active' });
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if none exists', async () => {
      const mockNewCart = { 
        _id: 'newcart123', 
        userId: 'user123', 
        items: [], 
        status: 'active',
        totalAmount: 0,
        save: jest.fn()
      };
      
      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(null);
      (cartModel.create as jest.Mock).mockResolvedValueOnce(mockNewCart);
      
      const result = await getActiveCartForUser({ userId: 'user123' });
      
      expect(cartModel.findOne).toHaveBeenCalledWith({ userId: 'user123', status: 'active' });
      expect(cartModel.create).toHaveBeenCalledWith({ userId: 'user123', totalAmount: 0 });
      expect(mockNewCart.save).toHaveBeenCalled();
      expect(result).toEqual(mockNewCart);
    });
  });

  describe('addItemToCart', () => {
    it('should add a new item to cart', async () => {
      const mockProduct = { 
        _id: 'product123', 
        title: 'Test Product', 
        image: 'image1.jpg',
        price: 10, 
        stock: 100 
      };
      
      const mockCart = {
        _id: 'cart123',
        userId: 'user123',
        items: [],
        totalAmount: 0,
        status: 'active',
        save: jest.fn().mockResolvedValueOnce({ 
          _id: 'cart123',
          userId: 'user123',
          totalAmount: 20,
          status: 'active',
          items: [{ 
            product: mockProduct, 
            quantity: 2, 
            unitPrice: 10 
          }]
        })
      };

      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(mockCart);
      (productModel.findById as jest.Mock).mockResolvedValueOnce(mockProduct);
      
      const result = await addItemToCart({ 
        userId: 'user123', 
        productId: 'product123', 
        quantity: 2 
      });
      
      expect(productModel.findById).toHaveBeenCalledWith('product123');
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockCart.items).toContainEqual({
        product: mockProduct,
        quantity: 2,
        unitPrice: 10
      });
      expect(mockCart.totalAmount).toBe(20); // 10 * 2
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
    });

    it('should return 404 if product not found', async () => {
      const mockCart = {
        _id: 'cart123',
        userId: 'user123',
        items: [],
        totalAmount: 0,
        status: 'active',
        save: jest.fn()
      };

      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(mockCart);
      (productModel.findById as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await addItemToCart({ 
        userId: 'user123', 
        productId: 'nonexistent', 
        quantity: 2 
      });
      
      expect(productModel.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockCart.save).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(404);
      expect(result.data).toBe('Product not found');
    });

    it('should return 400 if item already exists in cart', async () => {
      const mockProduct = { 
        _id: 'product123',
        toString: () => 'product123'
      };
      
      const mockCart = {
        _id: 'cart123',
        userId: 'user123',
        totalAmount: 10,
        status: 'active',
        items: [{ 
          product: {
            _id: mockProduct,
            toString: () => 'product123'
          },
          quantity: 1, 
          unitPrice: 10 
        }],
        save: jest.fn()
      };

      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(mockCart);
      
      const result = await addItemToCart({ 
        userId: 'user123', 
        productId: 'product123', 
        quantity: 2 
      });
      
      expect(mockCart.save).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(400);
      expect(result.data).toBe('Item already exists in cart!');
    });

    it('should return 400 if product stock is insufficient', async () => {
      const mockProduct = { 
        _id: 'product123', 
        title: 'Test Product',
        image: 'image1.jpg', 
        price: 10, 
        stock: 5 
      };
      
      const mockCart = {
        _id: 'cart123',
        userId: 'user123',
        items: [],
        totalAmount: 0,
        status: 'active',
        save: jest.fn()
      };

      (cartModel.findOne as jest.Mock).mockResolvedValueOnce(mockCart);
      (productModel.findById as jest.Mock).mockResolvedValueOnce(mockProduct);
      
      const result = await addItemToCart({ 
        userId: 'user123', 
        productId: 'product123', 
        quantity: 10 // Requesting more than available stock
      });
      
      expect(productModel.findById).toHaveBeenCalledWith('product123');
      expect(mockCart.save).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(400);
      expect(result.data).toBe('low stock for this product ');
    });

    it('should handle errors properly', async () => {
      const error = new Error('Database error');
      
      (cartModel.findOne as jest.Mock).mockRejectedValueOnce(error);
      
      const result = await addItemToCart({ 
        userId: 'user123', 
        productId: 'product123', 
        quantity: 2 
      });
      
      expect(result.statusCode).toBe(500);
  
      // Check if result.data is the error object we expect
      expect(typeof result.data).toBe('object');
      expect(result.data).not.toBeNull();
      
      // Type assertion to tell TypeScript that we've verified data is an object
      const errorData = result.data as { message: string; error: string };
      
      expect(errorData.message).toBe('Failed to add item to cart');
      expect(errorData.error).toBe('Database error');
    });
  });
});