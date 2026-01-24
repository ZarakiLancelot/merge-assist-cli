import { Conflict } from '../entities';

export interface ConflictAnalysis {
  conflict: Conflict;
  explanation: string;
  suggestedResolution?: string;
  confidence?: number;
  risks?: string[];
}

export interface IConflictAnalyzer {
  analyze(conflict: Conflict): Promise<ConflictAnalysis>;
  batchAnalyze(conflicts: Conflict[]): Promise<ConflictAnalysis[]>;
}
