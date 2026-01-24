import { Conflict } from '../entities';

export interface IConflictDetector {
  detectConflicts(repositoryPath?: string): Promise<Conflict[]>;
  hasConflicts(repositoryPath?: string): Promise<boolean>;
}
