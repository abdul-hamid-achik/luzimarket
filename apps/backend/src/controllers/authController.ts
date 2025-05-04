import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../schema";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";

dotenv.config();

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
      })
      .returning({ id: users.id, email: users.email, role: users.role });
    res.status(StatusCodes.CREATED).json({ user });
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "23505") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Email already in use" });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const userRecord = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = userRecord[0];
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid credentials" });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "default_jwt_secret",
    { expiresIn: "7d" }
  );
  res.json({ token });
};