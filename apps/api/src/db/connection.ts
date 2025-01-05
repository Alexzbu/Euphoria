import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export type ConnectionState = 'up' | 'down' | 'not_configured';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  // a drop after a successful boot is different. the driver retries on its own, so
  // log it and let the health check report the degradation.
  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function getConnectionState(): ConnectionState {
  // 1 = connected, 2 = connecting. anything else can't serve queries.
  switch (mongoose.connection.readyState) {
    case 1:
      return 'up';
    case 0:
      return 'not_configured';
    default:
      return 'down';
  }
}
