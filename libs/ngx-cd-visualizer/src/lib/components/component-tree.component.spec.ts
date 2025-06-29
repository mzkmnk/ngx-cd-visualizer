import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentTreeComponent } from './component-tree.component';
import { ComponentNode } from '../models';
import { Component } from '@angular/core';

// Test wrapper component
@Component({
  template: `
    <lib-component-tree
      [nodes]="nodes"
      [expandedNodes]="expandedNodes"
      [selectedNode]="selectedNode"
      (nodeToggle)="onNodeToggle($event)"
      (nodeSelect)="onNodeSelect($event)">
    </lib-component-tree>
  `,
  imports: [ComponentTreeComponent]
})
class TestWrapperComponent {
  nodes: ComponentNode[] = [];
  expandedNodes = new Set<string>();
  selectedNode: string | null = null;

  onNodeToggle = jest.fn();
  onNodeSelect = jest.fn();
}

describe('ComponentTreeComponent', () => {
  let wrapper: TestWrapperComponent;
  let component: ComponentTreeComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

  // Test data
  const createMockNode = (
    id: string, 
    name: string, 
    children: ComponentNode[] = []
  ): ComponentNode => ({
    id,
    name,
    selector: `app-${name.toLowerCase()}`,
    componentRef: {} as any,
    componentType: class {} as any,
    parent: null,
    children,
    isOnPushStrategy: false,
    changeDetectionCount: 0,
    isActive: false,
    depth: 0
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    wrapper = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display empty state when no nodes', () => {
      wrapper.nodes = [];
      fixture.detectChanges();
      
      expect(component.flattenedNodes()).toHaveLength(0);
    });
  });

  describe('Tree Flattening', () => {
    beforeEach(() => {
      const mockNodes = [
        createMockNode('root', 'Root', [
          createMockNode('child1', 'Child1'),
          createMockNode('child2', 'Child2', [
            createMockNode('grandchild', 'GrandChild')
          ])
        ])
      ];
      wrapper.nodes = mockNodes;
    });

    it('should flatten tree structure correctly with no expanded nodes', () => {
      wrapper.expandedNodes = new Set<string>();
      fixture.detectChanges();

      const flattened = component.flattenedNodes();
      
      // Should only show root level
      expect(flattened).toHaveLength(1);
      expect(flattened[0].node.id).toBe('root');
      expect(flattened[0].level).toBe(0);
    });

    it('should include children when parent is expanded', () => {
      wrapper.expandedNodes = new Set(['root']);
      fixture.detectChanges();

      const flattened = component.flattenedNodes();
      
      // Should show root + its children
      expect(flattened).toHaveLength(3);
      expect(flattened[0].node.id).toBe('root');
      expect(flattened[0].level).toBe(0);
      expect(flattened[1].node.id).toBe('child1');
      expect(flattened[1].level).toBe(1);
      expect(flattened[2].node.id).toBe('child2');
      expect(flattened[2].level).toBe(1);
    });

    it('should include grandchildren when both parent and grandparent are expanded', () => {
      wrapper.expandedNodes = new Set(['root', 'child2']);
      fixture.detectChanges();

      const flattened = component.flattenedNodes();
      
      // Should show all nodes
      expect(flattened).toHaveLength(4);
      expect(flattened[0].node.id).toBe('root');
      expect(flattened[0].level).toBe(0);
      expect(flattened[1].node.id).toBe('child1');
      expect(flattened[1].level).toBe(1);
      expect(flattened[2].node.id).toBe('child2');
      expect(flattened[2].level).toBe(1);
      expect(flattened[3].node.id).toBe('grandchild');
      expect(flattened[3].level).toBe(2);
    });
  });

  describe('Event Handling', () => {
    it('should emit nodeToggle event', () => {
      component.onNodeToggle('test-node');
      expect(wrapper.onNodeToggle).toHaveBeenCalledWith('test-node');
    });

    it('should emit nodeSelect event', () => {
      component.onNodeSelect('test-node');
      expect(wrapper.onNodeSelect).toHaveBeenCalledWith('test-node');
    });
  });

  describe('Selected Node Handling', () => {
    it('should track selected node', () => {
      wrapper.selectedNode = 'test-node';
      fixture.detectChanges();
      
      expect(component.selectedNode()).toBe('test-node');
    });

    it('should handle null selected node', () => {
      wrapper.selectedNode = null;
      fixture.detectChanges();
      
      expect(component.selectedNode()).toBeNull();
    });
  });
});