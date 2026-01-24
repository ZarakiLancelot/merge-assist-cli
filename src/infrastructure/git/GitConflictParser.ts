import { ConflictEntity, ConflictContextEntity } from '../../core/domain/entities';
import { ParseError } from '../../utils/errors';
import { GitService } from './GitService';
import { randomUUID } from 'crypto';

export interface ConflictMarkers {
  current: string;
  incoming: string;
  base?: string;
}

export interface ParsedConflict {
  startLine: number;
  endLine: number;
  currentContent: string;
  incomingContent: string;
  baseContent?: string;
}

export class GitConflictParser {
  private readonly CONFLICT_START = '<<<<<<<';
  private readonly CONFLICT_SEPARATOR = '=======';
  private readonly CONFLICT_END = '>>>>>>>';
  private readonly CONFLICT_BASE = '|||||||';

  constructor(private gitService: GitService) {}

  async parseFile(filePath: string): Promise<ConflictEntity[]> {
    try {
      const content = await this.gitService.getFileContent(filePath);
      const lines = content.split('\n');
      const conflicts: ConflictEntity[] = [];
      
      const parsedConflicts = this.extractConflicts(lines);
      const context = await this.buildContext();

      for (const parsed of parsedConflicts) {
        const conflict = new ConflictEntity(
          randomUUID(),
          filePath,
          parsed.startLine,
          parsed.endLine,
          parsed.currentContent,
          parsed.incomingContent,
          context,
          'pending',
          parsed.baseContent
        );
        conflicts.push(conflict);
      }

      return conflicts;
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(filePath, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private extractConflicts(lines: string[]): ParsedConflict[] {
    const conflicts: ParsedConflict[] = [];
    let i = 0;

    while (i < lines.length) {
      if (this.isConflictStart(lines[i])) {
        const conflict = this.parseConflictBlock(lines, i);
        if (conflict) {
          conflicts.push(conflict);
          i = conflict.endLine;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }

    return conflicts;
  }

  private parseConflictBlock(lines: string[], startIndex: number): ParsedConflict | null {
    const startLine = startIndex + 1;
    let currentIndex = startIndex + 1;

    const currentLines: string[] = [];
    const incomingLines: string[] = [];
    const baseLines: string[] = [];
    
    let hasBase = false;
    let foundSeparator = false;
    let foundEnd = false;

    while (currentIndex < lines.length) {
      const line = lines[currentIndex];

      if (this.isConflictBase(line)) {
        hasBase = true;
        currentIndex++;
        continue;
      }

      if (this.isConflictSeparator(line)) {
        foundSeparator = true;
        currentIndex++;
        break;
      }

      if (hasBase) {
        baseLines.push(line);
      } else {
        currentLines.push(line);
      }
      
      currentIndex++;
    }

    if (!foundSeparator) {
      return null;
    }

    while (currentIndex < lines.length) {
      const line = lines[currentIndex];

      if (this.isConflictEnd(line)) {
        foundEnd = true;
        currentIndex++;
        break;
      }

      incomingLines.push(line);
      currentIndex++;
    }

    if (!foundEnd) {
      return null;
    }

    return {
      startLine,
      endLine: currentIndex,
      currentContent: currentLines.join('\n'),
      incomingContent: incomingLines.join('\n'),
      baseContent: hasBase ? baseLines.join('\n') : undefined,
    };
  }

  private isConflictStart(line: string): boolean {
    return line.startsWith(this.CONFLICT_START);
  }

  private isConflictSeparator(line: string): boolean {
    return line.startsWith(this.CONFLICT_SEPARATOR);
  }

  private isConflictEnd(line: string): boolean {
    return line.startsWith(this.CONFLICT_END);
  }

  private isConflictBase(line: string): boolean {
    return line.startsWith(this.CONFLICT_BASE);
  }

  private async buildContext(): Promise<ConflictContextEntity> {
    const currentBranch = await this.gitService.getCurrentBranch();
    const mergeBranch = await this.gitService.getMergeBranch();

    return new ConflictContextEntity(
      currentBranch,
      mergeBranch || 'unknown',
      undefined,
      undefined,
      new Date()
    );
  }

  hasConflictMarkers(content: string): boolean {
    return (
      content.includes(this.CONFLICT_START) &&
      content.includes(this.CONFLICT_SEPARATOR) &&
      content.includes(this.CONFLICT_END)
    );
  }

  async parseMultipleFiles(filePaths: string[]): Promise<Map<string, ConflictEntity[]>> {
    const result = new Map<string, ConflictEntity[]>();

    for (const filePath of filePaths) {
      try {
        const conflicts = await this.parseFile(filePath);
        result.set(filePath, conflicts);
      } catch (error) {
        result.set(filePath, []);
      }
    }

    return result;
  }
}
