export interface IFileManager {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
}

export interface IBackupManager {
  createBackup(filePath: string): Promise<string>;
  restoreBackup(backupPath: string, originalPath: string): Promise<void>;
  deleteBackup(backupPath: string): Promise<void>;
  listBackups(filePath?: string): Promise<string[]>;
}
