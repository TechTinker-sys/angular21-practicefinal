import { createApp } from './app.js';
import { environment } from './config/environment.js';
import { logger } from './common/logger.js';
import { closeDatabase, connectDatabase } from './loaders/database.js';

async function startServer(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(environment.PORT, () => {
    logger.info({ port: environment.PORT }, 'Backend server listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down backend server');
    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, 'Failed to close HTTP server');
        process.exitCode = 1;
      }
      await closeDatabase();
    });
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

startServer().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start backend server');
  process.exitCode = 1;
});
