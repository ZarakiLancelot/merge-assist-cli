import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import { NotAGitRepoError, GitError, NoMergeInProgressError } from '../../utils/errors';

export interface GitStatus {
  isClean: boolean;
  hasConflicts: boolean;
  conflictedFiles: string[];
  currentBranch: string;
  isMerging: boolean;
}

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repositoryPath: string = process.cwd()) {
    this.repoPath = repositoryPath;
    this.git = simpleGit(repositoryPath);
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async ensureGitRepository(): Promise<void> {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      throw new NotAGitRepoError(this.repoPath);
    }
  }

  async getStatus(): Promise<GitStatus> {
    await this.ensureGitRepository();

    const status: StatusResult = await this.git.status();
    const conflictedFiles = status.conflicted;

    return {
      isClean: status.isClean(),
      hasConflicts: conflictedFiles.length > 0,
      conflictedFiles,
      currentBranch: status.current || 'unknown',
      isMerging: await this.isMergeInProgress(),
    };
  }

  async isMergeInProgress(): Promise<boolean> {
    try {
      await this.git.revparse(['MERGE_HEAD']);
      return true;
    } catch {
      return false;
    }
  }

  async ensureMergeInProgress(): Promise<void> {
    const isMerging = await this.isMergeInProgress();
    if (!isMerging) {
      throw new NoMergeInProgressError();
    }
  }

  async getConflictedFiles(): Promise<string[]> {
    await this.ensureGitRepository();
    const status = await this.getStatus();
    return status.conflictedFiles;
  }

  async getCurrentBranch(): Promise<string> {
    await this.ensureGitRepository();
    const status = await this.getStatus();
    return status.currentBranch;
  }

  async getMergeBranch(): Promise<string | null> {
    try {
      await this.ensureMergeInProgress();
      const mergeHead = await this.git.revparse(['MERGE_HEAD']);
      const branchName = await this.git.raw(['name-rev', '--name-only', mergeHead.trim()]);
      return branchName.trim();
    } catch (error) {
      if (error instanceof NoMergeInProgressError) {
        return null;
      }
      throw new GitError('Failed to get merge branch');
    }
  }

  async getFileContent(filePath: string, ref?: string): Promise<string> {
    await this.ensureGitRepository();
    try {
      if (ref) {
        return await this.git.show([`${ref}:${filePath}`]);
      }
      const fs = await import('fs/promises');
      const path = await import('path');
      const fullPath = path.join(this.repoPath, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new GitError(`Failed to get content for ${filePath}`);
    }
  }

  async getFileContentAtRef(filePath: string, ref: string): Promise<string> {
    await this.ensureGitRepository();
    try {
      return await this.git.show([`${ref}:${filePath}`]);
    } catch (error) {
      throw new GitError(`Failed to get content for ${filePath} at ${ref}`);
    }
  }

  async stageFile(filePath: string): Promise<void> {
    await this.ensureGitRepository();
    await this.git.add(filePath);
  }

  async stageFiles(filePaths: string[]): Promise<void> {
    await this.ensureGitRepository();
    await this.git.add(filePaths);
  }

  getRepositoryPath(): string {
    return this.repoPath;
  }
}
