import { Conflict, Resolution } from '../domain/entities';
import { IConflictResolver, ResolveOptions } from '../domain/interfaces';
import { InvalidStrategyError } from '../../utils/errors';

export interface ResolveConflictResult {
  resolution: Resolution;
  success: boolean;
  backupCreated: boolean;
  error?: string;
}

export class ResolveConflictsUseCase {
  private readonly VALID_STRATEGIES = ['current', 'incoming', 'both', 'ai', 'manual'];

  constructor(private conflictResolver: IConflictResolver) {}

  async execute(
    conflict: Conflict,
    strategy: string,
    options?: ResolveOptions
  ): Promise<ResolveConflictResult> {
    this.validateStrategy(strategy);

    try {
      const resolution = await this.conflictResolver.resolve(conflict, strategy, options);

      if (!options?.dryRun) {
        await this.conflictResolver.applyResolution(resolution, conflict);
        conflict.resolve();
      }

      return {
        resolution,
        success: true,
        backupCreated: !!resolution.backup,
      };
    } catch (error) {
      return {
        resolution: null as any,
        success: false,
        backupCreated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async revert(resolution: Resolution, conflict: Conflict): Promise<void> {
    await this.conflictResolver.revertResolution(resolution, conflict);
  }

  async resolveMultiple(
    conflicts: Conflict[],
    strategy: string,
    options?: ResolveOptions
  ): Promise<ResolveConflictResult[]> {
    const results: ResolveConflictResult[] = [];

    for (const conflict of conflicts) {
      const result = await this.execute(conflict, strategy, options);
      results.push(result);
    }

    return results;
  }

  private validateStrategy(strategy: string): void {
    if (!this.VALID_STRATEGIES.includes(strategy)) {
      throw new InvalidStrategyError(strategy);
    }
  }

  getSupportedStrategies(): string[] {
    return [...this.VALID_STRATEGIES];
  }
}
