import { Request, Response } from 'express';

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
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}