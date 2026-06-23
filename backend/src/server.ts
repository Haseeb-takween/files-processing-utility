import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { ensureBaseDirs } from './utils/fileHelpers';
import { startCleanupJob } from './jobs/cleanup.job';

const startServer = async (): Promise<void> => {
  if (!env.MONGODB_URI || !env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be set in environment');
  }

  ensureBaseDirs();
  await connectDB();
  startCleanupJob();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
