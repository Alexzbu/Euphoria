import { Router } from 'express';

export type DependencyStatus = 'up' | 'down' | 'not_configured';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  checks: {
    database: DependencyStatus;
  };
}

export const healthRouter: Router = Router();

// unauthenticated on purpose, container orchestrators and uptime monitors have no
// credentials. reports liveness facts only, never configuration.
// TODO: the database check is a placeholder until the mongo connection lands.
healthRouter.get('/health', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database: 'not_configured' },
  };

  res.json(body);
});
