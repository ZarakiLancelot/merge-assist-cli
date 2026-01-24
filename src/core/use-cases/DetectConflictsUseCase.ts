import { Conflict } from '../domain/entities';
import { IConflictDetector } from '../domain/interfaces';
import { GitValidator } from '../../utils/validators';

export interface DetectConflictsResult {
  conflicts: Conflict[];
  totalConflicts: number;
  affectedFiles: number;
  hasConflicts: boolean;
}

export class DetectConflictsUseCase {
  constructor(
    private conflictDetector: IConflictDetector,
    private gitValidator: GitValidator
  ) {}

  async execute(repositoryPath?: string): Promise<DetectConflictsResult> {
    await this.gitValidator.validateGitRepository();
    await this.gitValidator.validateMergeInProgress();

    const conflicts = await this.conflictDetector.detectConflicts(repositoryPath);
    const affectedFiles = new Set(conflicts.map(c => c.file)).size;

    return {
      conflicts,
      totalConflicts: conflicts.length,
      affectedFiles,
      hasConflicts: conflicts.length > 0,
    };
  }

  async hasConflicts(repositoryPath?: string): Promise<boolean> {
    await this.gitValidator.validateGitRepository();
    return await this.conflictDetector.hasConflicts(repositoryPath);
  }
}
