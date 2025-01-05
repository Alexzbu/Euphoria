import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';

const port = env.PORT;

await connectDatabase();

const server = createApp().listen(port, () => {
  logger.info({ port, env: env.NODE_ENV }, 'API listening');
});

server.on('error', (error: NodeJS.ErrnoException) => {
  // exit non-zero rather than only logging. a process that failed to bind is no use
  // alive, and a supervisor can only react to what it can observe.
  if (error.code === 'EADDRINUSE') {
    logger.fatal({ port }, 'Port is already in use');
    process.exit(1);
  }
  if (error.code === 'EACCES') {
    logger.fatal({ port }, 'Port requires elevated privileges');
    process.exit(1);
  }
  throw error;
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  });
}
