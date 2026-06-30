import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connection-level listeners. Mongoose auto-reconnects under the hood, but
 * without these the app would silently hang on queries during an outage with
 * no signal in the logs. We log transitions so a dropped DB is diagnosable
 * instead of looking like "the server is unreachable".
 */
const registerConnectionListeners = (): void => {
  const conn = mongoose.connection;
  conn.on('connected', () => console.log('MongoDB connected'));
  conn.on('disconnected', () =>
    console.error('MongoDB disconnected — mongoose will retry automatically')
  );
  conn.on('reconnected', () => console.log('MongoDB reconnected'));
  conn.on('error', (err) => console.error('MongoDB connection error:', err));
};

export const connectDB = async (): Promise<void> => {
  registerConnectionListeners();

  // Fail fast on the *initial* connect (5s) so the process manager can restart
  // with backoff instead of the request handlers hanging on a buffering query.
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
};
