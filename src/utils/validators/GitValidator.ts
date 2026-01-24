import { GitService } from '../../infrastructure/git';
import { NotAGitRepoError, NoMergeInProgressError } from '../errors';

export class GitValidator {
  constructor(private gitService: GitService) {}

  async validateGitRepository(): Promise<void> {
    const isRepo = await this.gitService.isGitRepository();
    if (!isRepo) {
      throw new NotAGitRepoError(this.gitService.getRepositoryPath());
    }
  }

  async validateMergeInProgress(): Promise<void> {
    await this.validateGitRepository();
    
    const isMerging = await this.gitService.isMergeInProgress();
    if (!isMerging) {
      throw new NoMergeInProgressError();
    }
  }

  async validateHasConflicts(): Promise<void> {
    await this.validateGitRepository();
    
    const status = await this.gitService.getStatus();
    if (!status.hasConflicts) {
      const { NoConflictsError } = await import('../errors');
      throw new NoConflictsError();
    }
  }

  async validateAll(): Promise<void> {
    await this.validateGitRepository();
    await this.validateMergeInProgress();
    await this.validateHasConflicts();
  }
}
