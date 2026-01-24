import { Command } from 'commander';
import inquirer from 'inquirer';
import { DetectConflictsUseCase, ResolveConflictsUseCase } from '../../core/use-cases';
import { ConflictDetectorService, ConflictResolverService } from '../../core/services';
import { GitService } from '../../infrastructure/git';
import { GitValidator } from '../../utils/validators';
import { StrategyFactory } from '../../lib/patterns';
import { logger, spinner } from '../ui';

export function resolveCommand(program: Command): void {
  program
    .command('resolve')
    .description('Resolve merge conflicts interactively')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-s, --strategy <strategy>', 'Resolution strategy (current|incoming|both|ai)')
    .option('--dry-run', 'Preview changes without applying', false)
    .option('--no-backup', 'Skip creating backups', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        logger.setVerbose(options.verbose);
        logger.title('🔧 Resolving Merge Conflicts');

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

        spinner.stop();

        const resolver = new ConflictResolverService();
        const resolveUseCase = new ResolveConflictsUseCase(resolver);
        const strategyFactory = new StrategyFactory();

        let resolvedCount = 0;
        let skippedCount = 0;

        for (const conflict of detectResult.conflicts) {
          logger.newLine();
          logger.divider();
          logger.section(`📄 ${conflict.file} (${conflict.getLineRange()})`);
          logger.newLine();

          logger.log('Current branch:');
          logger.code(conflict.currentContent.substring(0, 200) + (conflict.currentContent.length > 200 ? '...' : ''));
          
          logger.log('Incoming branch:');
          logger.code(conflict.incomingContent.substring(0, 200) + (conflict.incomingContent.length > 200 ? '...' : ''));

          let strategy = options.strategy;

          if (!strategy) {
            const strategyInfo = strategyFactory.getStrategyInfo();
            const { selectedStrategy } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedStrategy',
                message: 'How do you want to resolve this conflict?',
                choices: [
                  ...strategyInfo.map(s => ({ name: `${s.name} - ${s.description}`, value: s.name })),
                  { name: 'Skip this conflict', value: 'skip' },
                ],
              },
            ]);

            if (selectedStrategy === 'skip') {
              skippedCount++;
              logger.warning('Skipped');
              continue;
            }

            strategy = selectedStrategy;
          }

          spinner.start(`Resolving with strategy: ${strategy}...`);

          const result = await resolveUseCase.execute(
            conflict,
            strategy,
            {
              dryRun: options.dryRun,
              createBackup: options.backup,
            }
          );

          if (result.success) {
            spinner.succeed(`Resolved with ${strategy} strategy`);
            resolvedCount++;
            
            if (result.backupCreated) {
              logger.debug(`Backup created: ${result.resolution.backup}`);
            }
          } else {
            spinner.fail(`Failed to resolve: ${result.error}`);
          }
        }

        // Summary
        logger.newLine();
        logger.divider();
        logger.section('✨ Resolution Summary');
        logger.stats('Total conflicts', detectResult.totalConflicts);
        logger.stats('Resolved', resolvedCount);
        logger.stats('Skipped', skippedCount);
        logger.newLine();

        if (options.dryRun) {
          logger.warning('DRY RUN: No changes were applied');
        } else {
          logger.success('Conflicts resolved successfully!');
        }
        logger.newLine();

      } catch (error) {
        spinner.fail('Resolution failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}
