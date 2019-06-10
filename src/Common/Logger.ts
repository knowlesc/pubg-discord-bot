import * as path from 'path';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  transports: [
    new (transports.Console)({
      level: process.env.LOGLEVEL || 'info',
      format: format.combine(
        format.align(),
        format.colorize(),
        format.simple())
    }),
    new (transports.File)({
      filename: path.join(path.dirname(require.main.filename), '../app.log'),
      level: 'debug',
      options: { flags: 'w' },
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) =>
          `${timestamp} ${level.padStart(8)}: ${message}`))
    })
  ]
});

export class Logger {
  constructor(private name: string) {

  }

  debug(message: string, category?: string) {
    logger.log('debug', this.buildMessage(message, category));
  }

  info(message: string, category?: string) {
    logger.log('info', this.buildMessage(message, category));
  }

  error(error: string | Error, category?: string) {
    const message = error instanceof Error
      ? `${error.name}: ${error.message}`
      : `Error: ${error}`;

    logger.log('error', this.buildMessage(message, category));
  }

  private buildMessage(message: string, category?: string) {
    return `[${category || this.name}] ${message}`;
  }
}
