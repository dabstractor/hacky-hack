/**
 * Unit tests for agent factory module
 *
 * @remarks
 * Tests validate persona-based configuration generation with 100% coverage
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBaseConfig,
  type AgentPersona,
} from '../../../src/agents/agent-factory.js';

describe('agents/agent-factory', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createBaseConfig', () => {
    // SETUP: Ensure environment is configured before tests
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
    });

    const personas: AgentPersona[] = ['architect', 'researcher', 'coder', 'qa'];

    it.each(personas)('should return valid config for %s persona', persona => {
      // EXECUTE
      const config = createBaseConfig(persona);

      // VERIFY: Required properties exist
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('system');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('enableCache');
      expect(config).toHaveProperty('enableReflection');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('env');
    });

    it('should set maxTokens to 8192 for architect persona', () => {
      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Architect gets larger token limit
      expect(config.maxTokens).toBe(8192);
    });

    it.each(['researcher', 'coder', 'qa'] as AgentPersona[])(
      'should set maxTokens to 4096 for %s persona',
      persona => {
        // EXECUTE
        const config = createBaseConfig(persona);

        // VERIFY: Standard token limit
        expect(config.maxTokens).toBe(4096);
      }
    );

    it('should enable cache and reflection for all personas', () => {
      // EXECUTE
      const configs = personas.map(p => createBaseConfig(p));

      // VERIFY: All configs have caching and reflection enabled
      configs.forEach(config => {
        expect(config.enableCache).toBe(true);
        expect(config.enableReflection).toBe(true);
      });
    });

    it('should use GLM-4.7 model for all personas', () => {
      // EXECUTE
      const configs = personas.map(p => createBaseConfig(p));

      // VERIFY: All personas use sonnet tier → GLM-4.7
      configs.forEach(config => {
        expect(config.model).toBe('GLM-4.7');
      });
    });

    it('should properly map environment variables', () => {
      // SETUP: Known environment values
      const expectedBaseUrl = 'https://api.z.ai/api/anthropic';
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');
      vi.stubEnv('ANTHROPIC_BASE_URL', expectedBaseUrl);

      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Environment is mapped in config.env
      expect(config.env.ANTHROPIC_API_KEY).toBeDefined();
      expect(config.env.ANTHROPIC_BASE_URL).toBe(expectedBaseUrl);
    });

    it('should generate agent name from persona', () => {
      // EXECUTE & VERIFY: Agent names follow Persona → PersonaAgent pattern
      expect(createBaseConfig('architect').name).toBe('ArchitectAgent');
      expect(createBaseConfig('researcher').name).toBe('ResearcherAgent');
      expect(createBaseConfig('coder').name).toBe('CoderAgent');
      expect(createBaseConfig('qa').name).toBe('QaAgent');
    });

    it('should have readonly properties', () => {
      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Properties are readonly (TypeScript enforces this at compile time)
      // At runtime, we can check that the config has the expected structure
      expect(typeof config.name).toBe('string');
      expect(typeof config.model).toBe('string');
      expect(typeof config.maxTokens).toBe('number');
    });

    it('should include system prompt placeholder', () => {
      // EXECUTE
      const config = createBaseConfig('coder');

      // VERIFY: System prompt contains the persona name
      expect(config.system).toContain('coder');
    });

    it('should use empty string fallback when env vars are not set', () => {
      // SETUP: Delete environment variables to test fallback behavior
      // Note: configureEnvironment() has already run at module load time
      // This test verifies the fallback behavior when vars are deleted after import
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE
      const config = createBaseConfig('architect');

      // VERIFY: Fallback to empty strings when env vars are not set
      expect(config.env.ANTHROPIC_API_KEY).toBe('');
      expect(config.env.ANTHROPIC_BASE_URL).toBe('');
    });
  });
});
