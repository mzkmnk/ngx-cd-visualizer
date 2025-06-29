import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentNodeComponent } from './component-node.component';
import { ComponentNode } from '../models';
import { Component } from '@angular/core';

// Test wrapper component to provide inputs
@Component({
  template: `
    <lib-component-node
      [node]="node"
      [level]="level"
      [isExpanded]="isExpanded"
      [hasChildren]="hasChildren"
      [isSelected]="isSelected"
      (nodeToggle)="onToggle()"
      (nodeSelect)="onSelect()">
    </lib-component-node>
  `,
  imports: [ComponentNodeComponent]
})
class TestWrapperComponent {
  node: ComponentNode = this.createMockNode();
  level = 0;
  isExpanded = false;
  hasChildren = false;
  isSelected = false;

  onToggle = jest.fn();
  onSelect = jest.fn();

  createMockNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
    return {
      id: 'test-node',
      name: 'TestComponent',
      selector: 'app-test',
      componentRef: {} as any,
      componentType: class {} as any,
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

describe('ComponentNodeComponent', () => {
  let wrapper: TestWrapperComponent;
  let component: ComponentNodeComponent;
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
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should receive inputs correctly', () => {
      wrapper.level = 2;
      wrapper.isExpanded = true;
      wrapper.hasChildren = true;
      wrapper.isSelected = true;
      fixture.detectChanges();

      expect(component.level()).toBe(2);
      expect(component.isExpanded()).toBe(true);
      expect(component.hasChildren()).toBe(true);
      expect(component.isSelected()).toBe(true);
    });
  });

  describe('Indent Calculation', () => {
    it('should calculate correct indent width for level 0', () => {
      wrapper.level = 0;
      fixture.detectChanges();
      expect(component.indentWidth()).toBe(8); // 0 * 16 + 8
    });

    it('should calculate correct indent width for level 1', () => {
      wrapper.level = 1;
      fixture.detectChanges();
      expect(component.indentWidth()).toBe(24); // 1 * 16 + 8
    });

    it('should calculate correct indent width for level 3', () => {
      wrapper.level = 3;
      fixture.detectChanges();
      expect(component.indentWidth()).toBe(56); // 3 * 16 + 8
    });
  });

  describe('Event Handling', () => {
    it('should emit toggle event and stop propagation', () => {
      const mockEvent = {
        stopPropagation: jest.fn()
      } as any;

      component.onToggle(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(wrapper.onToggle).toHaveBeenCalled();
    });

    it('should emit select event', () => {
      component.onSelect();
      expect(wrapper.onSelect).toHaveBeenCalled();
    });
  });

  describe('Count Formatting', () => {
    it('should format small counts correctly', () => {
      expect(component.formatCount(0)).toBe('0');
      expect(component.formatCount(1)).toBe('1');
      expect(component.formatCount(42)).toBe('42');
      expect(component.formatCount(999)).toBe('999');
    });

    it('should format large counts as 999+', () => {
      expect(component.formatCount(1000)).toBe('999+');
      expect(component.formatCount(5000)).toBe('999+');
      expect(component.formatCount(999999)).toBe('999+');
    });
  });

  describe('Time Formatting', () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
      Date.now = jest.fn(() => 1000000); // Fixed timestamp
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('should format recent times as "now"', () => {
      const recentTime = 999500; // 500ms ago
      expect(component.formatTime(recentTime)).toBe('now');
    });

    it('should format seconds correctly', () => {
      const fiveSecondsAgo = 995000; // 5 seconds ago
      expect(component.formatTime(fiveSecondsAgo)).toBe('5s');
      
      const thirtySecondsAgo = 970000; // 30 seconds ago
      expect(component.formatTime(thirtySecondsAgo)).toBe('30s');
    });

    it('should format minutes correctly', () => {
      const fiveMinutesAgo = 700000; // 5 minutes ago
      expect(component.formatTime(fiveMinutesAgo)).toBe('5m');
      
      const thirtyMinutesAgo = 200000; // 13+ minutes ago
      expect(component.formatTime(thirtyMinutesAgo)).toBe('13m');
    });

    it('should format hours correctly', () => {
      const twoHoursAgo = -6200000; // 2+ hours ago (negative because current time is 1000000)
      expect(component.formatTime(twoHoursAgo)).toBe('2h');
    });
  });

  describe('Node Properties Display', () => {
    it('should handle node with basic properties', () => {
      const node = wrapper.createMockNode({
        name: 'BasicComponent',
        selector: 'app-basic'
      });
      
      wrapper.node = node;
      fixture.detectChanges();
      
      expect(component.node().name).toBe('BasicComponent');
      expect(component.node().selector).toBe('app-basic');
      expect(component.node().isOnPushStrategy).toBe(false);
      expect(component.node().isActive).toBe(false);
      expect(component.node().changeDetectionCount).toBe(0);
    });

    it('should handle OnPush component', () => {
      const node = wrapper.createMockNode({
        isOnPushStrategy: true
      });
      
      wrapper.node = node;
      fixture.detectChanges();
      
      expect(component.node().isOnPushStrategy).toBe(true);
    });

    it('should handle active component', () => {
      const node = wrapper.createMockNode({
        isActive: true,
        lastChangeDetectionTime: Date.now() - 1000
      });
      
      wrapper.node = node;
      fixture.detectChanges();
      
      expect(component.node().isActive).toBe(true);
      expect(component.node().lastChangeDetectionTime).toBeDefined();
    });

    it('should handle component with change detection count', () => {
      const node = wrapper.createMockNode({
        changeDetectionCount: 42
      });
      
      wrapper.node = node;
      fixture.detectChanges();
      
      expect(component.node().changeDetectionCount).toBe(42);
    });
  });

  describe('Component State Combinations', () => {
    it('should handle OnPush + Active component', () => {
      const node = wrapper.createMockNode({
        isOnPushStrategy: true,
        isActive: true,
        changeDetectionCount: 5,
        lastChangeDetectionTime: Date.now() - 500
      });
      
      wrapper.node = node;
      fixture.detectChanges();
      
      expect(component.node().isOnPushStrategy).toBe(true);
      expect(component.node().isActive).toBe(true);
      expect(component.node().changeDetectionCount).toBe(5);
      expect(component.node().lastChangeDetectionTime).toBeDefined();
    });
  });
});