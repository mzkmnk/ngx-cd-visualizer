/**
 * Test utilities for ngx-cd-visualizer
 * 
 * This module provides comprehensive testing utilities including:
 * - Mock factories for all service dependencies
 * - Test data generators
 * - Angular TestBed configuration helpers
 * - Async testing utilities
 * 
 * @example
 * ```typescript
 * import { createMockComponentNode, setupTestingModule } from '@mzkmnk/ngx-cd-visualizer/test-utils';
 * 
 * describe('MyTest', () => {
 *   beforeEach(() => {
 *     TestBed.configureTestingModule(setupTestingModule());
 *   });
 * });
 * ```
 */

export * from './test-utils';
export * from './types';