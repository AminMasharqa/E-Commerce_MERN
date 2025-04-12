import express, { Request, Response, NextFunction } from "express";
import { getActiveCartForUser } from "../services/cartService";
import validateJWT from "../middlewares/validateJWT";

// Use the same interface as in validateJWT.ts
interface ExtendRequest extends Request {
  user?: any;
}

const router = express.Router();

router.get('/', validateJWT, async (req: ExtendRequest, res: Response, next: NextFunction) => {
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
});

export default router;