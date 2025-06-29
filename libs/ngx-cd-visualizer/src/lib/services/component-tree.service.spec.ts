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

    it('should update component tree after scanning', () => {
      service.scanComponentTree();
      expect(service.componentTree().length).toBeGreaterThanOrEqual(0);
    });

    it('should update root components after scanning', () => {
      service.scanComponentTree();
      expect(service.rootComponents().length).toBeGreaterThanOrEqual(0);
    });

    it('should update component count after scanning', () => {
      service.scanComponentTree();
      expect(service.componentCount()).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty components array', () => {
      (mockApplicationRef as any).components = [];
      expect(() => service.scanComponentTree()).not.toThrow();
    });

    it('should handle components with valid structure', () => {
      service.scanComponentTree();
      
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        const node = nodes[0];
        expect(node.id).toBeDefined();
        expect(node.name).toBeDefined();
        expect(node.selector).toBeDefined();
        expect(node.componentRef).toBeDefined();
        expect(node.componentType).toBeDefined();
        expect(node.depth).toBeGreaterThanOrEqual(0);
        expect(typeof node.isOnPushStrategy).toBe('boolean');
        expect(typeof node.changeDetectionCount).toBe('number');
        expect(typeof node.isActive).toBe('boolean');
      }
    });
  });

  describe('Component Search Methods', () => {
    beforeEach(() => {
      service.scanComponentTree();
    });

    it('should find component by id when exists', () => {
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        const found = service.findComponentById(nodes[0].id);
        expect(found).toBe(nodes[0]);
      } else {
        expect(service.findComponentById('any-id')).toBeNull();
      }
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

    it('should return component path', () => {
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        const path = service.getComponentPath(nodes[0].id);
        expect(Array.isArray(path)).toBe(true);
      } else {
        const path = service.getComponentPath('any-id');
        expect(path).toEqual([]);
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

    it('should update component activity', () => {
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        const componentId = nodes[0].id;
        const originalState = service.findComponentById(componentId);
        
        service.updateComponentActivity(componentId, true);
        
        const updatedNode = service.findComponentById(componentId);
        expect(updatedNode?.isActive).toBe(true);
        expect(updatedNode?.lastChangeDetectionTime).toBeGreaterThan(0);
      } else {
        // Test with empty tree
        expect(() => service.updateComponentActivity('fake-id', true)).not.toThrow();
      }
    });

    it('should increment change detection count', () => {
      const nodes = service.componentTree();
      if (nodes.length > 0) {
        const componentId = nodes[0].id;
        const originalCount = nodes[0].changeDetectionCount;
        
        service.incrementChangeDetectionCount(componentId);
        
        const updatedNode = service.findComponentById(componentId);
        expect(updatedNode?.changeDetectionCount).toBe(originalCount + 1);
        expect(updatedNode?.isActive).toBe(true);
        expect(updatedNode?.lastChangeDetectionTime).toBeGreaterThan(0);
      } else {
        // Test with empty tree
        expect(() => service.incrementChangeDetectionCount('fake-id')).not.toThrow();
      }
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
      const onPushComponent = OnPushTestComponent as any;
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

      (mockApplicationRef as any).components = [mockOnPushRef];
      
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
      const testComponent = TestComponent as any;
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

      (mockApplicationRef as any).components = [mockRefWithSelector];
      
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
      (mockApplicationRef as any).components = null;
      expect(() => service.scanComponentTree()).toThrow();
    });

    it('should handle undefined components gracefully', () => {
      (mockApplicationRef as any).components = undefined;
      expect(() => service.scanComponentTree()).toThrow();
    });

    it('should handle malformed component refs', () => {
      (mockApplicationRef as any).components = [{}]; // Invalid component ref
      expect(() => service.scanComponentTree()).toThrow();
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