import { Router } from "express";
import { z } from "zod";
import { register, login, guest } from "../controllers/authController";
import { validate } from "../utils/validate";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: JWT token
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/guest:
 *   post:
 *     summary: Issue a guest token for anonymous users
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Guest JWT token
 */
router.post("/guest", guest);

export default router;