import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT_ERROR') {
    super(message, code, 400);
  }
}

export class ParseError extends ConflictError {
  constructor(file: string, reason?: string) {
    super(
      `Failed to parse conflicts in file '${file}'${reason ? `: ${reason}` : ''}`,
      'PARSE_ERROR'
    );
  }
}

export class ResolutionError extends ConflictError {
  constructor(conflictId: string, reason?: string) {
    super(
      `Failed to resolve conflict '${conflictId}'${reason ? `: ${reason}` : ''}`,
      'RESOLUTION_ERROR'
    );
  }
}

export class InvalidStrategyError extends ConflictError {
  constructor(strategy: string) {
    super(`Invalid resolution strategy: ${strategy}`, 'INVALID_STRATEGY');
  }
}

export class BackupError extends ConflictError {
  constructor(file: string, reason?: string) {
    super(
      `Failed to create backup for '${file}'${reason ? `: ${reason}` : ''}`,
      'BACKUP_ERROR'
    );
  }
}
