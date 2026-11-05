import cors from 'cors';
import { Express } from 'express';
import express from 'express';
import { environment } from '../config/environment.js';

export function loadExpressMiddleware(app: Express): void {
  const allowedOrigins = new Set(environment.CORS_ORIGINS);

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
}
