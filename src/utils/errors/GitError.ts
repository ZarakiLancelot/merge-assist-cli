import { AppError } from './AppError';

export class GitError extends AppError {
  constructor(message: string, code: string = 'GIT_ERROR') {
    super(message, code, 400);
  }
}

export class NotAGitRepoError extends GitError {
  constructor(path?: string) {
    super(
      path 
        ? `The directory '${path}' is not a git repository`
        : 'Current directory is not a git repository',
      'NOT_A_GIT_REPO'
    );
  }
}

export class NoConflictsError extends GitError {
  constructor() {
    super('No merge conflicts found in the repository', 'NO_CONFLICTS');
  }
}

export class InvalidBranchError extends GitError {
  constructor(branch: string) {
    super(`Invalid or non-existent branch: ${branch}`, 'INVALID_BRANCH');
  }
}

export class MergeInProgressError extends GitError {
  constructor() {
    super('A merge is already in progress', 'MERGE_IN_PROGRESS');
  }
}

export class NoMergeInProgressError extends GitError {
  constructor() {
    super('No merge in progress', 'NO_MERGE_IN_PROGRESS');
  }
}
