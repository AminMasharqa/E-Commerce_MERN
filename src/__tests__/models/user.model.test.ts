import mongoose from 'mongoose';
import userModel, { IUser } from '../../models/userModel';

// Helper function to create a valid user object
const createValidUser = () => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'password123'
});

describe('User Model', () => {
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

  // Clear collection before each test
  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it('should create a new user successfully', async () => {
    const userData = createValidUser();
    const user = new userModel(userData);
    const savedUser = await user.save();
    
    // Check that the saved user has the correct properties
    expect(savedUser._id).toBeDefined();
    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).toBe(userData.password);
  });

  it('should require firstName field', async () => {
    const userData = createValidUser();
    delete (userData as any).firstName;
    
    const user = new userModel(userData);
    
    // Validation should fail
    await expect(user.save()).rejects.toThrow();
  });

  it('should require lastName field', async () => {
    const userData = createValidUser();
    delete (userData as any).lastName;
    
    const user = new userModel(userData);
    
    // Validation should fail
    await expect(user.save()).rejects.toThrow();
  });

  it('should require email field', async () => {
    const userData = createValidUser();
    delete (userData as any).email;
    
    const user = new userModel(userData);
    
    // Validation should fail
    await expect(user.save()).rejects.toThrow();
  });

  it('should require password field', async () => {
    const userData = createValidUser();
    delete (userData as any).password;
    
    const user = new userModel(userData);
    
    // Validation should fail
    await expect(user.save()).rejects.toThrow();
  });

  it('should find a user by email', async () => {
    // Create a user first
    const userData = createValidUser();
    await new userModel(userData).save();
    
    // Find by email
    const foundUser = await userModel.findOne({ email: userData.email });
    
    expect(foundUser).toBeDefined();
    expect(foundUser!.firstName).toBe(userData.firstName);
    expect(foundUser!.lastName).toBe(userData.lastName);
  });

  it('should update a user successfully', async () => {
    // Create a user first
    const userData = createValidUser();
    const user = await new userModel(userData).save();
    
    // Update the user
    user.firstName = 'Jane';
    const updatedUser = await user.save();
    
    expect(updatedUser.firstName).toBe('Jane');
    
    // Verify by fetching from DB again
    const fetchedUser = await userModel.findById(user._id);
    expect(fetchedUser!.firstName).toBe('Jane');
  });

  it('should delete a user successfully', async () => {
    // Create a user first
    const userData = createValidUser();
    const user = await new userModel(userData).save();
    
    // Delete the user
    await userModel.deleteOne({ _id: user._id });
    
    // Try to find the deleted user
    const deletedUser = await userModel.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});