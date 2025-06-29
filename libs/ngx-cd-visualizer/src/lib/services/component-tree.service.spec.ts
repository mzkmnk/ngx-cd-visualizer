import { TestBed } from '@angular/core/testing';
import { ApplicationRef, ChangeDetectionStrategy, ComponentRef } from '@angular/core';
import { ComponentTreeService } from './component-tree.service';
import { ComponentNode } from '../models';
import { 
  createMockApplicationRef, 
  createMockComponentRef, 
  createMockComponentNode,
  MockComponent,
  MockOnPushComponent,
  createMockComponentTree,
  MockApplicationRef
} from '../../test-utils';
import { setupSimpleTestEnvironment } from '../../test-utils/angular-test-setup';

describe('ComponentTreeService', () => {
  let service: ComponentTreeService;
  let mockApplicationRef: MockApplicationRef;

  beforeEach(() => {
    mockApplicationRef = createMockApplicationRef();
    
    TestBed.configureTestingModule({
      providers: [
        ComponentTreeService,
        { provide: ApplicationRef, useValue: mockApplicationRef }
      ]
    });
    
    service = TestBed.inject(ComponentTreeService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty component tree', () => {
      expect(service.componentTree()).toEqual([]);
      expect(service.rootComponents()).toEqual([]);
      expect(service.isScanning()).toBe(false);
      expect(service.componentCount()).toBe(0);
      expect(service.onPushComponentCount()).toBe(0);
    });

    it('should have readonly signals', () => {
      expect(() => (service.componentTree as any).set([])).toThrow();
      expect(() => (service.rootComponents as any).set([])).toThrow();
      expect(() => (service.isScanning as any).set(true)).toThrow();
    });
  });

  describe('Component Tree Scanning', () => {
    it('should scan component tree', () => {
      const mockComponent = createMockComponentRef(MockComponent);
      mockApplicationRef.components = [mockComponent as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('MockComponent');
      expect(tree[0].selector).toBe('app-mock');
      expect(tree[0].componentRef).toBe(mockComponent);
    });

    it('should not scan while already scanning', () => {
      const scanSpy = jest.spyOn(mockApplicationRef, 'components', 'get');
      
      // Simulate concurrent scanning
      service.scanComponentTree();
      service.scanComponentTree();
      
      expect(scanSpy).toHaveBeenCalledTimes(1);
    });

    it('should reset scanning flag after completion', () => {
      service.scanComponentTree();
      
      expect(service.isScanning()).toBe(false);
    });

    it('should reset scanning flag even if error occurs', () => {
      mockApplicationRef.components = null as any;
      
      expect(() => service.scanComponentTree()).not.toThrow();
      expect(service.isScanning()).toBe(false);
    });

    it('should handle multiple root components', () => {
      const mockComponent1 = createMockComponentRef(MockComponent);
      const mockComponent2 = createMockComponentRef(MockOnPushComponent);
      mockApplicationRef.components = [mockComponent1 as unknown as ComponentRef<unknown>, mockComponent2 as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      const rootComponents = service.rootComponents();
      
      expect(tree).toHaveLength(2);
      expect(rootComponents).toHaveLength(2);
      expect(rootComponents[0].depth).toBe(0);
      expect(rootComponents[1].depth).toBe(0);
    });
  });

  describe('OnPush Detection', () => {
    it('should detect OnPush components', () => {
      const onPushComponent = createMockComponentRef(MockOnPushComponent);
      mockApplicationRef.components = [onPushComponent as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].isOnPushStrategy).toBe(true);
      expect(service.onPushComponentCount()).toBe(1);
    });

    it('should detect default change detection components', () => {
      const defaultComponent = createMockComponentRef(MockComponent);
      mockApplicationRef.components = [defaultComponent as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].isOnPushStrategy).toBe(false);
      expect(service.onPushComponentCount()).toBe(0);
    });

    it('should handle components without annotations', () => {
      class ComponentWithoutAnnotations {}
      const component = createMockComponentRef(ComponentWithoutAnnotations);
      mockApplicationRef.components = [component as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].isOnPushStrategy).toBe(false);
    });
  });

  describe('Component Search', () => {
    beforeEach(() => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
    });

    it('should find component by ID', () => {
      const component = service.findComponentById('parent-1');
      
      expect(component).toBeTruthy();
      expect(component?.name).toBe('ParentComponent');
    });

    it('should return null for non-existent component ID', () => {
      const component = service.findComponentById('non-existent');
      
      expect(component).toBeNull();
    });

    it('should find components by selector', () => {
      const components = service.findComponentBySelector('app-child1');
      
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('ChildComponent1');
    });

    it('should find components by name', () => {
      const components = service.findComponentsByName('Child');
      
      expect(components).toHaveLength(2);
      expect(components.every(c => c.name.includes('Child'))).toBe(true);
    });

    it('should return empty array for non-matching searches', () => {
      expect(service.findComponentBySelector('non-existent')).toEqual([]);
      expect(service.findComponentsByName('non-existent')).toEqual([]);
    });
  });

  describe('Component Path', () => {
    beforeEach(() => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
    });

    it('should get component path from root to target', () => {
      const path = service.getComponentPath('child-1');
      
      expect(path).toHaveLength(2);
      expect(path[0].name).toBe('ParentComponent');
      expect(path[1].name).toBe('ChildComponent1');
    });

    it('should return path with single component for root', () => {
      const path = service.getComponentPath('parent-1');
      
      expect(path).toHaveLength(1);
      expect(path[0].name).toBe('ParentComponent');
    });

    it('should return empty path for non-existent component', () => {
      const path = service.getComponentPath('non-existent');
      
      expect(path).toEqual([]);
    });
  });

  describe('Component Activity Tracking', () => {
    beforeEach(() => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
    });

    it('should update component activity', () => {
      service.updateComponentActivity('child-1', true);
      
      const component = service.findComponentById('child-1');
      expect(component?.isActive).toBe(true);
      expect(component?.lastChangeDetectionTime).toBeTruthy();
    });

    it('should increment change detection count', () => {
      service.incrementChangeDetectionCount('child-1');
      
      const component = service.findComponentById('child-1');
      expect(component?.changeDetectionCount).toBe(1);
      expect(component?.isActive).toBe(true);
      expect(component?.lastChangeDetectionTime).toBeTruthy();
    });

    it('should reset activity states', () => {
      // First activate some components
      service.updateComponentActivity('child-1', true);
      service.updateComponentActivity('child-2', true);
      
      service.resetActivityStates();
      
      const tree = service.componentTree();
      expect(tree.every(node => !node.isActive)).toBe(true);
    });

    it('should preserve change detection counts when resetting activity', () => {
      service.incrementChangeDetectionCount('child-1');
      const originalCount = service.findComponentById('child-1')?.changeDetectionCount;
      
      service.resetActivityStates();
      
      const component = service.findComponentById('child-1');
      expect(component?.changeDetectionCount).toBe(originalCount);
      expect(component?.isActive).toBe(false);
    });
  });

  describe('Tree Snapshots', () => {
    beforeEach(() => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
      service['_rootComponents'].set([tree[0]]);
    });

    it('should create component tree snapshot', () => {
      const snapshot = service.createSnapshot();
      
      expect(snapshot.timestamp).toBeTruthy();
      expect(snapshot.nodes).toHaveLength(3);
      expect(snapshot.rootNodes).toHaveLength(1);
      expect(snapshot.nodes[0].name).toBe('ParentComponent');
    });

    it('should create independent snapshot copies', () => {
      const snapshot = service.createSnapshot();
      
      // Modify original tree
      service.updateComponentActivity('child-1', true);
      
      // Snapshot should be unchanged
      const snapshotComponent = snapshot.nodes.find(n => n.id === 'child-1');
      expect(snapshotComponent?.isActive).toBe(false);
    });
  });

  describe('Selector Generation', () => {
    it('should generate kebab-case selector from component name', () => {
      class MyTestComponent {}
      const component = createMockComponentRef(MyTestComponent);
      mockApplicationRef.components = [component as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].selector).toBe('<my-test-component>');
    });

    it('should use annotation selector when available', () => {
      const component = createMockComponentRef(MockComponent);
      mockApplicationRef.components = [component as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].selector).toBe('app-mock');
    });

    it('should handle components without names', () => {
      const AnonymousComponent = function() {};
      Object.defineProperty(AnonymousComponent, 'name', { value: '' });
      
      const component = createMockComponentRef(AnonymousComponent as any);
      mockApplicationRef.components = [component as unknown as ComponentRef<unknown>];
      
      service.scanComponentTree();
      
      const tree = service.componentTree();
      expect(tree[0].selector).toBe('<unknown>');
    });
  });

  describe('Computed Properties', () => {
    it('should calculate component count', () => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
      
      expect(service.componentCount()).toBe(3);
    });

    it('should calculate OnPush component count', () => {
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
      
      expect(service.onPushComponentCount()).toBe(1);
    });

    it('should update computed properties when tree changes', () => {
      expect(service.componentCount()).toBe(0);
      
      const tree = createMockComponentTree();
      service['_componentTree'].set(tree);
      
      expect(service.componentCount()).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle ApplicationRef errors gracefully', () => {
      const errorApplicationRef: MockApplicationRef = {
        ...mockApplicationRef,
        get components(): ComponentRef<unknown>[] {
          throw new Error('ApplicationRef error');
        }
      };
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ComponentTreeService,
          { provide: ApplicationRef, useValue: errorApplicationRef }
        ]
      });
      
      const errorService = TestBed.inject(ComponentTreeService);
      
      expect(() => errorService.scanComponentTree()).not.toThrow();
      expect(errorService.componentTree()).toEqual([]);
    });

    it('should handle component metadata access errors', () => {
      class ProblematicComponent {
        static get __annotations__() {
          throw new Error('Metadata error');
        }
      }
      
      const component = createMockComponentRef(ProblematicComponent);
      mockApplicationRef.components = [component as unknown as ComponentRef<unknown>];
      
      expect(() => service.scanComponentTree()).not.toThrow();
      
      const tree = service.componentTree();
      expect(tree[0].isOnPushStrategy).toBe(false);
      expect(tree[0].selector).toContain('problematic-component');
    });
  });
});