import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JwtUserPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
}
