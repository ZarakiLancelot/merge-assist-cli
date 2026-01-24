import { Conflict } from '../../core/domain/entities';

export interface StrategyResult {
  content: string;
  confidence: number;
  explanation: string;
}

export abstract class BaseResolutionStrategy {
  abstract getName(): string;
  abstract getDescription(): string;
  abstract resolve(conflict: Conflict): Promise<StrategyResult>;

  protected validateConflict(conflict: Conflict): void {
    if (!conflict) {
      throw new Error('Conflict is required');
    }
    if (!conflict.file) {
      throw new Error('Conflict file is required');
    }
  }

  protected buildResult(content: string, confidence: number, explanation: string): StrategyResult {
    return {
      content,
      confidence,
      explanation,
    };
  }
}
