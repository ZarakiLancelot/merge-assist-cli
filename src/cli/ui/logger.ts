import chalk from 'chalk';

export class Logger {
  private verbose: boolean = false;

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
    }
  }

  log(message: string): void {
    console.log(message);
  }

  title(message: string): void {
    console.log('\n' + chalk.bold.cyan(message));
    console.log(chalk.cyan('─'.repeat(message.length)) + '\n');
  }

  section(message: string): void {
    console.log('\n' + chalk.bold(message));
  }

  conflict(file: string, lines: string): void {
    console.log(chalk.yellow('⚠'), chalk.bold(file), chalk.gray(`(${lines})`));
  }

  resolution(strategy: string, confidence: number): void {
    const confidenceColor = this.getConfidenceColor(confidence);
    console.log(
      chalk.green('✓'),
      'Strategy:',
      chalk.bold(strategy),
      '-',
      'Confidence:',
      confidenceColor(`${confidence}%`)
    );
  }

  stats(label: string, value: number | string): void {
    console.log(chalk.gray('  •'), label + ':', chalk.bold.white(value));
  }

  divider(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }

  newLine(): void {
    console.log();
  }

  box(title: string, content: string[]): void {
    const width = 60;
    console.log('\n' + chalk.cyan('┌' + '─'.repeat(width - 2) + '┐'));
    console.log(chalk.cyan('│') + chalk.bold.cyan(` ${title}`.padEnd(width - 1)) + chalk.cyan('│'));
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    
    content.forEach(line => {
      console.log(chalk.cyan('│') + ` ${line}`.padEnd(width - 1) + chalk.cyan('│'));
    });
    
    console.log(chalk.cyan('└' + '─'.repeat(width - 2) + '┘') + '\n');
  }

  code(content: string, language?: string): void {
    const lines = content.split('\n');
    console.log(chalk.gray('```' + (language || '')));
    lines.forEach((line, index) => {
      console.log(chalk.gray(`${(index + 1).toString().padStart(3)}│`), line);
    });
    console.log(chalk.gray('```'));
  }

  table(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((header, i) => {
      const maxRowWidth = Math.max(...rows.map(row => row[i]?.length || 0));
      return Math.max(header.length, maxRowWidth) + 2;
    });

    // Header
    console.log(
      chalk.bold(
        headers.map((h, i) => h.padEnd(columnWidths[i])).join(' │ ')
      )
    );

    // Separator
    console.log(
      chalk.gray(
        columnWidths.map(w => '─'.repeat(w)).join('─┼─')
      )
    );

    // Rows
    rows.forEach(row => {
      console.log(
        row.map((cell, i) => cell.padEnd(columnWidths[i])).join(' │ ')
      );
    });
  }

  private getConfidenceColor(confidence: number): (text: string) => string {
    if (confidence >= 80) return chalk.green;
    if (confidence >= 50) return chalk.yellow;
    return chalk.red;
  }
}

export const logger = new Logger();
