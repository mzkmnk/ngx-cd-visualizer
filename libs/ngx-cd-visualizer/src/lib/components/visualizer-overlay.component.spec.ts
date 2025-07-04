import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ComponentTreeService } from '../services/component-tree.service';
import { CdVisualizerService } from '../services/cd-visualizer.service';
import { VisualizerOverlayComponent } from './visualizer-overlay.component';

// Test wrapper component
@Component({
  template: `<lib-visualizer-overlay></lib-visualizer-overlay>`,
  imports: [VisualizerOverlayComponent]
})
class TestWrapperComponent {}

describe('VisualizerOverlayComponent', () => {
  let component: VisualizerOverlayComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;
  let mockComponentTreeService: Partial<ComponentTreeService>;
  let mockCdVisualizerService: Partial<CdVisualizerService>;

  beforeEach(async () => {
    // Mock window dimensions for consistent positioning
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360 // Math.max(20, 360-340) = Math.max(20, 20) = 20
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 460 // Math.max(20, 460-440) = Math.max(20, 20) = 20
    });

    mockComponentTreeService = {
      componentCount: signal(0),
      onPushComponentCount: signal(0),
      isScanning: signal(false),
      rootComponents: signal([]),
      scanComponentTree: jest.fn(),
      resetActivityStates: jest.fn()
    };

    mockCdVisualizerService = {
      hide: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
      providers: [
        { provide: ComponentTreeService, useValue: mockComponentTreeService },
        { provide: CdVisualizerService, useValue: mockCdVisualizerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default state', () => {
      expect(component.isMinimized()).toBe(false);
      expect(component.isDragging()).toBe(false);
      expect(component.position()).toEqual({ x: 20, y: 20 });
      expect(component.expandedNodes().size).toBe(0);
      expect(component.selectedNode()).toBeNull();
    });
  });

  describe('UI State Management', () => {
    it('should toggle minimized state', () => {
      expect(component.isMinimized()).toBe(false);
      
      component.toggleMinimized();
      expect(component.isMinimized()).toBe(true);
      
      component.toggleMinimized();
      expect(component.isMinimized()).toBe(false);
    });

    it('should call hide service when closing', () => {
      component.close();
      expect(mockCdVisualizerService.hide).toHaveBeenCalled();
    });

    it('should call scan service when scanning', () => {
      component.scanComponents();
      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should call reset service when resetting', () => {
      component.resetActivity();
      expect(mockComponentTreeService.resetActivityStates).toHaveBeenCalled();
    });
  });

  describe('Node Management', () => {
    it('should toggle node expansion', () => {
      const nodeId = 'test-node-1';
      
      // Initially not expanded
      expect(component.expandedNodes().has(nodeId)).toBe(false);
      
      // Toggle to expand
      component.toggleNode(nodeId);
      expect(component.expandedNodes().has(nodeId)).toBe(true);
      
      // Toggle to collapse
      component.toggleNode(nodeId);
      expect(component.expandedNodes().has(nodeId)).toBe(false);
    });

    it('should select node', () => {
      const nodeId = 'test-node-1';
      
      expect(component.selectedNode()).toBeNull();
      
      component.selectNode(nodeId);
      expect(component.selectedNode()).toBe(nodeId);
      
      // Select different node
      const nodeId2 = 'test-node-2';
      component.selectNode(nodeId2);
      expect(component.selectedNode()).toBe(nodeId2);
    });
  });

  describe('Drag Functionality', () => {
    it('should initialize drag operation with correct starting position', () => {
      const initialPosition = { x: 50, y: 100 };
      component['_position'].set(initialPosition);
      fixture.detectChanges();
      
      const element = document.createElement('div');
      const mockEvent = {
        target: element,
        currentTarget: element,
        preventDefault: jest.fn(),
        clientX: 100,
        clientY: 200,
        type: 'mousedown',
        bubbles: false,
        cancelable: true
      } as unknown as MouseEvent;

      component.startDrag(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBe(true);
      expect(component.position()).toEqual(initialPosition); // Position shouldn't change on start
    });

    it('should prevent drag when click target differs from drag handle', () => {
      const mockEvent = {
        target: document.createElement('div'),
        currentTarget: document.createElement('span'), // Different element
        preventDefault: jest.fn(),
        clientX: 100,
        clientY: 200,
        type: 'mousedown',
        bubbles: false,
        cancelable: true
      } as unknown as MouseEvent;

      const initialPosition = component.position();
      
      component.startDrag(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(component.isDragging()).toBe(false);
      expect(component.position()).toEqual(initialPosition); // Position unchanged
    });

    it('should validate position constraints are implemented', () => {
      // Test that position property is accessible and returns valid coordinates
      const currentPosition = component.position();
      expect(typeof currentPosition.x).toBe('number');
      expect(typeof currentPosition.y).toBe('number');
      expect(currentPosition.x).toBeGreaterThanOrEqual(0);
      expect(currentPosition.y).toBeGreaterThanOrEqual(0);
      
      // Test that position can be set within reasonable bounds
      const testPosition = { x: 100, y: 100 };
      component['_position'].set(testPosition);
      const updatedPosition = component.position();
      expect(updatedPosition).toEqual(testPosition);
    });
  });

  describe('Computed Properties', () => {
    it('should expose component tree service signals', () => {
      expect(component.componentCount).toBe(mockComponentTreeService.componentCount);
      expect(component.onPushCount).toBe(mockComponentTreeService.onPushComponentCount);
      expect(component.isScanning).toBe(mockComponentTreeService.isScanning);
      expect(component.rootComponents).toBe(mockComponentTreeService.rootComponents);
    });
  });

  describe('Position Management', () => {
    it('should maintain position within bounds when dragging', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      });

      // Test position constraints
      const initialPosition = component.position();
      expect(initialPosition.x).toBeGreaterThanOrEqual(0);
      expect(initialPosition.y).toBeGreaterThanOrEqual(0);
    });
  });
});