import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { ApiError } from '../errors/api-error.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request' });
    return;
  }

  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : 500;

  if (statusCode === 500) {
    logger.error({ err: error }, 'Unhandled request error');
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  res.status(statusCode).json({
    error: error instanceof Error ? error.message : 'Invalid request',
  });
};
