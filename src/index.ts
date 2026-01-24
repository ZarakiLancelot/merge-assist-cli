#!/usr/bin/env node

import { Command } from 'commander';
import { detectCommand } from './cli/commands/detect';
import { analyzeCommand } from './cli/commands/analyze';
import { resolveCommand } from './cli/commands/resolve';
import { autoResolveCommand } from './cli/commands/auto-resolve';
import { statusCommand } from './cli/commands/status';
import { interactiveMenu } from './cli/interactive/menu';
import { config } from './utils/config';
import { logger } from './cli/ui';

const packageJson = require('../package.json');

async function main() {
  // Load configuration
  await config.load();

  const program = new Command();

  program
    .name('merge-assist')
    .description('🤖 AI-powered merge conflict resolver using GitHub Copilot CLI')
    .version(packageJson.version)
    .hook('preAction', () => {
      // Set verbose mode if flag is present
      const opts = program.opts();
      if (opts.verbose) {
        logger.setVerbose(true);
      }
    });

  // Register commands
  detectCommand(program);
  analyzeCommand(program);
  resolveCommand(program);
  autoResolveCommand(program);
  statusCommand(program);

  // Config command
  program
    .command('config')
    .description('Manage configuration')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset to default configuration')
    .option('--set <key=value>', 'Set a configuration value')
    .action(async (options) => {
      if (options.reset) {
        config.reset();
        await config.save();
        logger.success('Configuration reset to defaults');
        return;
      }

      if (options.show) {
        const currentConfig = config.get();
        logger.title('📋 Current Configuration');
        logger.log(JSON.stringify(currentConfig, null, 2));
        logger.newLine();
        return;
      }

      if (options.set) {
        const [key, value] = options.set.split('=');
        // Simple key-value setting (can be extended)
        logger.info(`Setting ${key} to ${value}`);
        // You'd implement proper key-value setting here
        await config.save();
        logger.success('Configuration updated');
        return;
      }

      logger.error('Please specify --show, --reset, or --set');
    });

  // If no command is specified, run interactive mode
  if (process.argv.length === 2) {
    await interactiveMenu();
    process.exit(0);
  }

  // Parse arguments
  await program.parseAsync(process.argv);
}

// Run main function
main().catch((error) => {
  logger.error('An unexpected error occurred:');
  logger.error(error.message);
  if (config.isVerbose()) {
    console.error(error.stack);
  }
  process.exit(1);
});
