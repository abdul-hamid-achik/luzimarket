import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users, carts } from "@/schema";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";

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
  // Check for guest token in Authorization header to merge carts
  let guestIdFromToken: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token) {
      try {
        const decodedGuest = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret") as any;
        guestIdFromToken = decodedGuest.guestId;
      } catch {
        // ignore invalid guest token
      }
    }
  }
  // Merge guest cart into user cart if guestId present
  if (guestIdFromToken) {
    const existingGuestCart = await db.select().from(carts).where(eq(carts.guestId, guestIdFromToken)).limit(1);
    if (existingGuestCart.length > 0) {
      await db.update(carts)
        .set({ userId: user.id, guestId: null })
        .where(eq(carts.guestId, guestIdFromToken));
    }
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "default_jwt_secret",
    { expiresIn: "7d" }
  );
  res.json({ token });
};

// Generate a guest token for anonymous users
export const guest = (_req: Request, res: Response) => {
  const guestId = uuidv4();
  const token = jwt.sign({ guestId }, process.env.JWT_SECRET || "default_jwt_secret", { expiresIn: "7d" });
  res.json({ token });
};