import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const validateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers?.authorization;

  if (!authHeader) {
    res.status(403).send('Authorization header was not provided');
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(403).send('Bearer token not found');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      res.status(403).send('Invalid token payload');
      return;
    }

    // Attach decoded token to request (optional)
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(403).send('Token verification failed');
  }
};
