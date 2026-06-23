import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import * as usageService from '../services/usage.service';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    return;
  }

  const result = await authService.registerUser(email, password);
  res.status(201).json({ success: true, message: 'Registration successful', data: result });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const result = await authService.loginUser(email, password);
  res.json({ success: true, message: 'Login successful', data: result });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ success: true, data: user });
});

export const usage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await usageService.getUserUsage(req.user!.id);
  res.json({ success: true, data: logs });
});
