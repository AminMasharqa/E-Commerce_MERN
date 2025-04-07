import express from "express";
import mongoose from "mongoose";
import userRoute from "./routes/userRoute";
import { seedInitialProducts } from "./services/productService";
import productRoute from "./routes/productRoute"

const app = express();
const port = 3001;

app.use(express.json())



/*======================================================================================================== */
mongoose
  .connect("mongodb://localhost:27017/ecommerce")
  .then(() => console.log("mongoDB connected"))
  .catch((err) => console.log("Falid to connect to MongoDB:  ", err));
/*======================================================================================================== */


/*===============================seedInitialProducts============================================================ */
seedInitialProducts()

/*======================================================================================================== */


/*======================================================================================================== */
app.use('/user',userRoute)
app.use('/product',productRoute)



/*======================================================================================================== */
app.listen(port, () =>
  console.log(`Server is running on at: http://localhost:${port}`)
);
/*======================================================================================================== */
