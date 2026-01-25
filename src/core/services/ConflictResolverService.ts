import { Conflict, Resolution, ResolutionEntity } from '../domain/entities';
import { IConflictResolver, ResolveOptions } from '../domain/interfaces';
import { FileManager } from '../../infrastructure/file/FileManager';
import { BackupManager } from '../../infrastructure/file/BackupManager';
import { AIResolverService } from './AIResolverService';
import { ResolutionError, InvalidStrategyError } from '../../utils/errors';
import { randomUUID } from 'crypto';

export class ConflictResolverService implements IConflictResolver {
  private fileManager: FileManager;
  private backupManager: BackupManager;
  private aiResolver: AIResolverService;

  constructor() {
    this.fileManager = new FileManager();
    this.backupManager = new BackupManager();
    this.aiResolver = new AIResolverService();
  }

  async resolve(
    conflict: Conflict,
    strategy: string,
    options?: ResolveOptions
  ): Promise<Resolution> {
    const resolvedContent = await this.getResolvedContent(conflict, strategy);
    
    let backup: string | undefined;
    if (options?.createBackup !== false && !options?.dryRun) {
      try {
        backup = await this.backupManager.createBackup(conflict.file);
      } catch (error) {
        console.warn(`Failed to create backup for ${conflict.file}:`, error);
      }
    }

    const resolution = new ResolutionEntity(
      randomUUID(),
      conflict.id,
      strategy,
      resolvedContent,
      new Date(),
      backup,
      strategy === 'ai' ? undefined : 100
    );

    return resolution;
  }

  async applyResolution(resolution: Resolution, conflict: Conflict): Promise<void> {
    try {
      const currentContent = await this.fileManager.readFile(conflict.file);
      const updatedContent = this.replaceConflictInContent(
        currentContent,
        conflict,
        resolution.resolvedContent
      );

      await this.fileManager.writeFile(conflict.file, updatedContent);
    } catch (error) {
      if (resolution.backup) {
        await this.backupManager.restoreBackup(resolution.backup, conflict.file);
      }
      throw new ResolutionError(
        resolution.conflictId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async revertResolution(resolution: Resolution, conflict: Conflict): Promise<void> {
    if (!resolution.backup) {
      throw new ResolutionError(resolution.conflictId, 'No backup available for revert');
    }

    try {
      await this.backupManager.restoreBackup(resolution.backup, conflict.file);
    } catch (error) {
      throw new ResolutionError(
        resolution.conflictId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async getResolvedContent(conflict: Conflict, strategy: string): Promise<string> {
    switch (strategy.toLowerCase()) {
      case 'current':
        return conflict.currentContent;

      case 'incoming':
        return conflict.incomingContent;

      case 'both':
        return this.mergeBoth(conflict);

      case 'ai':
        const aiResolution = await this.aiResolver.resolveWithAI(conflict);
        return aiResolution.resolvedContent;

      case 'manual':
        return conflict.currentContent;

      default:
        throw new InvalidStrategyError(strategy);
    }
  }

  private mergeBoth(conflict: Conflict): string {
    return `${conflict.currentContent}\n${conflict.incomingContent}`;
  }

  private replaceConflictInContent(
    content: string,
    conflict: Conflict,
    resolvedContent: string
  ): string {
    const lines = content.split('\n');
    const beforeConflict = lines.slice(0, conflict.startLine - 1);
    const afterConflict = lines.slice(conflict.endLine);

    return [
      ...beforeConflict,
      resolvedContent,
      ...afterConflict,
    ].join('\n');
  }

  setBackupDirectory(directory: string): void {
    this.backupManager = new BackupManager(directory);
  }
}
