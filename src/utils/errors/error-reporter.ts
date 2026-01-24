/**
 * Enhanced error report generation for PRP Pipeline
 *
 * @module utils/errors/error-reporter
 *
 * @remarks
 * Main error report builder that integrates timeline tracking, impact analysis,
 * fix suggestions, and resume commands to generate comprehensive ERROR_REPORT.md files.
 *
 * @example
 * ```typescript
 * import { ErrorReportBuilder } from './error-reporter.js';
 *
 * const builder = new ErrorReportBuilder(logger, new Date(), 'session123');
 * const report = await builder.generateReport(failures, context);
 * await writeFile('ERROR_REPORT.md', report, 'utf-8');
 * ```
 */

import type { Logger } from '../logger.js';
import type {
  TaskFailure,
  ReportContext,
  TaskImpact,
  SuggestedFix,
} from './types.js';
import { TimelineTracker } from './timeline-tracker.js';
import { ImpactAnalyzer } from './impact-analyzer.js';
import { RecommendationEngine } from './recommendation-engine.js';
import { ResumeCommandBuilder } from './resume-command-builder.js';
import { StackTraceFormatter } from './stack-trace-formatter.js';
import {
  isTaskError,
  isAgentError,
  isValidationError,
  isSessionError,
  isEnvironmentError,
} from '../errors.js';

/**
 * Enhanced error report builder
 *
 * @remarks
 * Integrates all error reporting components to generate comprehensive
 * markdown reports with timeline, impact analysis, fixes, and commands.
 */
export class ErrorReportBuilder {
  #logger: Logger;
  #timelineTracker: TimelineTracker;
  #stackTraceFormatter: StackTraceFormatter;
  #resumeCommandBuilder: ResumeCommandBuilder;
  #recommendationEngine: RecommendationEngine;

  /**
   * Create a new error report builder
   *
   * @param logger - Logger instance for output
   * @param startTime - Pipeline start time
   * @param sessionId - Session identifier
   */
  constructor(logger: Logger, startTime: Date, sessionId: string) {
    this.#logger = logger;
    this.#timelineTracker = new TimelineTracker(sessionId, startTime);
    this.#stackTraceFormatter = new StackTraceFormatter();
    this.#resumeCommandBuilder = new ResumeCommandBuilder();
    this.#recommendationEngine = new RecommendationEngine();
  }

  /**
   * Generate complete error report
   *
   * @param failures - Map of task ID to failure details
   * @param context - Report generation context
   * @returns Complete markdown error report
   *
   * @remarks
   * Assembles all report sections into the final ERROR_REPORT.md format.
   */
  async generateReport(
    failures: Map<string, TaskFailure>,
    context: ReportContext
  ): Promise<string> {
    // Build timeline from failures
    for (const failure of failures.values()) {
      this.#timelineTracker.addEntry({
        timestamp: failure.timestamp,
        level: 'error',
        taskId: failure.taskId,
        event: `${failure.taskTitle} failed`,
        details: failure.error.message,
      });
    }

    // Analyze impact, generate fixes, and build commands for each failure
    const impactAnalyzer = new ImpactAnalyzer(context.backlog);
    const impactAnalysis = new Map<string, TaskImpact>();
    const suggestedFixes = new Map<string, SuggestedFix[]>();
    const resumeCommands = new Map<string, string[]>();

    for (const [taskId, failure] of failures) {
      // Impact analysis
      const impact = impactAnalyzer.analyzeImpact(taskId);
      impactAnalysis.set(taskId, impact);

      // Suggested fixes
      const fixes = this.#recommendationEngine.generateFixes(failure.error, {
        taskId: failure.taskId,
        sessionPath: context.sessionPath,
      });
      suggestedFixes.set(taskId, fixes);

      // Resume commands
      const commands = [
        this.#resumeCommandBuilder.buildRetryCommand(taskId, context.sessionId),
        this.#resumeCommandBuilder.buildSkipCommand(taskId, context.sessionId),
      ];
      resumeCommands.set(taskId, commands);
    }

    // Build report sections
    const sections: string[] = [];

    sections.push(this.#buildHeader(context));
    sections.push(this.#buildSummary(failures, context));
    sections.push(this.#buildTimeline());
    sections.push(
      await this.#buildFailures(
        failures,
        impactAnalysis,
        suggestedFixes,
        resumeCommands
      )
    );
    sections.push(this.#buildErrorCategories(failures));
    sections.push(this.#buildImpactAnalysis(impactAnalysis));
    sections.push(this.#buildNextSteps(failures, resumeCommands, context));

    return sections.join('\n\n');
  }

  /**
   * Build report header section
   */
  #buildHeader(context: ReportContext): string {
    return `# Error Report

**Generated**: ${new Date().toISOString()}
**Pipeline Mode**: ${context.pipelineMode}
**Continue on Error**: ${context.continueOnError ? 'Yes' : 'No'}
**Session**: ${context.sessionId}`;
  }

  /**
   * Build summary statistics section
   */
  #buildSummary(
    failures: Map<string, TaskFailure>,
    context: ReportContext
  ): string {
    const failedCount = failures.size;
    const successRate =
      context.totalTasks > 0
        ? ((context.completedTasks / context.totalTasks) * 100).toFixed(1)
        : '0.0';

    return `## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | ${context.totalTasks} |
| Completed | ${context.completedTasks} |
| Failed | ${failedCount} |
| Success Rate | ${successRate}% |`;
  }

  /**
   * Build timeline section
   */
  #buildTimeline(): string {
    const summary = this.#timelineTracker.getSummary();

    return `## Error Timeline

\`\`\`
${this.#timelineTracker.formatTimeline('vertical')}
\`\`\`

**Timeline Summary**:
- First error at: ${summary.firstErrorAt.toISOString()}
- Error frequency: ${summary.errorCount} error${summary.errorCount !== 1 ? 's' : ''}
- Total duration: ${this.#formatDuration(summary.totalDuration)}${
      summary.lastErrorAt
        ? `
- Error span: ${this.#formatDuration(summary.errorSpan)}`
        : ''
    }`;
  }

  /**
   * Build detailed failures section
   */
  async #buildFailures(
    failures: Map<string, TaskFailure>,
    impactAnalysis: Map<string, TaskImpact>,
    suggestedFixes: Map<string, SuggestedFix[]>,
    resumeCommands: Map<string, string[]>
  ): Promise<string> {
    const sections: string[] = ['## Failed Tasks', ''];

    let index = 1;
    for (const [taskId, failure] of failures) {
      sections.push(`### ${index}. ${taskId}: ${failure.taskTitle}`);
      sections.push('');
      sections.push(`**Phase**: ${failure.phase || 'Unknown'}`);
      sections.push(`**Milestone**: ${failure.milestone || 'N/A'}`);
      sections.push(`**Failed At**: ${failure.timestamp.toISOString()}`);
      sections.push('');

      // Stack trace with context
      const stackTrace = await this.#stackTraceFormatter.formatStackTrace(
        failure.error
      );
      sections.push('**Error Details**:');
      sections.push('```typescript');
      sections.push(
        `Error: ${failure.error.message}${
          failure.errorCode ? ` (${failure.errorCode})` : ''
        }`
      );

      if (stackTrace.frames.length > 0) {
        const topFrame = stackTrace.frames[0];
        sections.push(
          `    at ${topFrame.functionName} (${topFrame.filePath}:${topFrame.line}${
            topFrame.column ? `:${topFrame.column}` : ''
          })`
        );

        for (const frame of stackTrace.frames.slice(1, 4)) {
          sections.push(
            `    at ${frame.functionName} (${frame.filePath}:${frame.line}${
              frame.column ? `:${frame.column}` : ''
            })`
          );
        }
      }

      if (stackTrace.frames.length > 4) {
        sections.push(`    ... ${stackTrace.frames.length - 4} more frames`);
      }
      sections.push('```');
      sections.push('');

      // Source context if available
      if (stackTrace.sourceContext) {
        sections.push('**Source Context**:');
        sections.push('```typescript');
        const { codeLines, errorLineIndex } = stackTrace.sourceContext;
        const startLine = stackTrace.sourceContext.line - errorLineIndex - 1;
        for (let i = 0; i < codeLines.length; i++) {
          const prefix = i === errorLineIndex ? '>' : ' ';
          const lineNum = (startLine + i + 1).toString().padStart(4, ' ');
          sections.push(`${prefix} ${lineNum}  ${codeLines[i]}`);
        }
        sections.push('```');
        sections.push('');
      }

      // Impact analysis
      const impact = impactAnalysis.get(taskId);
      if (impact) {
        sections.push('**Affected Tasks**:');
        sections.push(
          `- ${ImpactAnalyzer.getImpactIcon(impact.level)} **${ImpactAnalyzer.formatImpactLevel(impact.level)} IMPACT**: ${impact.affectedTasks.length} task${impact.affectedTasks.length !== 1 ? 's' : ''} blocked`
        );
        if (impact.affectedTasks.length > 0) {
          sections.push(
            impact.affectedTasks.map(t => `  - \`${t}\``).join('\n')
          );
        }
        sections.push('');
      }

      // Suggested fixes
      const fixes = suggestedFixes.get(taskId);
      if (fixes && fixes.length > 0) {
        sections.push('**Suggested Fixes**:');
        for (const fix of fixes) {
          sections.push(
            `${fix.priority}. **${fix.description}${fix.explanation ? `**\n   ${fix.explanation}` : ''}**`
          );
          if (fix.command) {
            sections.push(`   \`\`\`bash`);
            sections.push(`   $ ${fix.command}`);
            sections.push(`   \`\`\``);
          }
          if (fix.docsUrl) {
            sections.push(`   Documentation: ${fix.docsUrl}`);
          }
        }
        sections.push('');
      }

      // Resume commands
      const commands = resumeCommands.get(taskId);
      if (commands && commands.length > 0) {
        sections.push('**Resume Commands**:');
        sections.push('```bash');
        for (const cmd of commands) {
          const desc = this.#resumeCommandBuilder.getCommandDescription(cmd);
          sections.push(`# ${desc}`);
          sections.push(`$ ${cmd}`);
        }
        sections.push('```');
      }

      sections.push('---');
      sections.push('');
      index++;
    }

    return sections.join('\n');
  }

  /**
   * Build error categories breakdown section
   */
  #buildErrorCategories(failures: Map<string, TaskFailure>): string {
    const categories = {
      taskError: 0,
      agentError: 0,
      validationError: 0,
      sessionError: 0,
      environmentError: 0,
      other: 0,
    };

    for (const failure of failures.values()) {
      if (isTaskError(failure.error)) categories.taskError++;
      else if (isAgentError(failure.error)) categories.agentError++;
      else if (isValidationError(failure.error)) categories.validationError++;
      else if (isSessionError(failure.error)) categories.sessionError++;
      else if (isEnvironmentError(failure.error)) categories.environmentError++;
      else categories.other++;
    }

    const total = failures.size;

    return `## Error Categories

| Category | Count | Percentage |
|----------|-------|------------|
| **TaskError** | ${categories.taskError} | ${this.#calculatePercentage(categories.taskError, total)}% |
| **ValidationError** | ${categories.validationError} | ${this.#calculatePercentage(categories.validationError, total)}% |
| **AgentError** | ${categories.agentError} | ${this.#calculatePercentage(categories.agentError, total)}% |
| **SessionError** | ${categories.sessionError} | ${this.#calculatePercentage(categories.sessionError, total)}% |
| **EnvironmentError** | ${categories.environmentError} | ${this.#calculatePercentage(categories.environmentError, total)}% |
| **Other** | ${categories.other} | ${this.#calculatePercentage(categories.other, total)}% |`;
  }

  /**
   * Build impact analysis summary section
   */
  #buildImpactAnalysis(impactAnalysis: Map<string, TaskImpact>): string {
    const sections: string[] = ['## Impact Analysis', ''];

    let totalBlocked = 0;
    const totalPhases = new Set<string>();
    const totalMilestones = new Set<string>();
    let maxCascadeDepth = 0;

    for (const impact of impactAnalysis.values()) {
      totalBlocked += impact.affectedTasks.length;
      impact.blockedPhases.forEach(p => totalPhases.add(p));
      impact.blockedMilestones.forEach(m => totalMilestones.add(m));
      if (impact.cascadeDepth > maxCascadeDepth) {
        maxCascadeDepth = impact.cascadeDepth;
      }
    }

    // Determine overall impact level
    let overallImpact: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    if (totalPhases.size >= 2) overallImpact = 'critical';
    else if (totalPhases.size === 1 || totalMilestones.size >= 3)
      overallImpact = 'high';
    else if (totalMilestones.size >= 1 || totalBlocked >= 5)
      overallImpact = 'medium';
    else if (totalBlocked >= 1) overallImpact = 'low';

    sections.push(
      `**Critical Path Impact**: ${ImpactAnalyzer.getImpactIcon(overallImpact)} ${ImpactAnalyzer.formatImpactLevel(overallImpact)}`
    );
    sections.push(`- Phases blocked: ${totalPhases.size}`);
    sections.push(`- Milestones blocked: ${totalMilestones.size}`);
    sections.push(`- Total tasks blocked: ${totalBlocked}`);
    sections.push(`- Max cascade depth: ${maxCascadeDepth}`);
    sections.push('');

    sections.push('**Blocked Tasks Summary**:');
    sections.push(`- Total blocked: ${totalBlocked} tasks`);
    sections.push(`- Blocked phases: ${totalPhases.size || 0}`);
    sections.push(`- Blocked milestones: ${totalMilestones.size || 0}`);
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Build next steps section
   */
  #buildNextSteps(
    failures: Map<string, TaskFailure>,
    resumeCommands: Map<string, string[]>,
    context: ReportContext
  ): string {
    const sections: string[] = ['## Next Steps', ''];

    sections.push(
      '1. Review error timeline above to understand error sequence'
    );
    sections.push('2. Fix the errors listed above:');

    let index = 1;
    for (const [taskId, failure] of failures) {
      sections.push(
        `   ${index}. **${taskId}**: ${failure.error.message.split('\n')[0]}`
      );
      sections.push(`      - Location: ${failure.phase || 'Unknown phase'}`);
      index++;
    }

    sections.push('3. Resume pipeline execution:');
    const firstTask = failures.keys().next().value;
    const commands = resumeCommands.get(firstTask ?? '');
    if (commands && commands.length > 0) {
      sections.push('   ```bash');
      sections.push(`   $ ${commands[0]}`);
      sections.push('   ```');
    }

    sections.push('');
    sections.push(
      `**Report Location**: ${context.sessionPath}/ERROR_REPORT.md`
    );

    return sections.join('\n');
  }

  /**
   * Calculate percentage for display
   */
  #calculatePercentage(value: number, total: number): string {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  }

  /**
   * Format duration in milliseconds to human-readable
   */
  #formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

/**
 * Re-export ImpactAnalyzer for static method access
 */
export { ImpactAnalyzer } from './impact-analyzer.js';
