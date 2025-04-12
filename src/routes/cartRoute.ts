import express, { Request, Response, NextFunction } from "express";
import {
  addItemToCart,
  getActiveCartForUser,
  updateItemInCart,
} from "../services/cartService";
import {validateJWT} from "../middlewares/validateJWT";
import { ExtendRequest } from "../types/extendedRequest";

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
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).send("An error occurred while fetching the cart");
    }
  }
);

router.post(
  "/items",
  validateJWT,
  async (req: ExtendRequest, res: Response) => {
    try {
      const userId = req?.user?._id;
      const { productId, quantity } = req.body;

      const response = await addItemToCart({ userId, productId, quantity });

      // Handle different response types correctly:
      if (typeof response.data === "string") {
        // For string responses, set the content type explicitly
        res
          .status(response.statusCode || 500)
          .contentType("text/plain")
          .send(response.data);
      } else if (response.data === null || response.data === undefined) {
        // Handle null/undefined
        res.status(response.statusCode || 500).end();
      } else {
        // For object responses, use json()
        res.status(response.statusCode || 500).json(response.data);
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).send("An unexpected error occurred");
    }
  }
);


// Then in your route handler:
router.put("/items", validateJWT, async (req: ExtendRequest, res: Response) => {
  try {
    const userId = req?.user?._id;
    const { productId, quantity } = req.body;
    
    // Validate required fields
    if (!productId || quantity === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return; // Return without a value
    }

    const response = await updateItemInCart({ userId, productId, quantity });
    res.status(response.statusCode || 200).send(response.data);
    // No return statement here
  } catch (error) {
    console.error("Error updating item in cart:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
    // No return statement here
  }
});
export default router;
