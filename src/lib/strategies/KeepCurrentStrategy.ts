import { Conflict } from '../../core/domain/entities';
import { BaseResolutionStrategy, StrategyResult } from './BaseResolutionStrategy';

export class KeepCurrentStrategy extends BaseResolutionStrategy {
  getName(): string {
    return 'current';
  }

  getDescription(): string {
    return 'Keep the current branch changes (yours)';
  }

  async resolve(conflict: Conflict): Promise<StrategyResult> {
    this.validateConflict(conflict);

    const content = conflict.currentContent;
    const confidence = this.calculateConfidence(conflict);
    const explanation = this.buildExplanation(conflict);

    return this.buildResult(content, confidence, explanation);
  }

  private calculateConfidence(conflict: Conflict): number {
    // High confidence if incoming is empty
    if (!conflict.incomingContent || conflict.incomingContent.trim().length === 0) {
      return 100;
    }

    // Medium confidence if current has content
    if (conflict.currentContent && conflict.currentContent.trim().length > 0) {
      return 70;
    }

    // Low confidence if current is empty
    return 30;
  }

  private buildExplanation(conflict: Conflict): string {
    if (!conflict.incomingContent || conflict.incomingContent.trim().length === 0) {
      return `Kept current changes from ${conflict.context.currentBranch} (incoming was empty)`;
    }

    return `Kept current changes from ${conflict.context.currentBranch}, discarding changes from ${conflict.context.targetBranch}`;
  }
}
