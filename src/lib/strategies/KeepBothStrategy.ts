import { Conflict } from '../../core/domain/entities';
import { BaseResolutionStrategy, StrategyResult } from './BaseResolutionStrategy';

export class KeepBothStrategy extends BaseResolutionStrategy {
  getName(): string {
    return 'both';
  }

  getDescription(): string {
    return 'Keep both changes (current first, then incoming)';
  }

  async resolve(conflict: Conflict): Promise<StrategyResult> {
    this.validateConflict(conflict);

    const content = this.mergeBothContents(conflict);
    const confidence = this.calculateConfidence(conflict);
    const explanation = this.buildExplanation(conflict);

    return this.buildResult(content, confidence, explanation);
  }

  private mergeBothContents(conflict: Conflict): string {
    const currentContent = conflict.currentContent || '';
    const incomingContent = conflict.incomingContent || '';

    if (!currentContent.trim()) {
      return incomingContent;
    }

    if (!incomingContent.trim()) {
      return currentContent;
    }

    // Add separator with context
    const separator = this.buildSeparator(conflict);

    return `${currentContent}${separator}${incomingContent}`;
  }

  private buildSeparator(conflict: Conflict): string {
    return `\n// ========================================\n// Merged: ${conflict.context.currentBranch} + ${conflict.context.targetBranch}\n// ========================================\n`;
  }

  private calculateConfidence(conflict: Conflict): number {
    const currentEmpty = !conflict.currentContent || conflict.currentContent.trim().length === 0;
    const incomingEmpty = !conflict.incomingContent || conflict.incomingContent.trim().length === 0;

    // High confidence if one side is empty
    if (currentEmpty || incomingEmpty) {
      return 95;
    }

    // Medium confidence if both are additions (different content)
    if (this.areIndependentAdditions(conflict)) {
      return 75;
    }

    // Low confidence - might create duplicates or conflicts
    return 50;
  }

  private areIndependentAdditions(conflict: Conflict): boolean {
    const currentLines = new Set(conflict.currentContent.split('\n').map(l => l.trim()));
    const incomingLines = new Set(conflict.incomingContent.split('\n').map(l => l.trim()));

    // Check if there's minimal overlap
    let overlapCount = 0;
    for (const line of currentLines) {
      if (line && incomingLines.has(line)) {
        overlapCount++;
      }
    }

    const totalLines = currentLines.size + incomingLines.size;
    const overlapRatio = totalLines > 0 ? overlapCount / totalLines : 0;

    return overlapRatio < 0.2; // Less than 20% overlap
  }

  private buildExplanation(conflict: Conflict): string {
    const currentEmpty = !conflict.currentContent || conflict.currentContent.trim().length === 0;
    const incomingEmpty = !conflict.incomingContent || conflict.incomingContent.trim().length === 0;

    if (currentEmpty && incomingEmpty) {
      return 'Both sides were empty';
    }

    if (currentEmpty) {
      return `Kept incoming changes from ${conflict.context.targetBranch} (current was empty)`;
    }

    if (incomingEmpty) {
      return `Kept current changes from ${conflict.context.currentBranch} (incoming was empty)`;
    }

    return `Merged both changes: ${conflict.context.currentBranch} followed by ${conflict.context.targetBranch}. Review for potential duplicates.`;
  }
}
