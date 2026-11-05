import pino from 'pino';
import { environment } from '../config/environment.js';

export const logger = pino({
  level: environment.LOG_LEVEL,
  redact: ['req.headers.authorization', 'password', 'passwordHash'],
});
