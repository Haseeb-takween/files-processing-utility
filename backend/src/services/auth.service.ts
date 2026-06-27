import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { AppError } from '../utils/asyncHandler';

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) => {
  if (!name || !email || !password || !confirmPassword) {
    throw new AppError('All fields are required', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  if (!email.includes('@')) {
    throw new AppError('Invalid email address', 400);
  }

  if (!name.trim()) {
    throw new AppError('Name is required', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name: name.trim(), email, password: hashedPassword });

  return { message: 'User created successfully' };
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new AppError('All fields are required', 400);
  }

  if (!email.includes('@')) {
    throw new AppError('Invalid email address', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid password', 400);
  }

  const token = jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    message: 'Login successful',
    user: { name: user.name, email: user.email },
    token,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select('name email');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return { name: user.name, email: user.email };
};
