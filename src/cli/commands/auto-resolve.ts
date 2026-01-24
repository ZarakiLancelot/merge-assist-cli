import { Command } from 'commander';
import { DetectConflictsUseCase, AutoResolveUseCase } from '../../core/use-cases';
import { ConflictDetectorService, ConflictAnalyzerService, ConflictResolverService } from '../../core/services';
import { GitService } from '../../infrastructure/git';
import { GitValidator } from '../../utils/validators';
import { logger, spinner } from '../ui';

export function autoResolveCommand(program: Command): void {
  program
    .command('auto-resolve')
    .description('Automatically resolve conflicts using AI or specified strategy')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-s, --strategy <strategy>', 'Resolution strategy', 'ai')
    .option('-c, --min-confidence <number>', 'Minimum confidence threshold (0-100)', '70')
    .option('--skip-low-confidence', 'Skip conflicts below confidence threshold', false)
    .option('--dry-run', 'Preview changes without applying', false)
    .option('--no-backup', 'Skip creating backups', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        logger.setVerbose(options.verbose);
        logger.title('⚡ Auto-Resolving Merge Conflicts');

        spinner.start('Detecting conflicts...');

        const gitService = new GitService(options.path);
        const detector = new ConflictDetectorService(options.path);
        const validator = new GitValidator(gitService);
        const detectUseCase = new DetectConflictsUseCase(detector, validator);

        const detectResult = await detectUseCase.execute(options.path);

        if (!detectResult.hasConflicts) {
          spinner.succeed('No conflicts found');
          logger.newLine();
          logger.success('No merge conflicts to resolve! 🎉');
          logger.newLine();
          return;
        }

        spinner.update(`Auto-resolving ${detectResult.totalConflicts} conflict${detectResult.totalConflicts > 1 ? 's' : ''}...`);

        const analyzer = new ConflictAnalyzerService();
        const resolver = new ConflictResolverService();
        const autoResolveUseCase = new AutoResolveUseCase(analyzer, resolver, validator);

        const minConfidence = parseInt(options.minConfidence, 10);
        
        const result = await autoResolveUseCase.execute(detectResult.conflicts, {
          strategy: options.strategy,
          minConfidence,
          skipLowConfidence: options.skipLowConfidence,
          createBackups: options.backup,
          dryRun: options.dryRun,
        });

        spinner.succeed('Auto-resolution complete');

        // Display results
        logger.newLine();
        logger.section('📊 Resolution Summary');
        logger.stats('Total conflicts', result.totalConflicts);
        logger.stats('Resolved', result.resolved);
        logger.stats('Skipped', result.skipped);
        logger.stats('Failed', result.failed);
        logger.newLine();

        if (result.resolved > 0) {
          logger.section('✅ Successfully Resolved');
          result.resolutions.forEach(resolution => {
            logger.success(`${resolution.strategy}: Conflict ${resolution.conflictId.substring(0, 8)}`);
            if (resolution.confidence) {
              logger.stats('  Confidence', `${resolution.confidence}%`);
            }
          });
          logger.newLine();
        }

        if (result.skipped > 0) {
          logger.section('⏭️  Skipped (Low Confidence)');
          result.skippedConflicts.forEach(conflict => {
            logger.warning(`${conflict.file} (${conflict.getLineRange()})`);
          });
          logger.newLine();
        }

        if (result.failed > 0) {
          logger.section('❌ Failed');
          result.errors.forEach(({ conflict, error }) => {
            logger.error(`${conflict.file}: ${error}`);
          });
          logger.newLine();
        }

        if (options.dryRun) {
          logger.warning('DRY RUN: No changes were applied');
        } else if (result.resolved > 0) {
          logger.success(`${result.resolved} conflict${result.resolved > 1 ? 's' : ''} resolved successfully!`);
        }

        logger.newLine();

      } catch (error) {
        spinner.fail('Auto-resolution failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}
