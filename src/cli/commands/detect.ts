import { Command } from 'commander';
import { DetectConflictsUseCase } from '../../core/use-cases';
import { ConflictDetectorService } from '../../core/services';
import { GitService } from '../../infrastructure/git';
import { GitValidator } from '../../utils/validators';
import { logger, spinner } from '../ui';

export function detectCommand(program: Command): void {
  program
    .command('detect')
    .description('Detect merge conflicts in the current repository')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        logger.setVerbose(options.verbose);
        logger.title('🔍 Detecting Merge Conflicts');

        spinner.start('Scanning repository...');

        const gitService = new GitService(options.path);
        const detector = new ConflictDetectorService(options.path);
        const validator = new GitValidator(gitService);
        const useCase = new DetectConflictsUseCase(detector, validator);

        const result = await useCase.execute(options.path);

        spinner.succeed('Repository scan complete');

        if (!result.hasConflicts) {
          logger.newLine();
          logger.success('No merge conflicts found! 🎉');
          logger.newLine();
          return;
        }

        // Display results
        logger.newLine();
        logger.section('📊 Summary');
        logger.stats('Total conflicts', result.totalConflicts);
        logger.stats('Affected files', result.affectedFiles);
        logger.newLine();

        logger.section('📄 Conflicts by File');
        const fileGroups = new Map<string, typeof result.conflicts>();
        
        result.conflicts.forEach(conflict => {
          if (!fileGroups.has(conflict.file)) {
            fileGroups.set(conflict.file, []);
          }
          fileGroups.get(conflict.file)!.push(conflict);
        });

        fileGroups.forEach((conflicts, file) => {
          logger.conflict(file, `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`);
          conflicts.forEach(conflict => {
            logger.log(`  ${conflict.getLineRange()}: ${conflict.getConflictSize()} lines`);
          });
        });

        logger.newLine();
        logger.info(`Run 'merge-assist analyze' to get AI-powered suggestions`);
        logger.newLine();

      } catch (error) {
        spinner.fail('Detection failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}
