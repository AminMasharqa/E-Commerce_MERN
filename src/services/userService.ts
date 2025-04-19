import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";

interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

// Add this interface to properly type MongoDB documents
interface UserDocument extends Document {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const register = async ({
  firstName,
  lastName,
  email,
  password,
}: RegisterParams) => {
  const findUser = await userModel.findOne({ email });

  if (findUser) {
    return { data: "User Already exists!", statusCode: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new userModel({
    email,
    password: hashedPassword,
    firstName,
    lastName,
  }) as UserDocument;
  await newUser.save();

  // Safely convert _id to string
  const userId = newUser._id ? newUser._id.toString() : null;

  return {
    data: generateJWT({
      firstName,
      lastName,
      email,
      _id: userId,
    }),
    statusCode: 200,
  };
};

export const login = async ({ email, password }: LoginParams) => {
  const findUser = (await userModel.findOne({ email })) as UserDocument | null;

  if (!findUser) {
    return { data: "Incorrect email or password!", statusCode: 400 };
  }

  const passwordMatch = await bcrypt.compare(password, findUser.password);

  if (passwordMatch) {
    // Safely convert _id to string
    const userId = findUser._id ? findUser._id.toString() : null;

    return {
      data: generateJWT({
        email,
        firstName: findUser.firstName,
        lastName: findUser.lastName,
        _id: userId,
      }),
      statusCode: 200,
    };
  }

  return { data: "Incorrect email or password!", statusCode: 401 };
};

const generateJWT = (data: any) => {
  if (!process.env.JWT_SECRET) {
    console.error("WARNING: JWT_SECRET environment variable is not set");
    // Fall back to hardcoded secret if environment variable isn't set
    return jwt.sign(data, "zz8GafWGnbKpALuIP61nusqsUfnKH1HB");
  }
  return jwt.sign(data, process.env.JWT_SECRET);
};

export default { register, login };