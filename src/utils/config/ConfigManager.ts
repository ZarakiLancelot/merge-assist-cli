import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface MergeAssistConfig {
  defaultStrategy: string;
  minConfidence: number;
  createBackups: boolean;
  backupDirectory: string;
  verbose: boolean;
  autoResolve: {
    enabled: boolean;
    skipLowConfidence: boolean;
  };
}

const DEFAULT_CONFIG: MergeAssistConfig = {
  defaultStrategy: 'ai',
  minConfidence: 70,
  createBackups: true,
  backupDirectory: '.merge-assist-backups',
  verbose: false,
  autoResolve: {
    enabled: false,
    skipLowConfidence: true,
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: MergeAssistConfig;
  private configPath: string;

  private constructor() {
    this.configPath = join(homedir(), '.merge-assist', 'config.json');
    this.config = { ...DEFAULT_CONFIG };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async load(): Promise<void> {
    try {
      const configExists = await this.fileExists(this.configPath);
      if (configExists) {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        this.config = { ...DEFAULT_CONFIG, ...userConfig };
      }
    } catch (error) {
      // Use default config if loading fails
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  async save(): Promise<void> {
    try {
      const configDir = join(homedir(), '.merge-assist');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  get(): MergeAssistConfig {
    return { ...this.config };
  }

  set(config: Partial<MergeAssistConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  getDefaultStrategy(): string {
    return this.config.defaultStrategy;
  }

  setDefaultStrategy(strategy: string): void {
    this.config.defaultStrategy = strategy;
  }

  getMinConfidence(): number {
    return this.config.minConfidence;
  }

  setMinConfidence(confidence: number): void {
    this.config.minConfidence = Math.max(0, Math.min(100, confidence));
  }

  shouldCreateBackups(): boolean {
    return this.config.createBackups;
  }

  getBackupDirectory(): string {
    return this.config.backupDirectory;
  }

  isVerbose(): boolean {
    return this.config.verbose;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

export const config = ConfigManager.getInstance();
