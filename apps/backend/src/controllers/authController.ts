import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const strapiRes = await axios.post(`${STRAPI_URL}/api/auth/local/register`, {
      email,
      password,
      username: email, // Strapi requires username
    });
    // Strapi returns user and jwt
    res.status(StatusCodes.CREATED).json(strapiRes.data);
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.error) {
      const message = err.response.data.error.message || "Registration failed";
      return res.status(StatusCodes.BAD_REQUEST).json({ error: message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const strapiRes = await axios.post(`${STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password,
    });
    // Strapi returns user and jwt
    res.status(StatusCodes.OK).json(strapiRes.data);
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.error) {
      const message = err.response.data.error.message || "Login failed";
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

// Generate a guest token for anonymous users
export const guest = (_req: Request, res: Response) => {
  const guestId = uuidv4();
  const token = jwt.sign({ guestId }, process.env.JWT_SECRET || "default_jwt_secret", { expiresIn: "7d" });
  res.json({ token });
};