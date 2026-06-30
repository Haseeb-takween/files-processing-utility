import type { Server } from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { ensureBaseDirs } from './utils/fileHelpers';
import { startCleanupJob } from './jobs/cleanup.job';

let server: Server | undefined;

/** Stop accepting connections, then exit. Used by both signals and crashes. */
const shutdown = (code: number, reason: string): void => {
  console.error(`Shutting down (${reason})`);
  if (!server) {
    process.exit(code);
    return;
  }
  // Stop taking new connections and let in-flight requests drain.
  server.close(() => process.exit(code));
  // Hard cap so a stuck request can't block the restart forever.
  setTimeout(() => process.exit(code), 10_000).unref();
};

/**
 * Last line of defence. Without these, a single error thrown outside the
 * Express promise chain (e.g. deep inside the PDF/pdfjs pipeline) takes the
 * whole process down with no log and no recovery. We log, then exit so the
 * process manager (PM2) restarts a clean instance.
 */
const registerProcessHandlers = (): void => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown(1, 'uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown(1, 'unhandledRejection');
  });
  // PM2/containers send SIGINT/SIGTERM on restart — exit cleanly so we don't
  // orphan connections or leave temp files mid-write.
  process.on('SIGTERM', () => shutdown(0, 'SIGTERM'));
  process.on('SIGINT', () => shutdown(0, 'SIGINT'));
};

const startServer = async (): Promise<void> => {
  if (!env.MONGODB_URI || !env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be set in environment');
  }

  registerProcessHandlers();
  ensureBaseDirs();
  await connectDB();
  startCleanupJob();

  server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });

  // Timeouts so slow/stuck clients and long PDF jobs can't pile up holding
  // sockets open indefinitely. headersTimeout must exceed keepAliveTimeout.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 120_000;
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
