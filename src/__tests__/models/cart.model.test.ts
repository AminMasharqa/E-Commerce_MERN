// src/__tests__/models/cart.model.test.ts
import mongoose from 'mongoose';
import { cartModel, ICart } from '../../models/cartModel';
import productModel from '../../models/productModel';

// Create a MongoDB memory server for testing
// Note: This requires installing 'mongodb-memory-server' package
// npm install --save-dev mongodb-memory-server
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

describe('Cart Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await cartModel.deleteMany({});
    await productModel.deleteMany({});
  });

  it('should create a new cart with required fields', async () => {
    const cartData = {
      userId: new mongoose.Types.ObjectId(),
      totalAmount: 0,
      status: 'active' as const
    };

    const cart = new cartModel(cartData);
    const savedCart = await cart.save();

    expect(savedCart._id).toBeDefined();
    expect(savedCart.userId.toString()).toBe(cartData.userId.toString());
    expect(savedCart.totalAmount).toBe(0);
    expect(savedCart.status).toBe('active');
    expect(savedCart.items).toEqual([]);
  });

  it('should not create a cart without required fields', async () => {
    const cartWithoutUserId = new cartModel({
      totalAmount: 0,
      status: 'active'
    });

    await expect(cartWithoutUserId.save()).rejects.toThrow();
  });

  it('should not allow invalid status values', async () => {
    const cartWithInvalidStatus = new cartModel({
      userId: new mongoose.Types.ObjectId(),
      totalAmount: 0,
      status: 'invalid-status'
    });

    await expect(cartWithInvalidStatus.save()).rejects.toThrow();
  });

  it('should add items to cart', async () => {
    // First create a product
    const product = await productModel.create({
      title: 'Test Product',
      image: 'test.jpg',
      price: 25,
      stock: 10
    });

    // Create a cart
    const cart = await cartModel.create({
      userId: new mongoose.Types.ObjectId(),
      totalAmount: 0,
      status: 'active'
    });

    // Add an item to the cart
    cart.items.push({
      product: product,
      quantity: 2,
      unitPrice: product.price
    });

    // Update total amount
    cart.totalAmount = product.price * 2;
    
    const savedCart = await cart.save();

    expect(savedCart.items.length).toBe(1);
    expect(savedCart.items[0].quantity).toBe(2);
    expect(savedCart.items[0].unitPrice).toBe(25);
    expect(savedCart.totalAmount).toBe(50);
  });

  it('should retrieve a cart with populated product data', async () => {
    // Create a product
    const product = await productModel.create({
      title: 'Test Product',
      image: 'test.jpg',
      price: 30,
      stock: 15
    });

    // Create a cart with the product
    const newCart = await cartModel.create({
      userId: new mongoose.Types.ObjectId(),
      totalAmount: 60,
      status: 'active',
      items: [{
        product: product._id,
        quantity: 2,
        unitPrice: product.price
      }]
    });

    // Retrieve the cart with populated product data
    const retrievedCart = await cartModel
      .findById(newCart._id)
      .populate('items.product');

    expect(retrievedCart).toBeDefined();
    expect(retrievedCart!.items.length).toBe(1);
    
    // Check if the product is properly populated
    const populatedProduct = retrievedCart!.items[0].product as any;
    expect(populatedProduct.title).toBe('Test Product');
    expect(populatedProduct.price).toBe(30);
  });

  it('should update cart status', async () => {
    const cart = await cartModel.create({
      userId: new mongoose.Types.ObjectId(),
      totalAmount: 0,
      status: 'active'
    });

    // Update cart status to completed
    cart.status = 'completed';
    const updatedCart = await cart.save();

    expect(updatedCart.status).toBe('completed');
  });
});