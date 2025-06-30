import { ApplicationRef, ComponentRef, ChangeDetectionStrategy, Type } from '@angular/core';
import { ComponentTreeService } from './component-tree.service';
import { of } from 'rxjs';

describe('ComponentTreeService', () => {
  let service: ComponentTreeService;
  let mockApplicationRef: Partial<ApplicationRef>;

  // Test component types
  class TestComponent {}
  class OnPushTestComponent {}

  beforeEach(() => {
    // Create a simple mock ComponentRef
    const mockComponentRef = {
      componentType: TestComponent as Type<object>,
      instance: new TestComponent(),
      location: { nativeElement: document.createElement('div') },
      injector: { get: jest.fn() },
      hostView: { 
        detectChanges: jest.fn(), 
        destroy: jest.fn(),
        destroyed: false
      },
      changeDetectorRef: { 
        detectChanges: jest.fn(), 
        markForCheck: jest.fn()
      },
      destroy: jest.fn()
    } as unknown as ComponentRef<object>;

    // Create proper ApplicationRef mock
    mockApplicationRef = {
      components: [mockComponentRef],
      viewCount: 1,
      get isStable() { return of(true); },
      destroyed: false,
      componentTypes: [TestComponent],
      tick: jest.fn(),
      attachView: jest.fn(),
      detachView: jest.fn(),
      bootstrap: jest.fn(),
      destroy: jest.fn()
    };

    // Create service instance directly (no TestBed)
    service = new ComponentTreeService(mockApplicationRef as ApplicationRef);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty component tree initially', () => {
      expect(service.componentTree()).toEqual([]);
    });

    it('should have empty root components initially', () => {
      expect(service.rootComponents()).toEqual([]);
    });

    it('should not be scanning initially', () => {
      expect(service.isScanning()).toBe(false);
    });

    it('should have component count of 0 initially', () => {
      expect(service.componentCount()).toBe(0);
    });

    it('should have OnPush component count of 0 initially', () => {
      expect(service.onPushComponentCount()).toBe(0);
    });
  });

  describe('scanComponentTree', () => {
    it('should scan component tree successfully', () => {
      expect(() => service.scanComponentTree()).not.toThrow();
      expect(service.isScanning()).toBe(false);
    });

    it('should create component nodes with proper structure after scanning', () => {
      service.scanComponentTree();
      
      const componentTree = service.componentTree();
      expect(componentTree.length).toBeGreaterThan(0);
      
      // Verify each node has required properties
      componentTree.forEach(node => {
        expect(node.id).toBeTruthy();
        expect(node.name).toBeTruthy();
        expect(node.selector).toBeTruthy();
        expect(node.componentRef).toBeDefined();
        expect(node.componentType).toBeDefined();
        expect(typeof node.isOnPushStrategy).toBe('boolean');
        expect(typeof node.changeDetectionCount).toBe('number');
        expect(typeof node.isActive).toBe('boolean');
        expect(typeof node.depth).toBe('number');
      });
    });

    it('should identify root components correctly after scanning', () => {
      service.scanComponentTree();
      
      const rootComponents = service.rootComponents();
      expect(rootComponents.length).toBe(1); // Should match mocked components array
      
      // Root components should have depth 0 and no parent
      rootComponents.forEach(root => {
        expect(root.depth).toBe(0);
        expect(root.parent).toBeNull();
        expect(root.name).toBe('TestComponent');
      });
    });

    it('should maintain accurate component count including mock children', () => {
      service.scanComponentTree();
      
      const componentCount = service.componentCount();
      const actualComponents = service.componentTree();
      
      expect(componentCount).toBe(actualComponents.length);
      expect(componentCount).toBeGreaterThan(1); // Should include root + mock children
      
      // Verify count matches actual nodes
      expect(componentCount).toBe(actualComponents.length);
    });

    it('should handle empty components array', () => {
      Object.defineProperty(mockApplicationRef, 'components', { value: [], writable: true });
      expect(() => service.scanComponentTree()).not.toThrow();
    });

    it('should preserve component structure and generate mock hierarchy', () => {
      service.scanComponentTree();
      
      const nodes = service.componentTree();
      expect(nodes.length).toBeGreaterThan(1); // Root + children
      
      // Find root node
      const rootNode = nodes.find(n => n.depth === 0);
      expect(rootNode).toBeDefined();
      expect(rootNode?.name).toBe('TestComponent');
      expect(rootNode?.children.length).toBeGreaterThan(0);
      
      // Verify mock children exist
      const childNodes = nodes.filter(n => n.depth === 1);
      expect(childNodes.length).toBeGreaterThan(0);
      
      // Verify parent-child relationships
      childNodes.forEach(child => {
        expect(child.parent).toBe(rootNode);
        expect(rootNode?.children).toContain(child);
      });
    });
  });

  describe('Component Search Methods', () => {
    beforeEach(() => {
      service.scanComponentTree();
    });

    it('should find component by id when exists', () => {
      service.scanComponentTree();
      const nodes = service.componentTree();
      
      expect(nodes.length).toBeGreaterThan(0);
      const firstNode = nodes[0];
      const found = service.findComponentById(firstNode.id);
      expect(found).toBe(firstNode);
      expect(found?.id).toBe(firstNode.id);
    });

    it('should return null for non-existent id', () => {
      const found = service.findComponentById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should find components by selector', () => {
      const components = service.findComponentBySelector('any-selector');
      expect(Array.isArray(components)).toBe(true);
    });

    it('should find components by name', () => {
      const components = service.findComponentsByName('Test');
      expect(Array.isArray(components)).toBe(true);
    });

    it('should return correct component path from root to target', () => {
      service.scanComponentTree();
      const nodes = service.componentTree();
      
      // Test path for root component
      const rootNode = nodes.find(n => n.depth === 0);
      expect(rootNode).toBeDefined();
      if (!rootNode) return;
      const rootPath = service.getComponentPath(rootNode.id);
      expect(rootPath).toEqual([rootNode]);
      
      // Test path for child component
      const childNode = nodes.find(n => n.depth === 1);
      if (childNode) {
        const childPath = service.getComponentPath(childNode.id);
        expect(childPath.length).toBe(2); // Root + child
        expect(childPath[0]).toBe(rootNode);
        expect(childPath[1]).toBe(childNode);
      }
    });
  });

  describe('Component State Management', () => {
    beforeEach(() => {
      service.scanComponentTree();
    });

    it('should create snapshot', () => {
      const snapshot = service.createSnapshot();
      expect(typeof snapshot.timestamp).toBe('number');
      expect(Array.isArray(snapshot.nodes)).toBe(true);
      expect(Array.isArray(snapshot.rootNodes)).toBe(true);
    });

    it('should update component activity state and timestamp correctly', () => {
      service.scanComponentTree();
      const nodes = service.componentTree();
      expect(nodes.length).toBeGreaterThan(0);
      
      const componentId = nodes[0].id;
      const beforeTime = Date.now();
      
      // Activate component
      service.updateComponentActivity(componentId, true);
      const afterTime = Date.now();
      
      const updatedNode = service.findComponentById(componentId);
      expect(updatedNode?.isActive).toBe(true);
      expect(updatedNode?.lastChangeDetectionTime).toBeGreaterThanOrEqual(beforeTime);
      expect(updatedNode?.lastChangeDetectionTime).toBeLessThanOrEqual(afterTime);
      
      // Deactivate component
      service.updateComponentActivity(componentId, false);
      const deactivatedNode = service.findComponentById(componentId);
      expect(deactivatedNode?.isActive).toBe(false);
      // Timestamp should remain unchanged when deactivating
      expect(deactivatedNode?.lastChangeDetectionTime).toBe(updatedNode?.lastChangeDetectionTime);
    });

    it('should increment change detection count and activate component', () => {
      service.scanComponentTree();
      const nodes = service.componentTree();
      expect(nodes.length).toBeGreaterThan(0);
      
      const componentId = nodes[0].id;
      const originalCount = nodes[0].changeDetectionCount;
      const beforeTime = Date.now();
      
      service.incrementChangeDetectionCount(componentId);
      const afterTime = Date.now();
      
      const updatedNode = service.findComponentById(componentId);
      expect(updatedNode?.changeDetectionCount).toBe(originalCount + 1);
      expect(updatedNode?.isActive).toBe(true);
      expect(updatedNode?.lastChangeDetectionTime).toBeGreaterThanOrEqual(beforeTime);
      expect(updatedNode?.lastChangeDetectionTime).toBeLessThanOrEqual(afterTime);
      
      // Multiple increments should continue to increase count
      service.incrementChangeDetectionCount(componentId);
      const doubleUpdatedNode = service.findComponentById(componentId);
      expect(doubleUpdatedNode?.changeDetectionCount).toBe(originalCount + 2);
    });

    it('should reset activity states', () => {
      // First activate some components
      const nodes = service.componentTree();
      nodes.forEach(node => {
        service.updateComponentActivity(node.id, true);
      });
      
      // Reset all
      service.resetActivityStates();
      
      // Check all are inactive
      const updatedNodes = service.componentTree();
      updatedNodes.forEach(node => {
        expect(node.isActive).toBe(false);
      });
    });
  });

  describe('OnPush Component Detection', () => {
    it('should handle OnPush components', () => {
      // Create OnPush component mock
      const onPushComponent = OnPushTestComponent as Type<object> & { __annotations__?: unknown[] };
      onPushComponent.__annotations__ = [{
        changeDetection: ChangeDetectionStrategy.OnPush
      }];

      const mockOnPushRef = {
        componentType: onPushComponent,
        instance: new OnPushTestComponent(),
        location: { nativeElement: document.createElement('div') },
        injector: { get: jest.fn() },
        hostView: { 
          detectChanges: jest.fn(), 
          destroy: jest.fn()
        },
        changeDetectorRef: { 
          detectChanges: jest.fn(), 
          markForCheck: jest.fn()
        },
        destroy: jest.fn()
      } as unknown as ComponentRef<object>;

      Object.defineProperty(mockApplicationRef, 'components', { value: [mockOnPushRef], writable: true });
      
      expect(() => service.scanComponentTree()).not.toThrow();
      
      // Should detect OnPush strategy
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        expect(service.onPushComponentCount()).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Component Selector Detection', () => {
    it('should handle component with selector metadata', () => {
      const testComponent = TestComponent as Type<object> & { __annotations__?: unknown[] };
      testComponent.__annotations__ = [{
        selector: 'app-test'
      }];

      const mockRefWithSelector = {
        componentType: testComponent,
        instance: new TestComponent(),
        location: { nativeElement: document.createElement('div') },
        injector: { get: jest.fn() },
        hostView: { 
          detectChanges: jest.fn(), 
          destroy: jest.fn()
        },
        changeDetectorRef: { 
          detectChanges: jest.fn(), 
          markForCheck: jest.fn()
        },
        destroy: jest.fn()
      } as unknown as ComponentRef<object>;

      Object.defineProperty(mockApplicationRef, 'components', { value: [mockRefWithSelector], writable: true });
      
      expect(() => service.scanComponentTree()).not.toThrow();
      
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        expect(nodes.some(node => node.selector === 'app-test')).toBe(true);
      }
    });

    it('should generate fallback selector for component without metadata', () => {
      service.scanComponentTree();
      
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        // Should generate kebab-case selector from component name
        // Should generate kebab-case selector from component name
        const hasKebabSelector = nodes.some(node => 
          node.selector.toLowerCase().includes('test') || 
          node.selector.includes('<test-component>')
        );
        expect(hasKebabSelector).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle null components array gracefully', () => {
      Object.defineProperty(mockApplicationRef, 'components', { value: null, writable: true });
      expect(() => service.scanComponentTree()).not.toThrow();
      expect(service.componentTree()).toEqual([]);
    });

    it('should handle undefined components gracefully', () => {
      Object.defineProperty(mockApplicationRef, 'components', { value: undefined, writable: true });
      expect(() => service.scanComponentTree()).not.toThrow();
      expect(service.componentTree()).toEqual([]);
    });

    it('should handle malformed component refs', () => {
      Object.defineProperty(mockApplicationRef, 'components', { value: [{}], writable: true }); // Invalid component ref
      expect(() => service.scanComponentTree()).not.toThrow();
      expect(service.componentTree()).toEqual([]);
    });
  });

  describe('Component Tree Structure', () => {
    it('should maintain parent-child relationships', () => {
      service.scanComponentTree();
      
      const nodes = service.componentTree();
      nodes.forEach(node => {
        // Root nodes should have null parent
        if (node.depth === 0) {
          expect(node.parent).toBeNull();
        }
        
        // Children should reference their parent
        node.children.forEach(child => {
          expect(child.parent).toBe(node);
        });
      });
    });

    it('should generate unique node IDs', () => {
      service.scanComponentTree();
      
      const nodes = service.componentTree();
      const ids = nodes.map(node => node.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should properly calculate component counts', () => {
      service.scanComponentTree();
      
      const totalComponents = service.componentCount();
      const onPushComponents = service.onPushComponentCount();
      
      expect(totalComponents).toBeGreaterThanOrEqual(0);
      expect(onPushComponents).toBeGreaterThanOrEqual(0);
      expect(onPushComponents).toBeLessThanOrEqual(totalComponents);
    });
  });
});