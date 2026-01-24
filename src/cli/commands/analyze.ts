import { Command } from 'commander';
import { DetectConflictsUseCase, AnalyzeConflictsUseCase } from '../../core/use-cases';
import { ConflictDetectorService, ConflictAnalyzerService } from '../../core/services';
import { GitService } from '../../infrastructure/git';
import { GitValidator } from '../../utils/validators';
import { logger, spinner } from '../ui';

export function analyzeCommand(program: Command): void {
  program
    .command('analyze')
    .description('Analyze merge conflicts with AI assistance')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-f, --file <file>', 'Analyze specific file only')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        logger.setVerbose(options.verbose);
        logger.title('🤖 Analyzing Merge Conflicts');

        spinner.start('Detecting conflicts...');

        const gitService = new GitService(options.path);
        const detector = new ConflictDetectorService(options.path);
        const validator = new GitValidator(gitService);
        const detectUseCase = new DetectConflictsUseCase(detector, validator);

        const detectResult = await detectUseCase.execute(options.path);

        if (!detectResult.hasConflicts) {
          spinner.succeed('No conflicts found');
          logger.newLine();
          logger.success('No merge conflicts to analyze! 🎉');
          logger.newLine();
          return;
        }

        let conflictsToAnalyze = detectResult.conflicts;
        
        if (options.file) {
          conflictsToAnalyze = conflictsToAnalyze.filter(c => c.file === options.file);
          if (conflictsToAnalyze.length === 0) {
            spinner.fail('Analysis failed');
            logger.error(`No conflicts found in file: ${options.file}`);
            process.exit(1);
          }
        }

        spinner.update(`Analyzing ${conflictsToAnalyze.length} conflict${conflictsToAnalyze.length > 1 ? 's' : ''}...`);

        const analyzer = new ConflictAnalyzerService();
        const analyzeUseCase = new AnalyzeConflictsUseCase(analyzer);

        const analysisResult = await analyzeUseCase.execute(conflictsToAnalyze);

        spinner.succeed('Analysis complete');

        // Display results
        logger.newLine();
        logger.section('📊 Analysis Summary');
        logger.stats('Total analyzed', analysisResult.totalAnalyzed);
        logger.stats('High confidence', analysisResult.highConfidenceCount);
        logger.stats('Medium confidence', analysisResult.mediumConfidenceCount);
        logger.stats('Low confidence', analysisResult.lowConfidenceCount);
        logger.newLine();

        logger.section('📋 Detailed Analysis');
        
        analysisResult.analyses.forEach((analysis, index) => {
          logger.newLine();
          logger.log(chalk.bold(`${index + 1}. ${analysis.conflict.file}`));
          logger.log(`   Lines: ${analysis.conflict.getLineRange()}`);
          logger.log(`   ${analysis.explanation}`);
          
          if (analysis.confidence !== undefined) {
            logger.resolution('auto', analysis.confidence);
          }

          if (analysis.suggestedResolution) {
            logger.info(`   Suggestion: ${analysis.suggestedResolution}`);
          }

          if (analysis.risks && analysis.risks.length > 0) {
            logger.warning(`   Risks: ${analysis.risks.join(', ')}`);
          }
        });

        logger.newLine();
        logger.info(`Run 'merge-assist resolve' to resolve conflicts interactively`);
        logger.newLine();

      } catch (error) {
        spinner.fail('Analysis failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

// Import chalk for the analyze display
import chalk from 'chalk';
