import { Conflict, Resolution } from '../entities';

export interface ResolveOptions {
  dryRun?: boolean;
  createBackup?: boolean;
  validate?: boolean;
}

export interface IConflictResolver {
  resolve(conflict: Conflict, strategy: string, options?: ResolveOptions): Promise<Resolution>;
  applyResolution(resolution: Resolution, conflict: Conflict): Promise<void>;
  revertResolution(resolution: Resolution, conflict: Conflict): Promise<void>;
}
