import { Conflict } from '../domain/entities';
import { IConflictAnalyzer, ConflictAnalysis } from '../domain/interfaces';

export interface AnalyzeConflictsResult {
  analyses: ConflictAnalysis[];
  totalAnalyzed: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
}

export class AnalyzeConflictsUseCase {
  constructor(private conflictAnalyzer: IConflictAnalyzer) {}

  async execute(conflicts: Conflict[]): Promise<AnalyzeConflictsResult> {
    if (conflicts.length === 0) {
      return this.emptyResult();
    }

    const analyses = await this.conflictAnalyzer.batchAnalyze(conflicts);
    
    const stats = this.calculateStatistics(analyses);

    return {
      analyses,
      totalAnalyzed: analyses.length,
      ...stats,
    };
  }

  async analyzeSingle(conflict: Conflict): Promise<ConflictAnalysis> {
    return await this.conflictAnalyzer.analyze(conflict);
  }

  private calculateStatistics(analyses: ConflictAnalysis[]) {
    let highConfidenceCount = 0;
    let mediumConfidenceCount = 0;
    let lowConfidenceCount = 0;

    for (const analysis of analyses) {
      if (!analysis.confidence) continue;

      if (analysis.confidence >= 80) {
        highConfidenceCount++;
      } else if (analysis.confidence >= 50) {
        mediumConfidenceCount++;
      } else {
        lowConfidenceCount++;
      }
    }

    return {
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount,
    };
  }

  private emptyResult(): AnalyzeConflictsResult {
    return {
      analyses: [],
      totalAnalyzed: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
    };
  }
}
