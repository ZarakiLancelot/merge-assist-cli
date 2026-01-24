import { ConflictContext } from './ConflictContext';

export type ConflictStatus = 'pending' | 'resolved' | 'skipped';

export interface Conflict {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  currentContent: string;
  incomingContent: string;
  baseContent?: string;
  context: ConflictContext;
  status: ConflictStatus;
  resolve(): void;
  skip(): void;
  isPending(): boolean;
  isResolved(): boolean;
  getLineRange(): string;
  getConflictSize(): number;
}

export class ConflictEntity implements Conflict {
  constructor(
    public readonly id: string,
    public readonly file: string,
    public readonly startLine: number,
    public readonly endLine: number,
    public readonly currentContent: string,
    public readonly incomingContent: string,
    public readonly context: ConflictContext,
    public status: ConflictStatus = 'pending',
    public readonly baseContent?: string
  ) {}

  resolve(): void {
    this.status = 'resolved';
  }

  skip(): void {
    this.status = 'skipped';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isResolved(): boolean {
    return this.status === 'resolved';
  }

  getLineRange(): string {
    return `${this.startLine}-${this.endLine}`;
  }

  getConflictSize(): number {
    return this.endLine - this.startLine + 1;
  }
}
