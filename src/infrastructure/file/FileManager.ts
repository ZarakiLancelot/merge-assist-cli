import { promises as fs } from 'fs';
import { IFileManager } from '../../core/domain/interfaces';
import { AppError } from '../../utils/errors';

export class FileManager implements IFileManager {
  async readFile(path: string): Promise<string> {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      throw new AppError(
        `Failed to read file: ${path}`,
        'FILE_READ_ERROR',
        500
      );
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      await fs.writeFile(path, content, 'utf-8');
    } catch (error) {
      throw new AppError(
        `Failed to write file: ${path}`,
        'FILE_WRITE_ERROR',
        500
      );
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (error) {
      throw new AppError(
        `Failed to delete file: ${path}`,
        'FILE_DELETE_ERROR',
        500
      );
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await fs.copyFile(source, destination);
    } catch (error) {
      throw new AppError(
        `Failed to copy file from ${source} to ${destination}`,
        'FILE_COPY_ERROR',
        500
      );
    }
  }

  async ensureDirectory(path: string): Promise<void> {
    try {
      await fs.mkdir(path, { recursive: true });
    } catch (error) {
      throw new AppError(
        `Failed to create directory: ${path}`,
        'DIRECTORY_CREATE_ERROR',
        500
      );
    }
  }
}
