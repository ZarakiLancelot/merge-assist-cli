import { exec } from 'child_process';
import { promisify } from 'util';
import { Conflict } from '../domain/entities';
import { CopilotNotAvailableError, AIResponseError, AITimeoutError } from '../../utils/errors';

const execAsync = promisify(exec);

export interface AIResolution {
  resolvedContent: string;
  explanation: string;
  confidence: number;
}

export class AIResolverService {
  private readonly TIMEOUT_MS = 30000; // 30 seconds

  async resolveWithAI(conflict: Conflict): Promise<AIResolution> {
    await this.ensureCopilotAvailable();

    const prompt = this.buildPrompt(conflict);
    const response = await this.queryCopilot(prompt);
    
    return this.parseResponse(response, conflict);
  }

  async batchResolveWithAI(conflicts: Conflict[]): Promise<AIResolution[]> {
    const resolutions: AIResolution[] = [];

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveWithAI(conflict);
        resolutions.push(resolution);
      } catch (error) {
        // Return a fallback resolution on error
        resolutions.push({
          resolvedContent: conflict.currentContent,
          explanation: `AI resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
        });
      }
    }

    return resolutions;
  }

  private async ensureCopilotAvailable(): Promise<void> {
    try {
      await execAsync('gh copilot --version', { timeout: 5000 });
    } catch (error) {
      throw new CopilotNotAvailableError();
    }
  }

  private buildPrompt(conflict: Conflict): string {
    return `
You are a senior software engineer resolving a git merge conflict.

File: ${conflict.file}
Lines: ${conflict.getLineRange()}
Branches: ${conflict.context.currentBranch} <- ${conflict.context.targetBranch}

CURRENT BRANCH (${conflict.context.currentBranch}):
\`\`\`
${conflict.currentContent}
\`\`\`

INCOMING BRANCH (${conflict.context.targetBranch}):
\`\`\`
${conflict.incomingContent}
\`\`\`

${conflict.baseContent ? `BASE VERSION:\n\`\`\`\n${conflict.baseContent}\n\`\`\`\n` : ''}

Task: Provide the best resolution that:
1. Preserves functionality from both branches
2. Follows best practices and clean code principles
3. Maintains code consistency

Respond in this format:
RESOLUTION:
<resolved code here>

EXPLANATION:
<brief explanation>

CONFIDENCE: <0-100>
`.trim();
  }

  private async queryCopilot(prompt: string): Promise<string> {
    try {
      const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      
      const { stdout, stderr } = await execAsync(
        `echo "${escapedPrompt}" | gh copilot suggest -t shell`,
        { 
          timeout: this.TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 10, // 10MB
        }
      );

      if (stderr && !stdout) {
        throw new AIResponseError(stderr);
      }

      return stdout;
    } catch (error: any) {
      if (error.killed || error.signal === 'SIGTERM') {
        throw new AITimeoutError();
      }
      throw new AIResponseError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private parseResponse(response: string, conflict: Conflict): AIResolution {
    try {
      const resolutionMatch = response.match(/RESOLUTION:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
      const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i);
      const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);

      const resolvedContent = resolutionMatch 
        ? resolutionMatch[1].trim().replace(/^```[\w]*\n?|```$/g, '').trim()
        : conflict.currentContent;

      const explanation = explanationMatch 
        ? explanationMatch[1].trim() 
        : 'AI provided resolution';

      const confidence = confidenceMatch 
        ? Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)))
        : 50;

      return {
        resolvedContent,
        explanation,
        confidence,
      };
    } catch (error) {
      throw new AIResponseError('Failed to parse AI response');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureCopilotAvailable();
      return true;
    } catch {
      return false;
    }
  }
}
