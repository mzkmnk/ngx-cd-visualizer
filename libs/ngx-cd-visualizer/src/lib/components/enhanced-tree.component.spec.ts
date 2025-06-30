import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef, Type } from '@angular/core';
import { EnhancedTreeComponent, TreeNodeDisplay } from './enhanced-tree.component';
import { ComponentNode } from '../models';

// Test wrapper component
@Component({
  template: `
    <lib-enhanced-tree
      [nodes]="nodes"
      [expandedNodes]="expandedNodes"
      [selectedNode]="selectedNode"
      [compact]="compact"
      [showCounts]="showCounts"
      [showTimestamps]="showTimestamps"
      [filterMode]="filterMode"
      (nodeToggle)="onNodeToggle($event)"
      (nodeSelect)="onNodeSelect($event)">
    </lib-enhanced-tree>
  `,
  imports: [EnhancedTreeComponent]
})
class TestWrapperComponent {
  nodes: ComponentNode[] = [];
  expandedNodes = new Set<string>();
  selectedNode: string | null = null;
  compact = false;
  showCounts = true;
  showTimestamps = true;
  filterMode: 'all' | 'active-only' | 'onpush-only' | 'modified-only' = 'all';

  onNodeToggle = jest.fn();
  onNodeSelect = jest.fn();

  createMockNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
    return {
      id: 'test-node',
      name: 'TestComponent',
      selector: 'app-test',
      componentRef: {} as ComponentRef<object>,
      componentType: class {} as Type<object>,
      parent: null,
      children: [],
      isOnPushStrategy: false,
      changeDetectionCount: 0,
      isActive: false,
      depth: 0,
      lastChangeDetectionTime: undefined,
      ...overrides
    };
  }
}

describe('EnhancedTreeComponent', () => {
  let wrapper: TestWrapperComponent;
  let component: EnhancedTreeComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

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
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should display empty state when no nodes provided', () => {
      wrapper.nodes = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No components to display');
    });

    it('should display different empty state messages based on filter mode', () => {
      wrapper.nodes = [];
      
      // Test active-only filter
      wrapper.filterMode = 'active-only';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No active components found');

      // Test onpush-only filter
      wrapper.filterMode = 'onpush-only';
      fixture.detectChanges();
      
      expect(compiled.textContent).toContain('No OnPush components found');
    });
  });

  describe('Node Filtering', () => {
    beforeEach(() => {
      wrapper.nodes = [
        wrapper.createMockNode({ id: 'active', name: 'ActiveComponent', isActive: true }),
        wrapper.createMockNode({ id: 'onpush', name: 'OnPushComponent', isOnPushStrategy: true }),
        wrapper.createMockNode({ id: 'modified', name: 'ModifiedComponent', changeDetectionCount: 5 }),
        wrapper.createMockNode({ id: 'normal', name: 'NormalComponent' })
      ];
    });

    it('should show all nodes when filter mode is "all"', () => {
      wrapper.filterMode = 'all';
      fixture.detectChanges();

      const filteredNodes = component.filteredNodes();
      expect(filteredNodes.length).toBe(4);
    });

    it('should filter to show only active components', () => {
      wrapper.filterMode = 'active-only';
      fixture.detectChanges();

      const filteredNodes = component.filteredNodes();
      expect(filteredNodes.length).toBe(1);
      expect(filteredNodes[0].id).toBe('active');
    });

    it('should filter to show only OnPush components', () => {
      wrapper.filterMode = 'onpush-only';
      fixture.detectChanges();

      const filteredNodes = component.filteredNodes();
      expect(filteredNodes.length).toBe(1);
      expect(filteredNodes[0].id).toBe('onpush');
    });

    it('should filter to show only modified components', () => {
      wrapper.filterMode = 'modified-only';
      fixture.detectChanges();

      const filteredNodes = component.filteredNodes();
      expect(filteredNodes.length).toBe(1);
      expect(filteredNodes[0].id).toBe('modified');
    });
  });

  describe('Tree Structure Display', () => {
    beforeEach(() => {
      const rootNode = wrapper.createMockNode({
        id: 'root',
        name: 'RootComponent',
        children: [
          wrapper.createMockNode({
            id: 'child1',
            name: 'Child1Component',
            depth: 1,
            children: [
              wrapper.createMockNode({
                id: 'grandchild1',
                name: 'GrandChild1Component',
                depth: 2,
                children: []
              })
            ]
          }),
          wrapper.createMockNode({
            id: 'child2',
            name: 'Child2Component',
            depth: 1,
            children: []
          })
        ]
      });
      wrapper.nodes = [rootNode];
    });

    it('should display root nodes when not expanded', () => {
      wrapper.expandedNodes = new Set();
      fixture.detectChanges();

      const displayItems = component.displayItems();
      expect(displayItems.length).toBe(1);
      expect(displayItems[0].node.id).toBe('root');
      expect(displayItems[0].level).toBe(0);
    });

    it('should display children when parent is expanded', () => {
      wrapper.expandedNodes = new Set(['root']);
      fixture.detectChanges();

      const displayItems = component.displayItems();
      expect(displayItems.length).toBe(3); // root + 2 children
      
      const childItems = displayItems.filter(item => item.level === 1);
      expect(childItems.length).toBe(2);
      expect(childItems[0].node.id).toBe('child1');
      expect(childItems[1].node.id).toBe('child2');
    });

    it('should display grandchildren when both parent and grandparent are expanded', () => {
      wrapper.expandedNodes = new Set(['root', 'child1']);
      fixture.detectChanges();

      const displayItems = component.displayItems();
      expect(displayItems.length).toBe(4); // root + 2 children + 1 grandchild
      
      const grandchildItem = displayItems.find(item => item.level === 2);
      expect(grandchildItem).toBeTruthy();
      expect(grandchildItem?.node.id).toBe('grandchild1');
    });

    it('should correctly identify last child for proper line drawing', () => {
      wrapper.expandedNodes = new Set(['root']);
      fixture.detectChanges();

      const displayItems = component.displayItems();
      const children = displayItems.filter(item => item.level === 1);
      
      expect(children[0].isLastChild).toBe(false); // child1
      expect(children[1].isLastChild).toBe(true);  // child2 (last)
    });
  });

  describe('Visual Styling and States', () => {
    beforeEach(() => {
      wrapper.nodes = [
        wrapper.createMockNode({
          id: 'active-onpush',
          name: 'ActiveOnPushComponent',
          isActive: true,
          isOnPushStrategy: true,
          changeDetectionCount: 10
        })
      ];
      fixture.detectChanges();
    });

    it('should apply correct CSS classes for component states', () => {
      const compiled = fixture.nativeElement;
      const treeNode = compiled.querySelector('.tree-node');
      
      expect(treeNode.classList.contains('active')).toBe(true);
      expect(treeNode.classList.contains('onpush')).toBe(true);
      expect(treeNode.classList.contains('modified')).toBe(true);
    });

    it('should display OnPush strategy badge correctly', () => {
      const compiled = fixture.nativeElement;
      const strategyBadge = compiled.querySelector('.strategy-badge.onpush');
      
      expect(strategyBadge).toBeTruthy();
      expect(strategyBadge.textContent.trim()).toBe('OnPush');
    });

    it('should display activity indicator for active components', () => {
      const compiled = fixture.nativeElement;
      const activityIndicator = compiled.querySelector('.activity-indicator');
      
      expect(activityIndicator).toBeTruthy();
      expect(activityIndicator.title).toBe('Active');
    });

    it('should show change detection count when showCounts is true', () => {
      wrapper.showCounts = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const changeCount = compiled.querySelector('.change-count');
      
      expect(changeCount).toBeTruthy();
      expect(changeCount.textContent.trim()).toBe('10');
    });

    it('should hide change detection count when showCounts is false', () => {
      wrapper.showCounts = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const changeCount = compiled.querySelector('.change-count');
      
      expect(changeCount).toBeFalsy();
    });
  });

  describe('Interaction Behavior', () => {
    beforeEach(() => {
      const nodeWithChildren = wrapper.createMockNode({
        id: 'parent',
        name: 'ParentComponent',
        children: [
          wrapper.createMockNode({ id: 'child', name: 'ChildComponent' })
        ]
      });
      wrapper.nodes = [nodeWithChildren];
      fixture.detectChanges();
    });

    it('should emit nodeToggle when expand button is clicked', () => {
      const compiled = fixture.nativeElement;
      const expandButton = compiled.querySelector('.expand-button');
      
      expect(expandButton).toBeTruthy();
      expandButton.click();
      
      expect(wrapper.onNodeToggle).toHaveBeenCalledWith('parent');
    });

    it('should emit nodeSelect when tree node is clicked', () => {
      const compiled = fixture.nativeElement;
      const treeNode = compiled.querySelector('.tree-node');
      
      treeNode.click();
      
      expect(wrapper.onNodeSelect).toHaveBeenCalledWith('parent');
    });

    it('should prevent event propagation when expand button is clicked', () => {
      const compiled = fixture.nativeElement;
      const expandButton = compiled.querySelector('.expand-button');
      
      const mockEvent = new Event('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mockEvent, 'stopPropagation');
      
      expandButton.dispatchEvent(mockEvent);
      
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should show expand button for nodes with children', () => {
      const compiled = fixture.nativeElement;
      const expandButton = compiled.querySelector('.expand-button');
      const expandPlaceholder = compiled.querySelector('.expand-placeholder');
      
      expect(expandButton).toBeTruthy();
      expect(expandPlaceholder).toBeFalsy();
    });

    it('should show placeholder for nodes without children', () => {
      wrapper.nodes = [wrapper.createMockNode({ id: 'leaf', children: [] })];
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const expandButton = compiled.querySelector('.expand-button');
      const expandPlaceholder = compiled.querySelector('.expand-placeholder');
      
      expect(expandButton).toBeFalsy();
      expect(expandPlaceholder).toBeTruthy();
    });
  });

  describe('Formatting Utilities', () => {
    it('should format counts correctly', () => {
      expect(component.formatCount(0)).toBe('0');
      expect(component.formatCount(42)).toBe('42');
      expect(component.formatCount(999)).toBe('999');
      expect(component.formatCount(1000)).toBe('999+');
      expect(component.formatCount(9999)).toBe('999+');
    });

    it('should format time differences correctly', () => {
      const now = Date.now();
      
      expect(component.formatTime(now - 500)).toBe('now');
      expect(component.formatTime(now - 5000)).toBe('5s');
      expect(component.formatTime(now - 120000)).toBe('2m');
      expect(component.formatTime(now - 7200000)).toBe('2h');
    });

    it('should format timestamps correctly', () => {
      const testTime = new Date('2024-01-01T12:00:00').getTime();
      const formatted = component.formatTimestamp(testTime);
      
      // Should be in locale time format
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe('Compact Mode', () => {
    beforeEach(() => {
      wrapper.nodes = [wrapper.createMockNode()];
    });

    it('should apply compact class when compact mode is enabled', () => {
      wrapper.compact = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const enhancedTree = compiled.querySelector('.enhanced-tree');
      
      expect(enhancedTree.classList.contains('compact')).toBe(true);
    });

    it('should not apply compact class when compact mode is disabled', () => {
      wrapper.compact = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const enhancedTree = compiled.querySelector('.enhanced-tree');
      
      expect(enhancedTree.classList.contains('compact')).toBe(false);
    });
  });

  describe('Indentation Calculation', () => {
    it('should calculate correct indent width for different levels', () => {
      const item0 = { level: 0 } as TreeNodeDisplay;
      const item1 = { level: 1 } as TreeNodeDisplay;
      const item3 = { level: 3 } as TreeNodeDisplay;

      expect(component.getIndentWidth(item0)).toBe(12); // 0 * 20 + 12
      expect(component.getIndentWidth(item1)).toBe(32); // 1 * 20 + 12
      expect(component.getIndentWidth(item3)).toBe(72); // 3 * 20 + 12
    });

    it('should not return negative indent width', () => {
      const itemNegative = { level: -1 } as TreeNodeDisplay;
      expect(component.getIndentWidth(itemNegative)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Selection State', () => {
    beforeEach(() => {
      wrapper.nodes = [
        wrapper.createMockNode({ id: 'node1', name: 'Node1' }),
        wrapper.createMockNode({ id: 'node2', name: 'Node2' })
      ];
    });

    it('should highlight selected node', () => {
      wrapper.selectedNode = 'node1';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const treeNodes = compiled.querySelectorAll('.tree-node');
      
      expect(treeNodes[0].classList.contains('selected')).toBe(true);
      expect(treeNodes[1].classList.contains('selected')).toBe(false);
    });

    it('should clear selection when selectedNode is null', () => {
      wrapper.selectedNode = null;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const selectedNodes = compiled.querySelectorAll('.tree-node.selected');
      
      expect(selectedNodes.length).toBe(0);
    });
  });
});