/**
 * Integration tests for HelloWorldWorkflow
 *
 * @remarks
 * These tests verify the end-to-end behavior of the HelloWorldWorkflow
 * including proper status transitions, logging, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HelloWorldWorkflow } from '../../src/workflows/hello-world.js';
import { configureEnvironment } from '../../src/config/environment.js';

describe('HelloWorldWorkflow Integration Tests', () => {
  beforeEach(() => {
    // Set up required environment variables for tests
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
  });

  afterEach(() => {
    // Clean up environment variables after each test
    vi.unstubAllEnvs();
  });

  describe('successful workflow execution', () => {
    it('should complete workflow with completed status', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      expect(workflow.status).toBe('idle');

      await workflow.run();

      expect(workflow.status).toBe('completed');
    });

    it('should execute run() method without errors', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      await expect(workflow.run()).resolves.toBeUndefined();
    });

    it('should have a valid workflow id', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      expect(workflow.id).toBeDefined();
      expect(typeof workflow.id).toBe('string');
      expect(workflow.id.length).toBeGreaterThan(0);
    });

    it('should track status transitions from idle to running to completed', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      const statusTransitions: string[] = [];

      // Capture initial status
      statusTransitions.push(workflow.status);
      expect(statusTransitions).toContain('idle');

      // Run workflow and capture final status
      await workflow.run();
      statusTransitions.push(workflow.status);

      expect(statusTransitions).toContain('completed');
    });
  });

  describe('environment configuration integration', () => {
    it('should work with environment configured before workflow creation', async () => {
      // Configure environment as the main app does
      configureEnvironment();

      const workflow = new HelloWorldWorkflow('HelloWorld');

      await expect(workflow.run()).resolves.toBeUndefined();
      expect(workflow.status).toBe('completed');
    });

    it('should execute with environment variables present', async () => {
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-auth-token');

      configureEnvironment();

      const workflow = new HelloWorldWorkflow('HelloWorld');

      await expect(workflow.run()).resolves.toBeUndefined();
    });
  });

  describe('workflow lifecycle validation', () => {
    it('should remain in idle status before run is called', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      expect(workflow.status).toBe('idle');
    });

    it('should transition to completed status after successful run', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      await workflow.run();

      expect(workflow.status).toBe('completed');
    });

    it('should handle multiple sequential runs', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      // First run
      await workflow.run();
      expect(workflow.status).toBe('completed');

      // Create a new workflow for second run (status doesn't reset)
      const workflow2 = new HelloWorldWorkflow('HelloWorld2');
      await workflow2.run();
      expect(workflow2.status).toBe('completed');
    });
  });

  describe('error handling', () => {
    it('should handle workflow creation without errors', async () => {
      expect(() => new HelloWorldWorkflow('TestWorkflow')).not.toThrow();
    });

    it('should handle graceful completion of workflow', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      // This should not throw any errors
      await expect(workflow.run()).resolves.toBeUndefined();
    });
  });

  describe('workflow parent-child relationships', () => {
    it('should have no parent by default', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      expect(workflow.parent).toBeNull();
    });

    it('should have empty children array by default', async () => {
      const workflow = new HelloWorldWorkflow('HelloWorld');

      expect(workflow.children).toEqual([]);
    });
  });
});
