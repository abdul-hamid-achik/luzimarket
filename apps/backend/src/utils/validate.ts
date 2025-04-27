import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema } from "zod";
import { StatusCodes } from "http-status-codes";

export const validate =
  (schema: ZodSchema): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (err) {
        if (err instanceof Error) {
          return res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
        next(err);
      }
    };