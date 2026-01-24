import { BaseResolutionStrategy } from '../strategies/BaseResolutionStrategy';
import { KeepCurrentStrategy } from '../strategies/KeepCurrentStrategy';
import { KeepIncomingStrategy } from '../strategies/KeepIncomingStrategy';
import { KeepBothStrategy } from '../strategies/KeepBothStrategy';
import { AIAssistedStrategy } from '../strategies/AIAssistedStrategy';
import { InvalidStrategyError } from '../../utils/errors';

export class StrategyFactory {
  private strategies: Map<string, BaseResolutionStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    this.register(new KeepCurrentStrategy());
    this.register(new KeepIncomingStrategy());
    this.register(new KeepBothStrategy());
    this.register(new AIAssistedStrategy());
  }

  register(strategy: BaseResolutionStrategy): void {
    this.strategies.set(strategy.getName().toLowerCase(), strategy);
  }

  getStrategy(name: string): BaseResolutionStrategy {
    const strategy = this.strategies.get(name.toLowerCase());
    
    if (!strategy) {
      throw new InvalidStrategyError(name);
    }

    return strategy;
  }

  hasStrategy(name: string): boolean {
    return this.strategies.has(name.toLowerCase());
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  getStrategyInfo(): Array<{ name: string; description: string }> {
    return Array.from(this.strategies.values()).map(strategy => ({
      name: strategy.getName(),
      description: strategy.getDescription(),
    }));
  }
}
