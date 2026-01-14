# LLM Agent PRP Generation - Code Examples

This file contains practical TypeScript implementations for the patterns described in the research document.

## Table of Contents

1. Base Agent Interface
2. ReAct Agent Implementation
3. Plan-and-Execute Agent Implementation
4. Retry Logic with Exponential Backoff
5. RAG System Implementation
6. Context Manager
7. Document Lifecycle Management
8. File System Organization

---

## 1. Base Agent Interface

```typescript
// interfaces/agent.ts

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  name: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  retryConfig?: RetryConfig;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata: {
    attempts: number;
    duration: number;
    tokenUsage: TokenUsage;
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llmClient: LLMClient;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llmClient = new LLMClient(config);
  }

  abstract execute<T>(input: any): Promise<AgentResult<T>>;

  protected async callLLM(messages: AgentMessage[]): Promise<string> {
    return this.llmClient.call(messages, {
      temperature: this.config.temperature ?? 0.7,
      maxTokens: this.config.maxTokens ?? 2000,
    });
  }
}
```

---

## 2. ReAct Agent Implementation

```typescript
// agents/react-agent.ts

import { BaseAgent, AgentMessage, AgentResult } from '../interfaces/agent';

interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

interface ReActConfig extends AgentConfig {
  maxIterations: number;
  tools: Tool[];
}

export class ReActAgent extends BaseAgent {
  private config: ReActConfig;

  constructor(config: ReActConfig) {
    super(config);
    this.config = config;
  }

  async execute<T>(input: string): Promise<AgentResult<T>> {
    const startTime = Date.now();
    let attempts = 0;
    const steps: ReActStep[] = [];

    try {
      let currentInput = input;
      let iteration = 0;

      while (iteration < this.config.maxIterations) {
        attempts++;

        // Reasoning step
        const thought = await this.generateThought(currentInput, steps);
        steps.push({ thought });

        // Check if we should stop
        if (this.shouldStop(thought)) {
          break;
        }

        // Action step
        const action = await this.planAction(thought);
        steps.push({ action });

        // Execute action
        const observation = await this.executeAction(action);
        steps.push({ observation });

        currentInput = this.updateContext(currentInput, observation);
        iteration++;
      }

      const result = this.synthesizeResult(steps);

      return {
        success: true,
        data: result as T,
        metadata: {
          attempts,
          duration: Date.now() - startTime,
          tokenUsage: this.calculateTokenUsage(steps),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          attempts,
          duration: Date.now() - startTime,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        },
      };
    }
  }

  private async generateThought(
    input: string,
    previousSteps: ReActStep[]
  ): Promise<string> {
    const messages: AgentMessage[] = [
      {
        role: 'system',
        content: `You are a reasoning agent. Analyze the input and previous steps to determine the next action.

Available tools: ${this.config.tools.map(t => t.name).join(', ')}

Previous steps:
${previousSteps.map((s, i) => `Step ${i + 1}: ${JSON.stringify(s)}`).join('\n')}`,
      },
      {
        role: 'user',
        content: `Input: ${input}\n\nProvide your reasoning for the next step.`,
      },
    ];

    return this.callLLM(messages);
  }

  private async planAction(thought: string): Promise<string> {
    const messages: AgentMessage[] = [
      {
        role: 'system',
        content: `Based on the reasoning, determine the next action.
Respond with a JSON object: {"tool": "tool_name", "input": "tool_input"}`,
      },
      {
        role: 'user',
        content: `Reasoning: ${thought}\n\nDetermine the next action.`,
      },
    ];

    return this.callLLM(messages);
  }

  private async executeAction(actionString: string): Promise<string> {
    const action = JSON.parse(actionString);
    const tool = this.config.tools.find(t => t.name === action.tool);

    if (!tool) {
      throw new Error(`Tool not found: ${action.tool}`);
    }

    return tool.execute(action.input);
  }

  private shouldStop(thought: string): boolean {
    return (
      thought.toLowerCase().includes('done') ||
      thought.toLowerCase().includes('complete') ||
      thought.toLowerCase().includes('final answer')
    );
  }

  private updateContext(input: string, observation: string): string {
    return `${input}\n\nObservation: ${observation}`;
  }

  private synthesizeResult(steps: ReActStep[]): any {
    return {
      steps,
      finalAnswer: steps[steps.length - 1].thought,
    };
  }

  private calculateTokenUsage(steps: ReActStep[]): TokenUsage {
    // Approximate token counting
    const totalChars = steps.reduce((sum, step) => {
      return (
        sum +
        step.thought.length +
        (step.action?.length || 0) +
        (step.observation?.length || 0)
      );
    }, 0);

    return {
      promptTokens: Math.floor(totalChars / 4),
      completionTokens: Math.floor(totalChars / 8),
      totalTokens: Math.floor(totalChars / 3),
    };
  }
}

interface Tool {
  name: string;
  description: string;
  execute: (input: string) => Promise<string>;
}
```

---

## 3. Plan-and-Execute Agent Implementation

```typescript
// agents/plan-execute-agent.ts

import { BaseAgent, AgentResult } from '../interfaces/agent';

interface PlanStep {
  id: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

interface ExecutionPlan {
  steps: PlanStep[];
  estimatedDuration: number;
  requiredResources: string[];
}

export class PlanAndExecuteAgent extends BaseAgent {
  async execute<T>(input: any): Promise<AgentResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      // Phase 1: Planning
      const plan = await this.createPlan(input);
      attempts++;

      // Phase 2: Validation
      await this.validatePlan(plan);
      attempts++;

      // Phase 3: Execution
      const results = await this.executePlan(plan);
      attempts++;

      // Phase 4: Synthesis
      const finalResult = await this.synthesizeResults(results);

      return {
        success: true,
        data: finalResult as T,
        metadata: {
          attempts,
          duration: Date.now() - startTime,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          attempts,
          duration: Date.now() - startTime,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        },
      };
    }
  }

  private async createPlan(input: any): Promise<ExecutionPlan> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are a planning agent. Create a detailed execution plan for generating a Product Requirement Prompt.

Your plan should:
1. Break down the task into discrete steps
2. Identify dependencies between steps
3. Estimate complexity for each step
4. Specify required resources

Respond with a JSON object containing:
{
  "steps": [
    {
      "id": "step_1",
      "description": "Description of the step",
      "dependencies": [],
      "estimatedComplexity": "low|medium|high"
    }
  ]
}`,
      },
      {
        role: 'user' as const,
        content: `Create an execution plan for generating a PRP based on:
${JSON.stringify(input, null, 2)}`,
      },
    ];

    const response = await this.callLLM(messages);
    return JSON.parse(response);
  }

  private async validatePlan(plan: ExecutionPlan): Promise<void> {
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const step of plan.steps) {
      if (this.hasCircularDependency(step.id, plan, visited, recursionStack)) {
        throw new Error(
          `Circular dependency detected involving step: ${step.id}`
        );
      }
    }

    // Validate all dependencies exist
    for (const step of plan.steps) {
      for (const dep of step.dependencies) {
        if (!plan.steps.find(s => s.id === dep)) {
          throw new Error(`Dependency not found: ${dep}`);
        }
      }
    }
  }

  private hasCircularDependency(
    stepId: string,
    plan: ExecutionPlan,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(stepId);
    recursionStack.add(stepId);

    const step = plan.steps.find(s => s.id === stepId);
    if (!step) return false;

    for (const dep of step.dependencies) {
      if (!visited.has(dep)) {
        if (this.hasCircularDependency(dep, plan, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(stepId);
    return false;
  }

  private async executePlan(plan: ExecutionPlan): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const completed = new Set<string>();

    // Execute steps in dependency order
    while (completed.size < plan.steps.length) {
      const readySteps = plan.steps.filter(
        step =>
          step.status === 'pending' &&
          step.dependencies.every(dep => completed.has(dep))
      );

      if (readySteps.length === 0 && completed.size < plan.steps.length) {
        throw new Error('No executable steps found - possible deadlock');
      }

      // Execute ready steps in parallel
      await Promise.all(
        readySteps.map(async step => {
          step.status = 'in_progress';
          try {
            step.result = await this.executeStep(step, results);
            step.status = 'completed';
            completed.add(step.id);
            results.set(step.id, step.result);
          } catch (error) {
            step.status = 'failed';
            throw error;
          }
        })
      );
    }

    return results;
  }

  private async executeStep(
    step: PlanStep,
    context: Map<string, any>
  ): Promise<any> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are executing a specific step in a document generation plan.
Step: ${step.description}

Previous step results:
${Array.from(context.entries())
  .map(([id, result]) => `${id}: ${JSON.stringify(result)}`)
  .join('\n')}`,
      },
      {
        role: 'user' as const,
        content: `Execute the step: ${step.description}`,
      },
    ];

    const response = await this.callLLM(messages);
    return JSON.parse(response);
  }

  private async synthesizeResults(results: Map<string, any>): Promise<any> {
    const messages = [
      {
        role: 'system' as const,
        content:
          'You are synthesizing the final result from multiple execution steps.',
      },
      {
        role: 'user' as const,
        content: `Synthesize these results into a cohesive Product Requirement Prompt:
${JSON.stringify(Array.from(results.entries()), null, 2)}`,
      },
    ];

    const response = await this.callLLM(messages);
    return JSON.parse(response);
  }
}
```

---

## 4. Retry Logic with Exponential Backoff

```typescript
// utils/retry.ts

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
  retryableErrors: string[];
}

export class RetryManager {
  constructor(private config: RetryConfig) {}

  async executeWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt < this.config.maxRetries - 1) {
          const delay = this.calculateDelay(attempt);
          console.warn(
            `[Retry] Attempt ${attempt + 1}/${this.config.maxRetries} failed for ${context}. ` +
              `Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `All ${this.config.maxRetries} attempts failed for ${context}: ${lastError.message}`
    );
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter =
      exponentialDelay * this.config.jitterFactor * (Math.random() * 2 - 1);

    return Math.max(0, Math.floor(exponentialDelay + jitter));
  }

  private isRetryable(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';

    return this.config.retryableErrors.some(pattern =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default configuration for LLM API calls
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  jitterFactor: 0.1, // 10% jitter
  retryableErrors: ['rate limit', 'timeout', 'connection', '503', '502', '429'],
};
```

---

## 5. RAG System Implementation

```typescript
// systems/rag.ts

import { BaseAgent } from '../interfaces/agent';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: Date;
    tags: string[];
  };
  embedding?: number[];
}

interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}

export class RAGSystem {
  private vectorStore: VectorStore;
  private embeddingModel: EmbeddingModel;
  private agent: BaseAgent;

  constructor(
    vectorStore: VectorStore,
    embeddingModel: EmbeddingModel,
    agent: BaseAgent
  ) {
    this.vectorStore = vectorStore;
    this.embeddingModel = embeddingModel;
    this.agent = agent;
  }

  async generateWithContext(
    query: string,
    topK: number = 5,
    scoreThreshold: number = 0.7
  ): Promise<any> {
    // Retrieve relevant documents
    const retrievalResults = await this.retrieve(query, topK, scoreThreshold);

    // Build context from retrieved documents
    const context = this.buildContext(retrievalResults);

    // Generate with retrieved context
    const prompt = `
Relevant context from similar documents:
${context}

New Request:
${query}

Generate a response that leverages the patterns and information from the context above.
    `.trim();

    return this.agent.execute(prompt);
  }

  private async retrieve(
    query: string,
    topK: number,
    scoreThreshold: number
  ): Promise<RetrievalResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddingModel.embed(query);

    // Search vector store
    const results = await this.vectorStore.similaritySearch(queryEmbedding, {
      k: topK,
    });

    // Filter by score threshold
    return results
      .filter(r => r.score >= scoreThreshold)
      .sort((a, b) => b.score - a.score);
  }

  private buildContext(results: RetrievalResult[]): string {
    return results
      .map((r, i) =>
        `
[Document ${i + 1}] (Score: ${r.score.toFixed(3)})
Source: ${r.chunk.metadata.source}
${r.chunk.content}
      `.trim()
      )
      .join('\n\n---\n\n');
  }

  async indexDocument(chunk: DocumentChunk): Promise<void> {
    const embedding = await this.embeddingModel.embed(chunk.content);
    chunk.embedding = embedding;
    await this.vectorStore.insert(chunk);
  }
}

// Interfaces for RAG components
interface VectorStore {
  similaritySearch(
    embedding: number[],
    options: { k: number }
  ): Promise<RetrievalResult[]>;
  insert(chunk: DocumentChunk): Promise<void>;
}

interface EmbeddingModel {
  embed(text: string): Promise<number[]>;
}
```

---

## 6. Context Manager

```typescript
// managers/context.ts

export interface ContextRequest {
  query: string;
  projectId?: string;
  documentType?: string;
  maxTokens: number;
}

export interface ContextAllocation {
  core: number; // Task description (10%)
  examples: number; // Few-shot examples (30%)
  project: number; // Project-specific (40%)
  standards: number; // Standards and templates (20%)
}

export class ContextManager {
  private static readonly DEFAULT_ALLOCATION: ContextAllocation = {
    core: 0.1,
    examples: 0.3,
    project: 0.4,
    standards: 0.2,
  };

  async buildContext(request: ContextRequest): Promise<string> {
    const allocation = this.calculateAllocation(request.maxTokens);

    const contexts = await Promise.all([
      this.getCoreContext(request.query, allocation.core),
      this.getExampleContext(request.query, allocation.examples),
      this.getProjectContext(request.projectId, allocation.project),
      this.getStandardsContext(request.documentType, allocation.standards),
    ]);

    return this.assembleContext(contexts);
  }

  private calculateAllocation(maxTokens: number): ContextAllocation {
    const alloc = ContextManager.DEFAULT_ALLOCATION;
    return {
      core: Math.floor(maxTokens * alloc.core),
      examples: Math.floor(maxTokens * alloc.examples),
      project: Math.floor(maxTokens * alloc.project),
      standards: Math.floor(maxTokens * alloc.standards),
    };
  }

  private async getCoreContext(
    query: string,
    tokenBudget: number
  ): Promise<string> {
    return `Task: Generate a Product Requirement Prompt based on the following request.

${query}

Requirements:
- Use clear, unambiguous language
- Make all requirements measurable
- Include acceptance criteria for each requirement
- Prioritize requirements (must/should/could)
- Identify dependencies between requirements`;
  }

  private async getExampleContext(
    query: string,
    tokenBudget: number
  ): Promise<string> {
    // Retrieve relevant examples from vector store
    // Implementation would use RAG system
    return `Example 1:
Input: User authentication system
Output: {
  "title": "User Authentication PRP",
  "sections": [...]
}`;
  }

  private async getProjectContext(
    projectId: string | undefined,
    tokenBudget: number
  ): Promise<string> {
    if (!projectId) return '';

    // Fetch project-specific context from database
    return `Project Context:
- Architecture: microservices
- Tech Stack: TypeScript, Node.js, PostgreSQL
- Team Size: 5 developers
- Timeline: 3 months`;
  }

  private async getStandardsContext(
    documentType: string | undefined,
    tokenBudget: number
  ): Promise<string> {
    return `PRP Template:
1. Executive Summary
2. Functional Requirements
3. Non-Functional Requirements
4. Acceptance Criteria
5. Success Metrics
6. Dependencies`;
  }

  private assembleContext(contexts: string[]): string {
    return contexts.filter(c => c.length > 0).join('\n\n---\n\n');
  }
}
```

---

## 7. Document Lifecycle Management

```typescript
// managers/lifecycle.ts

export type DocumentStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'archived'
  | 'deprecated';

export interface DocumentMetadata {
  id: string;
  projectId: string;
  version: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  reviewedBy?: string[];
  tags: string[];
}

export class DocumentLifecycleManager {
  private validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    draft: ['review', 'archived'],
    review: ['published', 'draft', 'archived'],
    published: ['archived', 'deprecated'],
    archived: [],
    deprecated: [],
  };

  async transitionStatus(
    documentId: string,
    newStatus: DocumentStatus,
    userId: string
  ): Promise<void> {
    const metadata = await this.getMetadata(documentId);

    if (!this.canTransition(metadata.status, newStatus)) {
      throw new Error(
        `Invalid transition from ${metadata.status} to ${newStatus}`
      );
    }

    // Update status
    metadata.status = newStatus;
    metadata.updatedAt = new Date();

    // Trigger status-specific actions
    await this.onStatusChange(documentId, newStatus, userId);

    await this.saveMetadata(documentId, metadata);
  }

  private canTransition(
    current: DocumentStatus,
    next: DocumentStatus
  ): boolean {
    return this.validTransitions[current].includes(next);
  }

  private async onStatusChange(
    documentId: string,
    status: DocumentStatus,
    userId: string
  ): Promise<void> {
    switch (status) {
      case 'review':
        await this.notifyReviewers(documentId);
        break;

      case 'published':
        await this.distributeToStakeholders(documentId);
        await this.archiveOldVersions(documentId);
        break;

      case 'archived':
        await this.moveToArchive(documentId);
        break;

      case 'deprecated':
        await this.notifyDeprecation(documentId);
        break;
    }
  }

  private async notifyReviewers(documentId: string): Promise<void> {
    // Implementation: Send notifications to reviewers
    console.log(`Notifying reviewers for document: ${documentId}`);
  }

  private async distributeToStakeholders(documentId: string): Promise<void> {
    // Implementation: Distribute published document
    console.log(`Distributing published document: ${documentId}`);
  }

  private async archiveOldVersions(documentId: string): Promise<void> {
    // Implementation: Archive previous versions
    console.log(`Archiving old versions of: ${documentId}`);
  }

  private async moveToArchive(documentId: string): Promise<void> {
    // Implementation: Move document to archive directory
    console.log(`Moving document to archive: ${documentId}`);
  }

  private async notifyDeprecation(documentId: string): Promise<void> {
    // Implementation: Notify stakeholders of deprecation
    console.log(`Notifying deprecation for document: ${documentId}`);
  }

  // Abstract methods to be implemented by storage backend
  protected abstract getMetadata(documentId: string): Promise<DocumentMetadata>;
  protected abstract saveMetadata(
    documentId: string,
    metadata: DocumentMetadata
  ): Promise<void>;
}
```

---

## 8. File System Organization

```typescript
// storage/filesystem.ts

import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemOrganizer {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async initialize(): Promise<void> {
    const directories = [
      'prp-docs/projects',
      'prp-docs/templates',
      'prp-docs/contexts',
      'prp-docs/cache/embeddings',
      'prp-docs/cache/precomputed',
      'config',
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.basePath, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }

  async saveDocument(
    projectId: string,
    documentId: string,
    status: string,
    content: string
  ): Promise<string> {
    const filePath = this.getFilePath(projectId, documentId, status);
    const directory = path.dirname(filePath);

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  async loadDocument(
    projectId: string,
    documentId: string,
    status: string
  ): Promise<string> {
    const filePath = this.getFilePath(projectId, documentId, status);

    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Document not found: ${filePath}`);
    }
  }

  async listDocuments(projectId: string, status?: string): Promise<string[]> {
    const projectPath = path.join(
      this.basePath,
      'prp-docs',
      'projects',
      projectId
    );

    const statusPath = status ? path.join(projectPath, status) : projectPath;

    try {
      const files = await fs.readdir(statusPath, { recursive: true });
      return files.filter(f => f.endsWith('.json') || f.endsWith('.md'));
    } catch (error) {
      return [];
    }
  }

  async moveDocument(
    projectId: string,
    documentId: string,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    const fromPath = this.getFilePath(projectId, documentId, fromStatus);
    const toPath = this.getFilePath(projectId, documentId, toStatus);

    const toDirectory = path.dirname(toPath);
    await fs.mkdir(toDirectory, { recursive: true });

    await fs.rename(fromPath, toPath);
  }

  private getFilePath(
    projectId: string,
    documentId: string,
    status: string
  ): string {
    return path.join(
      this.basePath,
      'prp-docs',
      'projects',
      projectId,
      status,
      `${documentId}.json`
    );
  }

  async saveMetadata(
    projectId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const metadataPath = path.join(
      this.basePath,
      'prp-docs',
      'projects',
      projectId,
      'metadata.json'
    );

    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  }

  async loadMetadata(projectId: string): Promise<Record<string, any>> {
    const metadataPath = path.join(
      this.basePath,
      'prp-docs',
      'projects',
      projectId,
      'metadata.json'
    );

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }
}
```

---

## Usage Example: Complete PRP Generation Pipeline

```typescript
// examples/prp-generation.ts

import { PlanAndExecuteAgent } from '../agents/plan-execute-agent';
import { RetryManager, DEFAULT_RETRY_CONFIG } from '../utils/retry';
import { RAGSystem } from '../systems/rag';
import { ContextManager } from '../managers/context';
import { DocumentLifecycleManager } from '../managers/lifecycle';
import { FileSystemOrganizer } from '../storage/filesystem';

async function generatePRP(request: PRPRequest): Promise<PRPDocument> {
  // Initialize components
  const retryManager = new RetryManager(DEFAULT_RETRY_CONFIG);
  const contextManager = new ContextManager();
  const fileSystem = new FileSystemOrganizer('./data');

  await fileSystem.initialize();

  // Build context for generation
  const context = await contextManager.buildContext({
    query: request.description,
    projectId: request.projectId,
    documentType: 'PRP',
    maxTokens: 8000,
  });

  // Create agent with retry logic
  const agent = new PlanAndExecuteAgent({
    name: 'prp-generator',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    retryConfig: DEFAULT_RETRY_CONFIG,
  });

  // Generate with retry
  const result = await retryManager.executeWithRetry(
    async () => agent.execute<PRPDocument>(context),
    'PRP Generation'
  );

  if (!result.success) {
    throw new Error(`PRP generation failed: ${result.error?.message}`);
  }

  // Save document
  await fileSystem.saveDocument(
    request.projectId,
    result.data.id,
    'draft',
    JSON.stringify(result.data, null, 2)
  );

  return result.data;
}

interface PRPRequest {
  projectId: string;
  description: string;
  stakeholders: string[];
  timeline?: string;
  budget?: number;
}

interface PRPDocument {
  id: string;
  title: string;
  sections: Section[];
  metadata: DocumentMetadata;
}

interface Section {
  heading: string;
  content: string;
  requirements: Requirement[];
}

interface Requirement {
  id: string;
  priority: 'must' | 'should' | 'could';
  description: string;
  acceptanceCriteria: string[];
}
```

---

## Testing Utilities

```typescript
// utils/testing.ts

export class MockLLMClient {
  async call(messages: any[]): Promise<string> {
    // Return mock responses for testing
    return JSON.stringify({
      title: 'Test PRP',
      sections: [],
    });
  }
}

export class InMemoryVectorStore {
  private documents: Map<string, any> = new Map();

  async similaritySearch(
    embedding: number[],
    options: { k: number }
  ): Promise<any[]> {
    return Array.from(this.documents.values()).slice(0, options.k);
  }

  async insert(chunk: any): Promise<void> {
    this.documents.set(chunk.id, chunk);
  }

  clear(): void {
    this.documents.clear();
  }
}

export function createMockAgentConfig(): AgentConfig {
  return {
    name: 'test-agent',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  };
}

export function waitFor(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
}
```

---

This code examples file provides practical implementations for all the patterns described in the research document. Each component is designed to be:

- **Modular:** Can be used independently or combined
- **Type-safe:** Full TypeScript typing
- **Testable:** Includes mock implementations
- **Production-ready:** Includes error handling and retry logic
- **Extensible:** Easy to customize and extend

To use these examples, start with the complete pipeline example in the Usage Example section, then customize individual components as needed.
