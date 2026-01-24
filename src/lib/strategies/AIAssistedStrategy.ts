import { Conflict } from '../../core/domain/entities';
import { BaseResolutionStrategy, StrategyResult } from './BaseResolutionStrategy';
import { AIResolverService } from '../../core/services/AIResolverService';

export class AIAssistedStrategy extends BaseResolutionStrategy {
  private aiResolver: AIResolverService;

  constructor() {
    super();
    this.aiResolver = new AIResolverService();
  }

  getName(): string {
    return 'ai';
  }

  getDescription(): string {
    return 'Use AI (GitHub Copilot) to intelligently resolve the conflict';
  }

  async resolve(conflict: Conflict): Promise<StrategyResult> {
    this.validateConflict(conflict);

    try {
      const aiResolution = await this.aiResolver.resolveWithAI(conflict);

      return this.buildResult(
        aiResolution.resolvedContent,
        aiResolution.confidence,
        this.buildExplanation(conflict, aiResolution.explanation)
      );
    } catch (error) {
      // Fallback to current content if AI fails
      return this.buildFallbackResult(conflict, error);
    }
  }

  private buildExplanation(conflict: Conflict, aiExplanation: string): string {
    return `AI-assisted resolution for ${conflict.file}: ${aiExplanation}`;
  }

  private buildFallbackResult(conflict: Conflict, error: unknown): StrategyResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return this.buildResult(
      conflict.currentContent,
      0,
      `AI resolution failed (${errorMessage}). Keeping current changes as fallback.`
    );
  }

  async testAIAvailability(): Promise<boolean> {
    return await this.aiResolver.testConnection();
  }
}
