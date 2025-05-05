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
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret", (err, user) => {
      if (err) {
        return res.sendStatus(StatusCodes.FORBIDDEN);
      }
      req.user = user as AuthRequest["user"];
      next();
    });
  } else {
    res.sendStatus(StatusCodes.UNAUTHORIZED);
  }
};