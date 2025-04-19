import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Request type to include user property
export interface ExtendRequest extends Request {
  user?: any;
}

export const validateJWT = (
  req: ExtendRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers?.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: "Authorization header is required" });
      return;
    }

    // Check for proper format: "Bearer [token]"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({ error: "Authorization format should be: Bearer [token]" });
      return;
    }

    const token = parts[1];

    if (!process.env.JWT_SECRET) {
      console.warn("JWT_SECRET environment variable is not set, using fallback secret");
      // Use the same hardcoded secret as in userService.ts if env var isn't available
      const decoded = jwt.verify(token, "zz8GafWGnbKpALuIP61nusqsUfnKH1HB");
      req.user = decoded;
      next();
      return;
    }

    // Verify the token with environment variable
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded token to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT validation error:", err);
    
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};