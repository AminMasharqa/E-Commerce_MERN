import express, { Response, NextFunction } from "express";
import {
  addItemToCart,
  deletItemInCart,
  getActiveCartForUser,
  updateItemInCart,
} from "../services/cartService";
import { validateJWT, ExtendRequest } from "../middlewares/validateJWT";

const router = express.Router();

// Helper function to safely get user ID from request
function getUserIdFromRequest(req: ExtendRequest): string | null {
  if (req.user && req.user._id) {
    return req.user._id.toString();
  }
  return null;
}

// Debug route to verify token and user information
router.get(
  "/debug-token",
  validateJWT,
  (req: ExtendRequest, res: Response) => {
    res.json({
      user: req.user,
      message: "Token is valid"
    });
  }
);

// Get active cart for user
router.get(
  "/",
  validateJWT,
  async (req: ExtendRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserIdFromRequest(req);

      if (!userId) {
        res.status(400).json({ error: "User ID not found in token" });
        return;
      }

      const cart = await getActiveCartForUser({ userId });
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "An error occurred while fetching the cart" });
    }
  }
);

// Add item to cart
router.post(
  "/items",
  validateJWT,
  async (req: ExtendRequest, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(400).json({ error: "User ID not found in token" });
        return;
      }

      const { productId, quantity } = req.body;
      
      if (!productId || quantity === undefined) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

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
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

// Update item in cart
router.put(
  "/items", 
  validateJWT, 
  async (req: ExtendRequest, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(400).json({ error: "User ID not found in token" });
        return;
      }

      const { productId, quantity } = req.body;

      // Validate required fields
      if (!productId || quantity === undefined) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const response = await updateItemInCart({ userId, productId, quantity });
      res.status(response.statusCode || 200).send(response.data);
    } catch (error) {
      console.error("Error updating item in cart:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

// Delete item from cart
router.delete(
  "/items/:productId",
  validateJWT,
  async (req: ExtendRequest, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(400).json({ error: "User ID not found in token" });
        return;
      }

      const { productId } = req.params;
      const response = await deletItemInCart({ userId, productId });
      res.status(response.statusCode).send(response.data);
    } catch (error) {
      console.error("Error deleting item from cart:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

export default router;