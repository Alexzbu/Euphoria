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

    COOKIE_SECURE: booleanFlag('true'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
    COOKIE_DOMAIN: z.string().min(1).optional(),

    // optional as a group. you shouldn't have to register an oauth client just to
    // get the project running.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),
  })
  // otherwise the server starts fine and dies at the first upload
  .refine((cfg) => !(cfg.COOKIE_SAME_SITE === 'none' && !cfg.COOKIE_SECURE), {
    message: 'COOKIE_SAME_SITE=none requires COOKIE_SECURE=true',
    path: ['COOKIE_SAME_SITE'],
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
