# Test Utilities for ngx-cd-visualizer

This directory contains comprehensive testing utilities for the ngx-cd-visualizer library. These utilities are designed to make testing easier and more maintainable across the entire project.

## Overview

The test utilities provide:
- **Mock factories** for all service dependencies
- **Test data generators** for models and interfaces
- **Angular TestBed helpers** for service testing
- **Async testing utilities** for handling timers and promises
- **Reusable test scenarios** for common testing patterns

## Quick Start

```typescript
import { TestBed } from '@angular/core/testing';
import { 
  createMockComponentNode, 
  setupTestingModule,
  flushTimersAndPromises 
} from '../test-utils';

describe('MyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule(setupTestingModule([
      // your additional providers
    ]));
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should work with mock data', async () => {
    const mockNode = createMockComponentNode({
      name: 'CustomComponent',
      isOnPushStrategy: true
    });

    // Your test logic here
    
    await flushTimersAndPromises();
    // Assertions
  });
});
```

## Available Utilities

### Mock Factories

#### `createMockComponentNode(overrides?)`
Creates a mock ComponentNode with sensible defaults.

```typescript
const node = createMockComponentNode({
  name: 'TestComponent',
  isOnPushStrategy: true,
  changeDetectionCount: 5
});
```

#### `createMockComponentRef(componentType?)`
Creates a mock Angular ComponentRef.

```typescript
const componentRef = createMockComponentRef(MyComponent);
```

#### `createMockApplicationRef()`
Creates a mock Angular ApplicationRef with component array.

#### `createMockNgZone()`
Creates a mock NgZone for testing zone-related functionality.

#### `createMockChangeDetectionEvent(overrides?)`
Creates a mock ChangeDetectionEvent.

### Test Data Generators

#### `createTestConfig(overrides?)`
Creates a test configuration object for CdVisualizerConfig.

```typescript
const config = createTestConfig({
  enabled: false,
  theme: 'dark'
});
```

#### `createMockComponentTree()`
Creates a hierarchical component tree for testing tree operations.

```typescript
const tree = createMockComponentTree();
// Returns [parent, child1, child2] with proper parent-child relationships
```

### Angular Testing Helpers

#### `setupTestingModule(providers?)`
Provides a standard TestBed configuration with common mocks.

```typescript
TestBed.configureTestingModule(setupTestingModule([
  { provide: MyService, useValue: mockMyService }
]));
```

### Async Testing Utilities

#### `flushPromises()`
Waits for all pending promises to resolve.

#### `flushTimersAndPromises()`
Advances all timers and flushes promises - useful for testing setTimeout/setInterval.

```typescript
// Test code that uses setTimeout
service.startMonitoring(); // Uses setTimeout internally

await flushTimersAndPromises();

// Now you can assert the delayed effects
expect(mockService.method).toHaveBeenCalled();
```

## Mock Component Classes

### `MockComponent`
A basic mock component class with annotations.

### `MockOnPushComponent`
A mock component class configured with OnPush change detection strategy.

## Best Practices

### 1. Use Fake Timers for Async Code
```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

### 2. Mock Service Dependencies
```typescript
const mockService = {
  method: jest.fn(),
  property: jest.fn().mockReturnValue(() => 'value')
} as jest.Mocked<ServiceType>;
```

### 3. Test Signal-based Services
```typescript
// For testing computed signals
service.updateSomeState();
expect(service.computedSignal()).toBe(expectedValue);

// For testing signal updates
expect(service.signalValue()).toBe(initialValue);
service.updateSignal(newValue);
expect(service.signalValue()).toBe(newValue);
```

### 4. Test Effect-based Logic
```typescript
// Test effects that respond to signal changes
service.updateConfig({ enabled: true });
await flushTimersAndPromises();
expect(mockDependency.startMethod).toHaveBeenCalled();
```

### 5. Test Error Handling
```typescript
mockDependency.method.mockImplementation(() => {
  throw new Error('Test error');
});

expect(() => service.methodThatHandlesErrors()).not.toThrow();
```

## Testing Patterns

### Service Testing Pattern
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    mockDependency = createMockDependency();
    TestBed.configureTestingModule(setupTestingModule([
      { provide: DependencyType, useValue: mockDependency }
    ]));
    service = TestBed.inject(ServiceName);
  });

  describe('Feature Group', () => {
    it('should behave correctly', () => {
      // Test implementation
    });
  });
});
```

### Integration Testing Pattern
```typescript
describe('Service Integration', () => {
  beforeEach(() => {
    // Use real services instead of mocks for integration tests
    TestBed.configureTestingModule({
      providers: [
        ServiceA,
        ServiceB,
        { provide: ExternalDependency, useValue: mockExternal }
      ]
    });
  });
});
```

## Extending the Utilities

When adding new utilities:

1. **Follow naming conventions**: `createMock*`, `setup*`, `flush*`
2. **Provide overrides**: Allow customization of mock objects
3. **Include JSDoc**: Document parameters and usage
4. **Add tests**: Test the utilities themselves
5. **Update this README**: Keep documentation current

## Related Files

- `test-utils.ts` - Main utilities implementation
- `*.spec.ts` - Service test files using these utilities
- `jest.config.ts` - Jest configuration
- `test-setup.ts` - Global test setup