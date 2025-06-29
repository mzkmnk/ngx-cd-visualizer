import { 
  ChangeDetectionTrigger, 
  ComponentNode, 
  ChangeDetectionEvent,
  ChangeDetectionCycle,
  CdVisualizerConfig
} from './index';
import { createMockComponentNode, createMockChangeDetectionEvent } from '../../test-utils';

describe('Models', () => {
  describe('ChangeDetectionTrigger', () => {
    it('should have all expected trigger types', () => {
      expect(ChangeDetectionTrigger.UserInteraction).toBe('user-interaction');
      expect(ChangeDetectionTrigger.AsyncOperation).toBe('async-operation');
      expect(ChangeDetectionTrigger.InputChange).toBe('input-change');
      expect(ChangeDetectionTrigger.OutputEvent).toBe('output-event');
      expect(ChangeDetectionTrigger.SignalUpdate).toBe('signal-update');
      expect(ChangeDetectionTrigger.ManualTrigger).toBe('manual-trigger');
      expect(ChangeDetectionTrigger.Unknown).toBe('unknown');
    });

    it('should be a string enum', () => {
      Object.values(ChangeDetectionTrigger).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('ComponentNode', () => {
    it('should create valid component node with required properties', () => {
      const node = createMockComponentNode();
      
      expect(node.id).toBeTruthy();
      expect(typeof node.name).toBe('string');
      expect(typeof node.selector).toBe('string');
      expect(node.componentRef).toBeTruthy();
      expect(node.componentType).toBeTruthy();
      expect(Array.isArray(node.children)).toBe(true);
      expect(typeof node.isOnPushStrategy).toBe('boolean');
      expect(typeof node.changeDetectionCount).toBe('number');
      expect(typeof node.isActive).toBe('boolean');
      expect(typeof node.depth).toBe('number');
    });

    it('should support parent-child relationships', () => {
      const parent = createMockComponentNode({ id: 'parent' });
      const child = createMockComponentNode({ 
        id: 'child',
        parent,
        depth: 1
      });
      parent.children = [child];

      expect(child.parent).toBe(parent);
      expect(parent.children).toContain(child);
      expect(child.depth).toBe(1);
    });

    it('should support optional properties', () => {
      const nodeWithOptionals = createMockComponentNode({
        lastChangeDetectionTime: Date.now()
      });

      expect(nodeWithOptionals.lastChangeDetectionTime).toBeTruthy();
    });

    it('should handle null parent for root nodes', () => {
      const rootNode = createMockComponentNode({ parent: null });
      
      expect(rootNode.parent).toBeNull();
    });
  });

  describe('ChangeDetectionEvent', () => {
    it('should create valid change detection event', () => {
      const event = createMockChangeDetectionEvent();
      
      expect(event.id).toBeTruthy();
      expect(typeof event.timestamp).toBe('number');
      expect(event.componentNode).toBeTruthy();
      expect(Object.values(ChangeDetectionTrigger)).toContain(event.trigger);
      expect(typeof event.isManualTrigger).toBe('boolean');
    });

    it('should support all trigger types', () => {
      Object.values(ChangeDetectionTrigger).forEach(trigger => {
        const event = createMockChangeDetectionEvent({ trigger });
        expect(event.trigger).toBe(trigger);
      });
    });

    it('should distinguish manual triggers', () => {
      const manualEvent = createMockChangeDetectionEvent({ 
        isManualTrigger: true,
        trigger: ChangeDetectionTrigger.ManualTrigger
      });
      
      expect(manualEvent.isManualTrigger).toBe(true);
      expect(manualEvent.trigger).toBe(ChangeDetectionTrigger.ManualTrigger);
    });

    it('should have valid timestamp', () => {
      const beforeTime = Date.now();
      const event = createMockChangeDetectionEvent();
      const afterTime = Date.now();
      
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('ChangeDetectionCycle', () => {
    it('should create valid change detection cycle', () => {
      const cycle: ChangeDetectionCycle = {
        id: 'cycle-1',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        events: [],
        affectedComponents: []
      };
      
      expect(cycle.id).toBeTruthy();
      expect(typeof cycle.startTime).toBe('number');
      expect(typeof cycle.endTime).toBe('number');
      expect(Array.isArray(cycle.events)).toBe(true);
      expect(Array.isArray(cycle.affectedComponents)).toBe(true);
    });

    it('should support events and components', () => {
      const event = createMockChangeDetectionEvent();
      const component = createMockComponentNode();
      
      const cycle: ChangeDetectionCycle = {
        id: 'cycle-with-data',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        events: [event],
        affectedComponents: [component]
      };
      
      expect(cycle.events).toContain(event);
      expect(cycle.affectedComponents).toContain(component);
    });

    it('should handle optional endTime', () => {
      const cycle: Partial<ChangeDetectionCycle> = {
        id: 'ongoing-cycle',
        startTime: Date.now(),
        events: [],
        affectedComponents: []
        // endTime is optional during active cycle
      };
      
      expect(cycle.endTime).toBeUndefined();
    });
  });

  describe('ComponentTreeSnapshot', () => {
    it('should create valid snapshot', () => {
      const nodes = [createMockComponentNode()];
      const rootNodes = [nodes[0]];
      
      const snapshot = {
        timestamp: Date.now(),
        nodes,
        rootNodes
      };
      
      expect(typeof snapshot.timestamp).toBe('number');
      expect(Array.isArray(snapshot.nodes)).toBe(true);
      expect(Array.isArray(snapshot.rootNodes)).toBe(true);
      expect(snapshot.nodes).toContain(nodes[0]);
      expect(snapshot.rootNodes).toContain(rootNodes[0]);
    });
  });

  describe('CdVisualizerConfig', () => {
    it('should support all configuration options', () => {
      const config: CdVisualizerConfig = {
        enabled: true,
        position: 'bottom-right',
        theme: 'dark',
        showOnlyChanges: false,
        excludeComponents: ['test-component'],
        debugMode: true,
        maxHistorySize: 1000
      };
      
      expect(typeof config.enabled).toBe('boolean');
      expect(['bottom-right', 'bottom-left', 'top-right', 'top-left']).toContain(config.position);
      expect(['light', 'dark', 'auto']).toContain(config.theme);
      expect(typeof config.showOnlyChanges).toBe('boolean');
      expect(Array.isArray(config.excludeComponents)).toBe(true);
      expect(typeof config.debugMode).toBe('boolean');
      expect(typeof config.maxHistorySize).toBe('number');
    });

    it('should support all position values', () => {
      const positions: CdVisualizerConfig['position'][] = [
        'bottom-right', 'bottom-left', 'top-right', 'top-left'
      ];
      
      positions.forEach(position => {
        const config: CdVisualizerConfig = {
          enabled: true,
          position,
          theme: 'light',
          showOnlyChanges: false,
          excludeComponents: [],
          debugMode: false,
          maxHistorySize: 1000
        };
        
        expect(config.position).toBe(position);
      });
    });

    it('should support all theme values', () => {
      const themes: CdVisualizerConfig['theme'][] = ['light', 'dark', 'auto'];
      
      themes.forEach(theme => {
        const config: CdVisualizerConfig = {
          enabled: true,
          position: 'bottom-right',
          theme,
          showOnlyChanges: false,
          excludeComponents: [],
          debugMode: false,
          maxHistorySize: 1000
        };
        
        expect(config.theme).toBe(theme);
      });
    });

    it('should handle empty excludeComponents array', () => {
      const config: CdVisualizerConfig = {
        enabled: true,
        position: 'bottom-right',
        theme: 'light',
        showOnlyChanges: false,
        excludeComponents: [],
        debugMode: false,
        maxHistorySize: 1000
      };
      
      expect(config.excludeComponents).toEqual([]);
    });

    it('should handle multiple excluded components', () => {
      const excludedComponents = ['component1', 'component2', 'component3'];
      const config: CdVisualizerConfig = {
        enabled: true,
        position: 'bottom-right',
        theme: 'light',
        showOnlyChanges: false,
        excludeComponents: excludedComponents,
        debugMode: false,
        maxHistorySize: 1000
      };
      
      expect(config.excludeComponents).toEqual(excludedComponents);
    });
  });

  describe('Type Relationships', () => {
    it('should maintain proper type relationships between models', () => {
      const node = createMockComponentNode();
      const event = createMockChangeDetectionEvent({ componentNode: node });
      
      const cycle: ChangeDetectionCycle = {
        id: 'test-cycle',
        startTime: Date.now(),
        events: [event],
        affectedComponents: [node]
      };
      
      expect(cycle.events[0].componentNode).toBe(node);
      expect(cycle.affectedComponents[0]).toBe(node);
    });

    it('should support optional properties consistently', () => {
      const node = createMockComponentNode();
      
      // lastChangeDetectionTime is optional
      expect(node.lastChangeDetectionTime).toBeUndefined();
      
      // But can be set
      const nodeWithTime = createMockComponentNode({
        lastChangeDetectionTime: Date.now()
      });
      expect(typeof nodeWithTime.lastChangeDetectionTime).toBe('number');
    });
  });
});