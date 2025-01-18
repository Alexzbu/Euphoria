import 'dotenv/config';
import { z } from 'zod';

// parsed once, here, and the process refuses to start if it doesn't match. reading
// process.env at each use site turns a missing secret into the string "undefined",
// which signs and verifies tokens quite happily.
const booleanFlag = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    WEB_ORIGIN: z.string().url(),
    MONGODB_URI: z.string().url().startsWith('mongodb'),

    // every non-empty string is truthy, so Boolean('false') is true. only take the two literals.
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(5),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),

    COOKIE_SECURE: booleanFlag('true'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
    COOKIE_DOMAIN: z.string().min(1).optional(),

    // optional as a group. you shouldn't have to register an oauth client just to
    // get the project running.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    // disk by default, since it needs no account to set up
    STORAGE_DRIVER: z.enum(['disk', 's3']).default('disk'),
    UPLOAD_DIR: z.string().min(1).default('uploads'),

    // no trailing slash. urls are built by joining this to a key with exactly one.
    MEDIA_BASE_PATH: z
      .string()
      .regex(/^\/[^/](?:.*[^/])?$/, 'MEDIA_BASE_PATH must start with "/" and not end with one')
      .default('/media'),

    // credentials deliberately aren't listed, the aws sdk finds them itself (env,
    // shared config, or an attached role) and naming them here rules the last one out.
    S3_BUCKET: z.string().min(1).optional(),
    S3_REGION: z.string().min(1).optional(),
    // for an s3-compatible store that isn't aws itself
    S3_ENDPOINT: z.string().url().optional(),
    // where images actually get fetched from when a cdn fronts the bucket
    S3_PUBLIC_BASE_URL: z.string().url().optional(),

    // the publishable key is the one you find first when you go looking, and pasting
    // it here would fail at the first charge instead of at boot
    STRIPE_SECRET_KEY: z
      .string()
      .startsWith('sk_', 'STRIPE_SECRET_KEY must be a secret key, not a publishable one')
      .optional(),

    // browsers drop a SameSite=None cookie that isn't also Secure, and it fails
    // silently: login works, cookie never arrives, next request looks expired.
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must be a webhook signing secret')
      .optional(),
  })
  // otherwise the server starts fine and dies at the first upload
  .refine((cfg) => !(cfg.COOKIE_SAME_SITE === 'none' && !cfg.COOKIE_SECURE), {
    message: 'COOKIE_SAME_SITE=none requires COOKIE_SECURE=true',
    path: ['COOKIE_SAME_SITE'],
  })
  // a webhook secret with no api key is always a copy-paste mistake
  .refine(
    (cfg) =>
      cfg.STORAGE_DRIVER !== 's3' || (cfg.S3_BUCKET !== undefined && cfg.S3_REGION !== undefined),
    {
      message: 'STORAGE_DRIVER=s3 requires S3_BUCKET and S3_REGION',
      path: ['STORAGE_DRIVER'],
    },
  )
  // all three or none. a partial set shows up as a sign-in button that only fails
  // once someone clicks it.
  .refine((cfg) => cfg.STRIPE_WEBHOOK_SECRET === undefined || cfg.STRIPE_SECRET_KEY !== undefined, {
    message: 'STRIPE_WEBHOOK_SECRET requires STRIPE_SECRET_KEY',
    path: ['STRIPE_WEBHOOK_SECRET'],
  })
  // all three or none. a partial set shows up as a sign-in button that only fails
  // once someone clicks it.
  .refine(
    (cfg) => {
      const parts = [cfg.GOOGLE_CLIENT_ID, cfg.GOOGLE_CLIENT_SECRET, cfg.GOOGLE_CALLBACK_URL];
      const provided = parts.filter((part) => part !== undefined).length;
      return provided === 0 || provided === parts.length;
    },
    {
      message:
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL must be set together or not at all',
      path: ['GOOGLE_CLIENT_ID'],
    },
  );

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // report everything at once, fixing one var per restart is miserable
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
