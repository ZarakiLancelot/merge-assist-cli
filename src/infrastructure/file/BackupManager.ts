import { join, basename } from 'path';
import { promises as fs } from 'fs';
import { IBackupManager } from '../../core/domain/interfaces';
import { BackupError } from '../../utils/errors';
import { FileManager } from './FileManager';

export class BackupManager implements IBackupManager {
  private readonly backupDir: string;
  private fileManager: FileManager;

  constructor(backupDirectory: string = '.merge-assist-backups') {
    this.backupDir = backupDirectory;
    this.fileManager = new FileManager();
  }

  async createBackup(filePath: string): Promise<string> {
    try {
      const exists = await this.fileManager.fileExists(filePath);
      if (!exists) {
        throw new BackupError(filePath, 'File does not exist');
      }

      await this.ensureBackupDirectory();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = basename(filePath);
      const backupFileName = `${fileName}.${timestamp}.backup`;
      const backupPath = join(this.backupDir, backupFileName);

      await this.fileManager.copyFile(filePath, backupPath);

      return backupPath;
    } catch (error) {
      if (error instanceof BackupError) {
        throw error;
      }
      throw new BackupError(
        filePath,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async restoreBackup(backupPath: string, originalPath: string): Promise<void> {
    try {
      const exists = await this.fileManager.fileExists(backupPath);
      if (!exists) {
        throw new BackupError(backupPath, 'Backup file does not exist');
      }

      await this.fileManager.copyFile(backupPath, originalPath);
    } catch (error) {
      if (error instanceof BackupError) {
        throw error;
      }
      throw new BackupError(
        backupPath,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async deleteBackup(backupPath: string): Promise<void> {
    try {
      const exists = await this.fileManager.fileExists(backupPath);
      if (exists) {
        await this.fileManager.deleteFile(backupPath);
      }
    } catch (error) {
      throw new BackupError(
        backupPath,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async listBackups(filePath?: string): Promise<string[]> {
    try {
      await this.ensureBackupDirectory();

      const files = await fs.readdir(this.backupDir);

      if (filePath) {
        const fileName = basename(filePath);
        return files
          .filter(file => file.startsWith(fileName) && file.endsWith('.backup'))
          .map(file => join(this.backupDir, file));
      }

      return files
        .filter(file => file.endsWith('.backup'))
        .map(file => join(this.backupDir, file));
    } catch (error) {
      return [];
    }
  }

  async clearAllBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      for (const backup of backups) {
        await this.deleteBackup(backup);
      }
    } catch (error) {
      throw new BackupError(
        'all',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    await this.fileManager.ensureDirectory(this.backupDir);
  }

  getBackupDirectory(): string {
    return this.backupDir;
  }
}
