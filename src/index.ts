import dotenv from "dotenv";
// Load environment variables first, before other imports
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";
import { seedInitialProducts } from "./services/productService";
import productRoute from "./routes/productRoute";
import cartRoute from "./routes/cartRoute";
import path from "path";

// Check if JWT_SECRET is set, using fallback if not
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is not set");
  // Set it manually for this session if .env isn't loading properly
  process.env.JWT_SECRET = "zz8GafWGnbKpALuIP61nusqsUfnKH1HB";
}

const app = express();
const port = 3001;

app.use(express.json());

/*======================================================================================================== */
mongoose
  .connect("mongodb://localhost:27017/ecommerce")
  .then(() => console.log("mongoDB connected"))
  .catch((err) => console.log("Failed to connect to MongoDB: ", err));
/*======================================================================================================== */

/*===============================seedInitialProducts============================================================ */
seedInitialProducts();
/*======================================================================================================== */

/*======================================================================================================== */
app.use('/user', userRoute);
app.use('/product', productRoute);
app.use('/cart', cartRoute);
/*======================================================================================================== */

/*======================================================================================================== */
app.listen(port, () =>
  console.log(`Server is running on at: http://localhost:${port}`)
);
/*======================================================================================================== */