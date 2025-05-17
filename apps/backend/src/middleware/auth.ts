import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";

dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    id?: number;
    email?: string;
    role?: string;
    guestId?: string;
  };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.sendStatus(StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    req.user = user as AuthRequest["user"];
    return next();
  } catch {
    return res.sendStatus(StatusCodes.FORBIDDEN);
  }
};