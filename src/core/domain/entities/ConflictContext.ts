export interface ConflictContext {
  currentBranch: string;
  targetBranch: string;
  commitMessage?: string;
  author?: string;
  timestamp?: Date;
  relatedFiles?: string[];
}

export class ConflictContextEntity implements ConflictContext {
  constructor(
    public readonly currentBranch: string,
    public readonly targetBranch: string,
    public readonly commitMessage?: string,
    public readonly author?: string,
    public readonly timestamp?: Date,
    public readonly relatedFiles?: string[]
  ) {}

  getBranchInfo(): string {
    return `${this.currentBranch} <- ${this.targetBranch}`;
  }

  hasRelatedFiles(): boolean {
    return !!this.relatedFiles && this.relatedFiles.length > 0;
  }
}
