import type { Request, Response, NextFunction } from 'express';


export default function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not Found" });
}









