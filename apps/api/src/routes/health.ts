import { Router } from 'express';
import { getConnectionState, type ConnectionState } from '../db/connection.js';

export type DependencyStatus = ConnectionState;

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
// credentials. reports liveness facts only, never configuration. a degraded database
// answers 503, so a load balancer pulls this instance out of rotation instead of
// routing traffic it can't serve.
healthRouter.get('/health', (_req, res) => {
  const database = getConnectionState();
  const body: HealthResponse = {
    status: database === 'up' ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database },
  };

  res.status(body.status === 'ok' ? 200 : 503).json(body);
});
