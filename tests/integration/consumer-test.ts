/**
 * Integration test: Verify TypeScript compilation from a consuming module
 */

import { getModel, type ModelTier } from '../../src/config/environment.js';

const tier: ModelTier = 'sonnet';
const model = getModel(tier);
console.log(`Selected model for ${tier}: ${model}`);
