import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

// set before anything imports config/env.ts, which parses process.env once at
// module load and exits the process if it doesn't like what it finds. a beforeAll
// would run too late: the test file's imports have already been evaluated by then.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.WEB_ORIGIN = 'http://localhost:5173';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/euphoria-test';
process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.JWT_ACCESS_TTL = '15m';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.LOGIN_MAX_ATTEMPTS = '5';
process.env.LOGIN_LOCKOUT_MINUTES = '15';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

// wiped between tests rather than dropped: dropping takes the indexes with it, and
// several of these tests only pass because a unique index is there to refuse a write.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
