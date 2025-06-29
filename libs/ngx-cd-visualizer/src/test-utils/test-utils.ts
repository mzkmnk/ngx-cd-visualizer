import { ComponentRef, ApplicationRef, NgZone, Type } from '@angular/core';
import { ComponentNode, ChangeDetectionEvent, ChangeDetectionTrigger, CdVisualizerConfig } from '../lib/models';
import { 
  MockComponentRef, 
  MockApplicationRef, 
  MockNgZone, 
  TestComponentType,
  TestComponentClass,
  TestProviderConfig,
  TestProvider
} from './types';

/**
 * Test utilities for ngx-cd-visualizer
 * Provides reusable mocks and helpers for testing
 */

/**
 * Creates a mock ComponentNode for testing
 */
export function createMockComponentNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id: 'test-node-1',
    name: 'TestComponent',
    selector: 'app-test',
    componentRef: createMockComponentRef() as unknown as ComponentRef<object>,
    componentType: MockComponent,
    parent: null,
    children: [],
    isOnPushStrategy: false,
    changeDetectionCount: 0,
    isActive: false,
    depth: 0,
    ...overrides
  };
}

/**
 * Creates a mock ComponentRef for testing
 */
export function createMockComponentRef<T = object>(componentType?: Type<T>): MockComponentRef<T> {
  const actualComponentType = componentType || (MockComponent as unknown as Type<T>);
  return {
    componentType: actualComponentType,
    instance: new actualComponentType(),
    location: {
      nativeElement: document.createElement('div')
    },
    injector: {
      get: jest.fn()
    },
    hostView: {
      detectChanges: jest.fn(),
      destroy: jest.fn(),
      destroyed: false
    },
    changeDetectorRef: {
      detectChanges: jest.fn(),
      markForCheck: jest.fn(),
      detach: jest.fn(),
      reattach: jest.fn()
    },
    destroy: jest.fn(),
    onDestroy: jest.fn(),
    setInput: jest.fn()
  };
}

/**
 * Mock component class for testing
 */
export class MockComponent implements TestComponentClass {
  static __annotations__ = [{
    selector: 'app-mock',
    template: '<div>Mock Component</div>'
  }];
}

/**
 * Mock OnPush component class for testing
 */
export class MockOnPushComponent implements TestComponentClass {
  static __annotations__ = [{
    selector: 'app-mock-onpush',
    template: '<div>Mock OnPush Component</div>',
    changeDetection: 1 // ChangeDetectionStrategy.OnPush
  }];
}

/**
 * Creates a mock ApplicationRef for testing
 */
export function createMockApplicationRef(): MockApplicationRef {
  const mockComponents: ComponentRef<object>[] = [createMockComponentRef() as unknown as ComponentRef<object>];
  return {
    get components() {
      return mockComponents;
    },
    set components(value: ComponentRef<object>[]) {
      mockComponents.length = 0;
      if (value) {
        mockComponents.push(...value);
      }
    },
    tick: jest.fn(),
    attachView: jest.fn(),
    detachView: jest.fn(),
    viewCount: 0,
    isStable: true,
    bootstrap: jest.fn(),
    destroy: jest.fn()
  } as MockApplicationRef;
}

/**
 * Creates a mock NgZone for testing
 */
export function createMockNgZone(): MockNgZone {
  return {
    run: jest.fn((fn: () => unknown) => fn()),
    runOutsideAngular: jest.fn((fn: () => unknown) => {
      const result = fn();
      // Return interval ID for setInterval calls
      return typeof result === 'number' ? result : result;
    }),
    runGuarded: jest.fn((fn: () => unknown) => fn()),
    runTask: jest.fn((fn: () => unknown) => fn()),
    isStable: true,
    onStable: {
      subscribe: jest.fn()
    },
    onUnstable: {
      subscribe: jest.fn()
    },
    onError: {
      subscribe: jest.fn()
    },
    onMicrotaskEmpty: {
      subscribe: jest.fn()
    }
  } as MockNgZone;
}

/**
 * Creates a mock ChangeDetectionEvent for testing
 */
export function createMockChangeDetectionEvent(overrides: Partial<ChangeDetectionEvent> = {}): ChangeDetectionEvent {
  return {
    id: 'event-1',
    timestamp: Date.now(),
    componentNode: createMockComponentNode(),
    trigger: ChangeDetectionTrigger.UserInteraction,
    isManualTrigger: false,
    ...overrides
  };
}

/**
 * Creates a test configuration for CdVisualizerConfig
 */
export function createTestConfig(overrides: Partial<CdVisualizerConfig> = {}): CdVisualizerConfig {
  return {
    enabled: true,
    position: 'bottom-right',
    theme: 'light',
    showOnlyChanges: false,
    excludeComponents: [],
    debugMode: true,
    maxHistorySize: 100,
    ...overrides
  };
}

/**
 * Helper to create component tree with multiple levels
 */
export function createMockComponentTree(): ComponentNode[] {
  const parent = createMockComponentNode({
    id: 'parent-1',
    name: 'ParentComponent',
    selector: 'app-parent',
    depth: 0
  });

  const child1 = createMockComponentNode({
    id: 'child-1',
    name: 'ChildComponent1',
    selector: 'app-child1',
    parent,
    depth: 1
  });

  const child2 = createMockComponentNode({
    id: 'child-2',
    name: 'ChildComponent2',
    selector: 'app-child2',
    parent,
    depth: 1,
    isOnPushStrategy: true
  });

  parent.children = [child1, child2];

  return [parent, child1, child2];
}

/**
 * Helper to wait for async operations in tests
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Helper to advance timers and flush promises
 */
export async function flushTimersAndPromises(): Promise<void> {
  jest.runAllTimers();
  await flushPromises();
}

/**
 * Test setup helper for services that require specific providers
 */
export function setupTestingModule(providers: TestProvider[] = []): TestProviderConfig {
  return {
    providers: [
      { provide: ApplicationRef, useValue: createMockApplicationRef() },
      { provide: NgZone, useValue: createMockNgZone() },
      ...providers
    ]
  };
}