import { Conflict } from '../domain/entities';
import { IConflictDetector } from '../domain/interfaces';
import { GitService } from '../../infrastructure/git/GitService';
import { GitConflictParser } from '../../infrastructure/git/GitConflictParser';
import { NoConflictsError } from '../../utils/errors';

export class ConflictDetectorService implements IConflictDetector {
  private gitService: GitService;
  private parser: GitConflictParser;

  constructor(repositoryPath?: string) {
    this.gitService = new GitService(repositoryPath);
    this.parser = new GitConflictParser(this.gitService);
  }

  async detectConflicts(repositoryPath?: string): Promise<Conflict[]> {
    if (repositoryPath) {
      this.gitService = new GitService(repositoryPath);
      this.parser = new GitConflictParser(this.gitService);
    }

    await this.gitService.ensureGitRepository();
    await this.gitService.ensureMergeInProgress();

    const conflictedFiles = await this.gitService.getConflictedFiles();

    if (conflictedFiles.length === 0) {
      throw new NoConflictsError();
    }

    const allConflicts: Conflict[] = [];

    for (const file of conflictedFiles) {
      try {
        const conflicts = await this.parser.parseFile(file);
        allConflicts.push(...conflicts);
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to parse conflicts in ${file}:`, error);
      }
    }

    return allConflicts;
  }

  async hasConflicts(repositoryPath?: string): Promise<boolean> {
    if (repositoryPath) {
      this.gitService = new GitService(repositoryPath);
    }

    await this.gitService.ensureGitRepository();

    const status = await this.gitService.getStatus();
    return status.hasConflicts;
  }

  async getConflictedFiles(repositoryPath?: string): Promise<string[]> {
    if (repositoryPath) {
      this.gitService = new GitService(repositoryPath);
    }

    await this.gitService.ensureGitRepository();
    return await this.gitService.getConflictedFiles();
  }

  async detectConflictsInFile(filePath: string): Promise<Conflict[]> {
    await this.gitService.ensureGitRepository();
    return await this.parser.parseFile(filePath);
  }
}
