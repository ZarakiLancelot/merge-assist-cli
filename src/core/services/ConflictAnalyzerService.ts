import { Conflict } from '../domain/entities';
import { IConflictAnalyzer, ConflictAnalysis } from '../domain/interfaces';

export class ConflictAnalyzerService implements IConflictAnalyzer {
  async analyze(conflict: Conflict): Promise<ConflictAnalysis> {
    const explanation = this.generateExplanation(conflict);
    const suggestedResolution = this.generateSuggestion(conflict);
    const confidence = this.calculateConfidence(conflict);
    const risks = this.identifyRisks(conflict);

    return {
      conflict,
      explanation,
      suggestedResolution,
      confidence,
      risks,
    };
  }

  async batchAnalyze(conflicts: Conflict[]): Promise<ConflictAnalysis[]> {
    const analyses: ConflictAnalysis[] = [];

    for (const conflict of conflicts) {
      const analysis = await this.analyze(conflict);
      analyses.push(analysis);
    }

    return analyses;
  }

  private generateExplanation(conflict: Conflict): string {
    const lines = `Lines ${conflict.getLineRange()}`;
    const size = `${conflict.getConflictSize()} lines affected`;
    const branches = `${conflict.context.currentBranch} vs ${conflict.context.targetBranch}`;

    return `Conflict in ${conflict.file} (${lines}, ${size}) between ${branches}`;
  }

  private generateSuggestion(conflict: Conflict): string {
    const currentSize = conflict.currentContent.length;
    const incomingSize = conflict.incomingContent.length;

    if (currentSize === 0) {
      return 'Accept incoming changes (current is empty)';
    }

    if (incomingSize === 0) {
      return 'Keep current changes (incoming is empty)';
    }

    if (this.areContentsSimilar(conflict.currentContent, conflict.incomingContent)) {
      return 'Contents are very similar, either version should work';
    }

    if (this.isAdditionOnly(conflict)) {
      return 'Both branches added content, consider keeping both';
    }

    return 'Manual review recommended - significant differences detected';
  }

  private calculateConfidence(conflict: Conflict): number {
    let confidence = 50;

    const currentSize = conflict.currentContent.length;
    const incomingSize = conflict.incomingContent.length;

    if (currentSize === 0 || incomingSize === 0) {
      confidence = 95;
    } else if (this.areContentsSimilar(conflict.currentContent, conflict.incomingContent)) {
      confidence = 85;
    } else if (this.isAdditionOnly(conflict)) {
      confidence = 75;
    } else {
      confidence = 40;
    }

    return confidence;
  }

  private identifyRisks(conflict: Conflict): string[] {
    const risks: string[] = [];

    if (conflict.getConflictSize() > 50) {
      risks.push('Large conflict area - high complexity');
    }

    if (this.hasComplexLogic(conflict.currentContent) || this.hasComplexLogic(conflict.incomingContent)) {
      risks.push('Complex code logic detected');
    }

    if (conflict.currentContent.length > 0 && conflict.incomingContent.length > 0) {
      if (!this.areContentsSimilar(conflict.currentContent, conflict.incomingContent)) {
        risks.push('Significant differences between versions');
      }
    }

    return risks;
  }

  private areContentsSimilar(content1: string, content2: string): boolean {
    const normalized1 = this.normalizeContent(content1);
    const normalized2 = this.normalizeContent(content2);

    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity > 0.8;
  }

  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private isAdditionOnly(conflict: Conflict): boolean {
    const currentLines = conflict.currentContent.split('\n');
    const incomingLines = conflict.incomingContent.split('\n');

    return currentLines.length > 0 && incomingLines.length > 0 && 
           !currentLines.some(line => incomingLines.includes(line));
  }

  private hasComplexLogic(content: string): boolean {
    const complexPatterns = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /try\s*\{/g,
      /catch\s*\(/g,
    ];

    let complexityCount = 0;
    for (const pattern of complexPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexityCount += matches.length;
      }
    }

    return complexityCount > 2;
  }
}
