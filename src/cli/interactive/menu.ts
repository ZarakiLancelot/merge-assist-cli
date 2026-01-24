import inquirer from 'inquirer';
import { GitService } from '../../infrastructure/git';
import { logger } from '../ui';

export async function interactiveMenu(): Promise<void> {
  logger.title('🎯 Merge Assist - Interactive Mode');

  const gitService = new GitService();

  try {
    await gitService.ensureGitRepository();
  } catch (error) {
    logger.error('Not a git repository');
    process.exit(1);
  }

  let exit = false;

  while (!exit) {
    logger.newLine();
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔍 Detect conflicts', value: 'detect' },
          { name: '🤖 Analyze conflicts with AI', value: 'analyze' },
          { name: '🔧 Resolve conflicts interactively', value: 'resolve' },
          { name: '⚡ Auto-resolve conflicts', value: 'auto-resolve' },
          { name: '📊 Show merge status', value: 'status' },
          new inquirer.Separator(),
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ]);

    logger.newLine();

    switch (action) {
      case 'detect':
        await executeCommand('detect');
        break;
      case 'analyze':
        await executeCommand('analyze');
        break;
      case 'resolve':
        await executeCommand('resolve');
        break;
      case 'auto-resolve':
        const { strategy } = await inquirer.prompt([
          {
            type: 'list',
            name: 'strategy',
            message: 'Select resolution strategy:',
            choices: [
              { name: 'AI-assisted (recommended)', value: 'ai' },
              { name: 'Keep current branch', value: 'current' },
              { name: 'Accept incoming branch', value: 'incoming' },
              { name: 'Keep both changes', value: 'both' },
            ],
          },
        ]);
        await executeCommand(`auto-resolve --strategy ${strategy}`);
        break;
      case 'status':
        await executeCommand('status');
        break;
      case 'exit':
        exit = true;
        logger.success('Goodbye! 👋');
        logger.newLine();
        break;
    }

    if (!exit) {
      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Continue?',
          default: true,
        },
      ]);

      if (!shouldContinue) {
        exit = true;
        logger.success('Goodbye! 👋');
        logger.newLine();
      }
    }
  }
}

async function executeCommand(commandString: string): Promise<void> {
  // This is a simplified execution - in production, you'd parse and execute properly
  logger.info(`Executing: ${commandString}`);
  logger.divider();
  
  // In a real implementation, you'd call the actual command handlers here
}
