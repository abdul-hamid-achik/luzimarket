import { Request, Response } from 'express';
import { vi } from 'vitest';

export function makeReq(
  body: any = {},
  params: any = {},
  user: any = undefined
): Request {
  const req = { body, params } as Partial<Request>;
  if (user !== undefined) {
    (req as any).user = user;
  }
  return req as Request;
}

export function makeRes(): Response {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}