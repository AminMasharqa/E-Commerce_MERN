import express, { Request, Response, NextFunction } from "express";
import { addItemToCart, getActiveCartForUser } from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

// Use the same interface as in validateJWT.ts

const router = express.Router();

router.get(
  "/",
  validateJWT,
  async (req: ExtendRequest, res: Response, next: NextFunction) => {
    try {
      // Get the userId from the user object attached by validateJWT middleware
      const userId = req.user?._id;

      if (!userId) {
        res.status(400).send("User ID not found in token");
        return;
      }

      const cart = await getActiveCartForUser({ userId: userId.toString() });
      res.status(200).send(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).send("An error occurred while fetching the cart");
    }
  }
);

router.post("/items", validateJWT, async (req:ExtendRequest, res:Response) => {
    const userId = req?.user?._id;

    const {productId, quantity} = req.body;

    const response = await addItemToCart({userId, productId, quantity});

    res.status(response.statusCode || 500).send(response.data);
});

export default router;
