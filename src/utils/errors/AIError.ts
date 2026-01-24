import { AppError } from './AppError';

export class AIError extends AppError {
  constructor(message: string, code: string = 'AI_ERROR') {
    super(message, code, 503);
  }
}

export class CopilotNotAvailableError extends AIError {
  constructor() {
    super(
      'GitHub Copilot CLI is not available. Please ensure gh copilot is installed and configured',
      'COPILOT_NOT_AVAILABLE'
    );
  }
}

export class AIResponseError extends AIError {
  constructor(reason?: string) {
    super(
      `Failed to get valid response from AI${reason ? `: ${reason}` : ''}`,
      'AI_RESPONSE_ERROR'
    );
  }
}

export class AITimeoutError extends AIError {
  constructor() {
    super('AI request timed out', 'AI_TIMEOUT');
  }
}
