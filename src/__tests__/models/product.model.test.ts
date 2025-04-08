import mongoose from 'mongoose';
import productModel, { IProduct } from '../../models/productModel';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock data
const mockProduct = {
  title: 'Test Product',
  image: 'test-image.jpg',
  price: 99.99,
  stock: 50
};

// Define a type for Mongoose validation error
interface MongooseValidationError extends mongoose.Error.ValidationError {
  errors: {
    [path: string]: mongoose.Error.ValidatorError | mongoose.Error.CastError;
  };
}

describe('Product Model', () => {
  let mongoServer: MongoMemoryServer;

  // Connect to an in-memory database before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Clear database between tests
  afterEach(async () => {
    await productModel.deleteMany({});
  });

  // Disconnect after all tests
  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('should create & save a product successfully', async () => {
    const validProduct = new productModel(mockProduct);
    const savedProduct = await validProduct.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.title).toBe(mockProduct.title);
    expect(savedProduct.image).toBe(mockProduct.image);
    expect(savedProduct.price).toBe(mockProduct.price);
    expect(savedProduct.stock).toBe(mockProduct.stock);
  });

  it('should not create product without required fields', async () => {
    const invalidProduct = new productModel({ price: 10 });
    let err: MongooseValidationError | null = null;
    
    try {
      await invalidProduct.save();
    } catch (error) {
      // Type assertion to handle the error properly
      if (error instanceof mongoose.Error.ValidationError) {
        err = error;
      }
    }
    
    // Make sure we caught a validation error
    expect(err).not.toBeNull();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors.title).toBeDefined();
    expect(err?.errors.image).toBeDefined();
  });

  it('should default stock to 0 if not provided', async () => {
    const productWithoutStock = new productModel({
      title: 'No Stock Product',
      image: 'no-stock.jpg',
      price: 19.99
      // stock intentionally omitted
    });
    
    const savedProduct = await productWithoutStock.save();
    expect(savedProduct.stock).toBe(0);
  });
});