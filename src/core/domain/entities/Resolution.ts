export interface Resolution {
  id: string;
  conflictId: string;
  strategy: string;
  resolvedContent: string;
  appliedAt: Date;
  backup?: string;
  confidence?: number;
}

export class ResolutionEntity implements Resolution {
  constructor(
    public readonly id: string,
    public readonly conflictId: string,
    public readonly strategy: string,
    public readonly resolvedContent: string,
    public readonly appliedAt: Date,
    public readonly backup?: string,
    public readonly confidence?: number
  ) {}

  hasBackup(): boolean {
    return !!this.backup;
  }

  isHighConfidence(): boolean {
    return this.confidence !== undefined && this.confidence >= 80;
  }

  isMediumConfidence(): boolean {
    return this.confidence !== undefined && this.confidence >= 50 && this.confidence < 80;
  }

  isLowConfidence(): boolean {
    return this.confidence !== undefined && this.confidence < 50;
  }

  getConfidenceLevel(): 'high' | 'medium' | 'low' | 'unknown' {
    if (this.confidence === undefined) return 'unknown';
    if (this.confidence >= 80) return 'high';
    if (this.confidence >= 50) return 'medium';
    return 'low';
  }
}
