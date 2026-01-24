import { Conflict, Resolution } from '../domain/entities';
import { IConflictAnalyzer, IConflictResolver } from '../domain/interfaces';
import { GitValidator } from '../../utils/validators';

export interface AutoResolveOptions {
  strategy: 'ai' | 'current' | 'incoming' | 'both';
  minConfidence?: number;
  skipLowConfidence?: boolean;
  createBackups?: boolean;
  dryRun?: boolean;
}

export interface AutoResolveResult {
  totalConflicts: number;
  resolved: number;
  skipped: number;
  failed: number;
  resolutions: Resolution[];
  skippedConflicts: Conflict[];
  errors: Array<{ conflict: Conflict; error: string }>;
}

export class AutoResolveUseCase {
  private readonly DEFAULT_MIN_CONFIDENCE = 70;

  constructor(
    private conflictAnalyzer: IConflictAnalyzer,
    private conflictResolver: IConflictResolver,
    private gitValidator: GitValidator
  ) {}

  async execute(
    conflicts: Conflict[],
    options: AutoResolveOptions
  ): Promise<AutoResolveResult> {
    await this.gitValidator.validateGitRepository();

    const result: AutoResolveResult = {
      totalConflicts: conflicts.length,
      resolved: 0,
      skipped: 0,
      failed: 0,
      resolutions: [],
      skippedConflicts: [],
      errors: [],
    };

    if (conflicts.length === 0) {
      return result;
    }

    const minConfidence = options.minConfidence ?? this.DEFAULT_MIN_CONFIDENCE;

    for (const conflict of conflicts) {
      try {
        const shouldSkip = await this.shouldSkipConflict(
          conflict,
          options.strategy,
          minConfidence,
          options.skipLowConfidence
        );

        if (shouldSkip) {
          result.skipped++;
          result.skippedConflicts.push(conflict);
          conflict.skip();
          continue;
        }

        const resolution = await this.conflictResolver.resolve(conflict, options.strategy, {
          createBackup: options.createBackups ?? true,
          dryRun: options.dryRun ?? false,
        });

        if (!options.dryRun) {
          await this.conflictResolver.applyResolution(resolution);
          conflict.resolve();
        }

        result.resolved++;
        result.resolutions.push(resolution);
      } catch (error) {
        result.failed++;
        result.errors.push({
          conflict,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  private async shouldSkipConflict(
    conflict: Conflict,
    strategy: string,
    minConfidence: number,
    skipLowConfidence?: boolean
  ): Promise<boolean> {
    if (strategy !== 'ai' || !skipLowConfidence) {
      return false;
    }

    const analysis = await this.conflictAnalyzer.analyze(conflict);
    
    return (analysis.confidence ?? 0) < minConfidence;
  }

  async preview(
    conflicts: Conflict[],
    options: AutoResolveOptions
  ): Promise<AutoResolveResult> {
    return await this.execute(conflicts, { ...options, dryRun: true });
  }

  getDefaultMinConfidence(): number {
    return this.DEFAULT_MIN_CONFIDENCE;
  }
}
