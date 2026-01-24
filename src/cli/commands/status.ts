import { Command } from 'commander';
import { GitService } from '../../infrastructure/git';
import { ConflictDetectorService } from '../../core/services';
import { logger, spinner } from '../ui';

export function statusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current merge status and conflicts overview')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        logger.setVerbose(options.verbose);
        logger.title('📊 Merge Status');

        spinner.start('Checking repository status...');

        const gitService = new GitService(options.path);
        
        await gitService.ensureGitRepository();
        
        const status = await gitService.getStatus();
        const currentBranch = status.currentBranch;
        const mergeBranch = await gitService.getMergeBranch();

        spinner.stop();

        logger.section('🔀 Branch Information');
        logger.stats('Current branch', currentBranch);
        logger.stats('Merging from', mergeBranch || 'N/A');
        logger.stats('Merge in progress', status.isMerging ? 'Yes' : 'No');
        logger.newLine();

        if (!status.isMerging) {
          logger.info('No merge in progress');
          logger.newLine();
          return;
        }

        spinner.start('Analyzing conflicts...');

        const detector = new ConflictDetectorService(options.path);
        
        try {
          const conflicts = await detector.detectConflicts(options.path);
          
          spinner.succeed('Analysis complete');

          logger.section('⚠️  Conflicts Overview');
          logger.stats('Total conflicts', conflicts.length);
          logger.stats('Affected files', new Set(conflicts.map(c => c.file)).size);
          logger.newLine();

          // Group by file
          const fileGroups = new Map<string, typeof conflicts>();
          conflicts.forEach(conflict => {
            if (!fileGroups.has(conflict.file)) {
              fileGroups.set(conflict.file, []);
            }
            fileGroups.get(conflict.file)!.push(conflict);
          });

          logger.section('📄 Files with Conflicts');
          const tableRows: string[][] = [];
          
          fileGroups.forEach((conflicts, file) => {
            tableRows.push([
              file,
              conflicts.length.toString(),
              conflicts.reduce((sum, c) => sum + c.getConflictSize(), 0).toString() + ' lines',
            ]);
          });

          logger.table(['File', 'Conflicts', 'Total Size'], tableRows);
          logger.newLine();

          logger.info('Run the following commands:');
          logger.log('  • merge-assist analyze    - Analyze conflicts with AI');
          logger.log('  • merge-assist resolve    - Resolve conflicts interactively');
          logger.log('  • merge-assist auto-resolve - Auto-resolve with AI');
          logger.newLine();

        } catch (error) {
          spinner.succeed('No conflicts detected');
          logger.newLine();
          logger.success('No conflicts found in merge! 🎉');
          logger.newLine();
        }

      } catch (error) {
        spinner.fail('Status check failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}
