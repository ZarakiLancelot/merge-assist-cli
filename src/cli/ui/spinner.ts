import { logger } from './logger';

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string = '';

  start(message: string): void {
    this.message = message;
    this.currentFrame = 0;
    
    this.interval = setInterval(() => {
      process.stdout.write('\r' + this.frames[this.currentFrame] + ' ' + this.message);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  update(message: string): void {
    this.message = message;
  }

  succeed(message?: string): void {
    this.stop();
    logger.success(message || this.message);
  }

  fail(message?: string): void {
    this.stop();
    logger.error(message || this.message);
  }

  warn(message?: string): void {
    this.stop();
    logger.warning(message || this.message);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r' + ' '.repeat(this.message.length + 10) + '\r');
    }
  }
}

export const spinner = new Spinner();
