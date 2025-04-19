import mongoose from 'mongoose';
import { cartModel, ICart, ICartItem } from '../../models/cartModel';
import productModel, { IProduct } from '../../models/productModel';

// Helper function to create a valid product
const createProduct = async (): Promise<IProduct> => {
  const product = new productModel({
    title: 'Test Product',
    image: 'test-image.jpg',
    price: 10,
    stock: 100
  });
  return await product.save();
};

describe('Cart Model', () => {
  // Connect to test database before tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/test-db';
    await mongoose.connect(mongoUri);
  });

  // Clean up after tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  // Clear collections before each test
  beforeEach(async () => {
    await cartModel.deleteMany({});
    await productModel.deleteMany({});
  });

  it('should create an empty cart successfully', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0,
      status: 'active'
    });
    
    const savedCart = await cart.save();
    
    expect(savedCart._id).toBeDefined();
    expect(savedCart.userId.toString()).toBe(userId);
    expect(savedCart.items).toHaveLength(0);
    expect(savedCart.totalAmount).toBe(0);
    expect(savedCart.status).toBe('active');
  });

  it('should add items to cart successfully', async () => {
    // Create a product first
    const product = await createProduct();
    const userId = new mongoose.Types.ObjectId().toString();
    
    // Create cart
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0,
      status: 'active'
    });
    
    // Add item to cart - using product as IProduct
    cart.items.push({
      product: product as any, // Type assertion to avoid TS error
      unitPrice: product.price,
      quantity: 2
    });
    
    cart.totalAmount = product.price * 2;
    
    const savedCart = await cart.save();
    
    expect(savedCart.items).toHaveLength(1);
    // expect(savedCart.items[0].product.toString()).toBe(product._id.toString());
    expect(savedCart.items[0].unitPrice).toBe(product.price);
    expect(savedCart.items[0].quantity).toBe(2);
    expect(savedCart.totalAmount).toBe(product.price * 2);
  });

  it('should require userId field', async () => {
    const cart = new cartModel({
      // Missing userId
      items: [],
      totalAmount: 0,
      status: 'active'
    });
    
    // Validation should fail
    await expect(cart.save()).rejects.toThrow();
  });

  it('should require totalAmount field', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    const cart = new cartModel({
      userId,
      items: [],
      // Missing totalAmount
      status: 'active'
    });
    
    // Validation should fail
    await expect(cart.save()).rejects.toThrow();
  });

  it('should have default status as active', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    // Create without specifying status
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0
      // status not specified
    });
    
    const savedCart = await cart.save();
    
    expect(savedCart.status).toBe('active');
  });

  it('should allow status to be changed to completed', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0,
      status: 'active'
    });
    
    const savedCart = await cart.save();
    
    // Update status
    savedCart.status = 'completed';
    const updatedCart = await savedCart.save();
    
    expect(updatedCart.status).toBe('completed');
  });

  it('should reject invalid status values', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0,
      status: 'invalid-status' as any // Type assertion for testing invalid value
    });
    
    // Validation should fail
    await expect(cart.save()).rejects.toThrow();
  });

  it('should find cart by userId', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    
    // Create cart
    const cart = new cartModel({
      userId,
      items: [],
      totalAmount: 0,
      status: 'active'
    });
    
    await cart.save();
    
    // Find by userId
    const foundCart = await cartModel.findOne({ userId });
    
    expect(foundCart).toBeDefined();
    expect(foundCart!.userId.toString()).toBe(userId);
  });

  it('should require quantity to be at least 1 for cart items', async () => {
    const product = await createProduct();
    const userId = new mongoose.Types.ObjectId().toString();
    
    // Create cart with invalid quantity
    const cart = new cartModel({
      userId,
      items: [{
        product: product._id, // Just use the ID for this test
        unitPrice: product.price,
        quantity: 0 // Invalid quantity
      }],
      totalAmount: 0,
      status: 'active'
    });
    
    // Validation should fail
    await expect(cart.save()).rejects.toThrow();
  });

  it('should require unitPrice for cart items', async () => {
    const product = await createProduct();
    const userId = new mongoose.Types.ObjectId().toString();
    
    // Create cart with missing unitPrice
    const cart = new cartModel({
      userId,
      items: [{
        product: product._id, // Just use the ID for this test
        // Missing unitPrice
        quantity: 1
      }] as any, // Type assertion to bypass TS validation for testing
      totalAmount: 0,
      status: 'active'
    });
    
    // Validation should fail
    await expect(cart.save()).rejects.toThrow();
  });
});