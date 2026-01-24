import { Conflict } from '../../core/domain/entities';
import { BaseResolutionStrategy, StrategyResult } from './BaseResolutionStrategy';

export class KeepIncomingStrategy extends BaseResolutionStrategy {
  getName(): string {
    return 'incoming';
  }

  getDescription(): string {
    return 'Accept the incoming branch changes (theirs)';
  }

  async resolve(conflict: Conflict): Promise<StrategyResult> {
    this.validateConflict(conflict);

    const content = conflict.incomingContent;
    const confidence = this.calculateConfidence(conflict);
    const explanation = this.buildExplanation(conflict);

    return this.buildResult(content, confidence, explanation);
  }

  private calculateConfidence(conflict: Conflict): number {
    // High confidence if current is empty
    if (!conflict.currentContent || conflict.currentContent.trim().length === 0) {
      return 100;
    }

    // Medium confidence if incoming has content
    if (conflict.incomingContent && conflict.incomingContent.trim().length > 0) {
      return 70;
    }

    // Low confidence if incoming is empty
    return 30;
  }

  private buildExplanation(conflict: Conflict): string {
    if (!conflict.currentContent || conflict.currentContent.trim().length === 0) {
      return `Accepted incoming changes from ${conflict.context.targetBranch} (current was empty)`;
    }

    return `Accepted incoming changes from ${conflict.context.targetBranch}, discarding changes from ${conflict.context.currentBranch}`;
  }
}
