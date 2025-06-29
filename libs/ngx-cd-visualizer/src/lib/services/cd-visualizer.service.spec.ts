import { TestBed } from '@angular/core/testing';
import { CdVisualizerService } from './cd-visualizer.service';
import { ChangeDetectionMonitorService } from './change-detection-monitor.service';
import { ComponentTreeService } from './component-tree.service';
import { NGX_CD_VISUALIZER_CONFIG } from '../tokens';
import { CdVisualizerConfig } from '../models';
import {
  createTestConfig,
  createMockComponentTree,
  createMockChangeDetectionEvent,
  flushTimersAndPromises
} from '../../test-utils';
import { setupSimpleTestEnvironment } from '../../test-utils/angular-test-setup';

describe('CdVisualizerService', () => {
  let service: CdVisualizerService;
  let mockMonitorService: jest.Mocked<ChangeDetectionMonitorService>;
  let mockComponentTreeService: jest.Mocked<ComponentTreeService>;
  let testConfig: CdVisualizerConfig;

  beforeEach(() => {
    testConfig = createTestConfig();

    mockMonitorService = {
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      isMonitoring: jest.fn().mockReturnValue(false),
      events: jest.fn().mockReturnValue([]),
      recentEvents: jest.fn().mockReturnValue([]),
      clearHistory: jest.fn(),
      recordEvent: jest.fn(),
      startCycle: jest.fn().mockReturnValue('cycle-1'),
      endCycle: jest.fn(),
      setMaxHistorySize: jest.fn(),
      cycles: jest.fn().mockReturnValue([])
    } as any;

    mockComponentTreeService = {
      scanComponentTree: jest.fn(),
      componentTree: jest.fn().mockReturnValue([]),
      resetActivityStates: jest.fn(),
      findComponentById: jest.fn(),
      getComponentPath: jest.fn().mockReturnValue([]),
      componentCount: jest.fn().mockReturnValue(0),
      onPushComponentCount: jest.fn().mockReturnValue(0),
      findComponentBySelector: jest.fn().mockReturnValue([]),
      findComponentsByName: jest.fn().mockReturnValue([]),
      rootComponents: jest.fn().mockReturnValue([]),
      isScanning: jest.fn().mockReturnValue(false),
      updateComponentActivity: jest.fn(),
      incrementChangeDetectionCount: jest.fn(),
      createSnapshot: jest.fn().mockReturnValue({
        timestamp: Date.now(),
        nodes: [],
        rootNodes: []
      })
    } as any;

    TestBed.configureTestingModule({
      providers: [
        CdVisualizerService,
        { provide: ChangeDetectionMonitorService, useValue: mockMonitorService },
        { provide: ComponentTreeService, useValue: mockComponentTreeService },
        { provide: NGX_CD_VISUALIZER_CONFIG, useValue: testConfig }
      ]
    });

    service = TestBed.inject(CdVisualizerService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with provided config', () => {
      const config = service.config();
      expect(config.enabled).toBe(true);
      expect(config.theme).toBe('light');
      expect(config.position).toBe('bottom-right');
    });

    it('should start monitoring when enabled', async () => {
      await flushTimersAndPromises();

      expect(mockMonitorService.startMonitoring).toHaveBeenCalled();
      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should not start monitoring when disabled', async () => {
      const disabledConfig = createTestConfig({ enabled: false });
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CdVisualizerService,
          { provide: ChangeDetectionMonitorService, useValue: mockMonitorService },
          { provide: ComponentTreeService, useValue: mockComponentTreeService },
          { provide: NGX_CD_VISUALIZER_CONFIG, useValue: disabledConfig }
        ]
      });
      
      const disabledService = TestBed.inject(CdVisualizerService);
      await flushTimersAndPromises();

      expect(mockMonitorService.startMonitoring).not.toHaveBeenCalled();
    });

    it('should have readonly signals', () => {
      expect(() => (service.config as any).set({})).toThrow();
      expect(() => (service.isVisible as any).set(true)).toThrow();
      expect(() => (service.isMinimized as any).set(true)).toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = { theme: 'dark' as const, showOnlyChanges: true };

      service.updateConfig(newConfig);

      const config = service.config();
      expect(config.theme).toBe('dark');
      expect(config.showOnlyChanges).toBe(true);
      expect(config.enabled).toBe(true); // Should preserve other values
    });

    it('should react to configuration changes', async () => {
      service.updateConfig({ enabled: false });
      await flushTimersAndPromises();

      expect(mockMonitorService.stopMonitoring).toHaveBeenCalled();

      service.updateConfig({ enabled: true });
      await flushTimersAndPromises();

      expect(mockMonitorService.startMonitoring).toHaveBeenCalledTimes(2);
    });
  });

  describe('Visibility Control', () => {
    it('should toggle visibility', () => {
      expect(service.isVisible()).toBe(true);

      service.toggle();
      expect(service.isVisible()).toBe(false);

      service.toggle();
      expect(service.isVisible()).toBe(true);
    });

    it('should show and hide', () => {
      service.hide();
      expect(service.isVisible()).toBe(false);

      service.show();
      expect(service.isVisible()).toBe(true);
    });

    it('should minimize and maximize', () => {
      expect(service.isMinimized()).toBe(false);

      service.minimize();
      expect(service.isMinimized()).toBe(true);

      service.maximize();
      expect(service.isMinimized()).toBe(false);
    });

    it('should toggle minimize state', () => {
      service.toggleMinimize();
      expect(service.isMinimized()).toBe(true);

      service.toggleMinimize();
      expect(service.isMinimized()).toBe(false);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      service.startMonitoring();

      expect(mockMonitorService.startMonitoring).toHaveBeenCalled();
      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should stop monitoring', () => {
      service.stopMonitoring();

      expect(mockMonitorService.stopMonitoring).toHaveBeenCalled();
    });

    it('should refresh component tree', () => {
      service.refreshComponentTree();

      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should clear history', () => {
      service.clearHistory();

      expect(mockMonitorService.clearHistory).toHaveBeenCalled();
      expect(mockComponentTreeService.resetActivityStates).toHaveBeenCalled();
    });
  });

  describe('Component Tree Filtering', () => {
    beforeEach(() => {
      const mockTree = createMockComponentTree();
      mockComponentTreeService.componentTree.mockReturnValue(mockTree);
    });

    it('should return unfiltered tree by default', () => {
      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(3);
    });

    it('should exclude specified components', () => {
      service.updateConfig({ excludeComponents: ['app-child1'] });

      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.selector !== 'app-child1')).toBe(true);
    });

    it('should exclude components by name', () => {
      service.updateConfig({ excludeComponents: ['ChildComponent1'] });

      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.name !== 'ChildComponent1')).toBe(true);
    });

    it('should show only active components when configured', () => {
      const mockTree = createMockComponentTree();
      mockTree[1].isActive = true; // Make child1 active
      mockComponentTreeService.componentTree.mockReturnValue(mockTree);

      service.updateConfig({ showOnlyChanges: true });

      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('ChildComponent1');
    });

    it('should show components with change detection count when showOnlyChanges is true', () => {
      const mockTree = createMockComponentTree();
      mockTree[2].changeDetectionCount = 5; // Give child2 some changes
      mockComponentTreeService.componentTree.mockReturnValue(mockTree);

      service.updateConfig({ showOnlyChanges: true });

      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('ChildComponent2');
    });

    it('should combine filters correctly', () => {
      const mockTree = createMockComponentTree();
      mockTree[1].isActive = true;
      mockTree[2].changeDetectionCount = 5;
      mockComponentTreeService.componentTree.mockReturnValue(mockTree);

      service.updateConfig({
        showOnlyChanges: true,
        excludeComponents: ['ChildComponent1']
      });

      const filtered = service.filteredComponentTree();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('ChildComponent2');
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      const mockTree = createMockComponentTree();
      const mockEvents = [createMockChangeDetectionEvent()];

      mockComponentTreeService.componentTree.mockReturnValue(mockTree);
      mockComponentTreeService.componentCount.mockReturnValue(3);
      mockComponentTreeService.onPushComponentCount.mockReturnValue(1);
      mockMonitorService.recentEvents.mockReturnValue(mockEvents);
      mockMonitorService.events.mockReturnValue(mockEvents);
    });

    it('should export complete data', () => {
      const exportedData = service.exportData();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.timestamp).toBeTruthy();
      expect(parsedData.config).toEqual(service.config());
      expect(parsedData.componentTree).toHaveLength(3);
      expect(parsedData.events).toHaveLength(1);
      expect(parsedData.statistics.totalComponents).toBe(3);
      expect(parsedData.statistics.onPushComponents).toBe(1);
      expect(parsedData.statistics.totalEvents).toBe(1);
    });

    it('should export valid JSON', () => {
      const exportedData = service.exportData();

      expect(() => JSON.parse(exportedData)).not.toThrow();
    });
  });

  describe('Component Focus', () => {
    beforeEach(() => {
      const mockComponent = createMockComponentTree()[0];
      mockComponentTreeService.findComponentById.mockReturnValue(mockComponent);
      mockComponentTreeService.getComponentPath.mockReturnValue([mockComponent]);
    });

    it('should focus component in debug mode', () => {
      service.updateConfig({ debugMode: true });

      service.focusComponent('test-id');

      expect(mockComponentTreeService.findComponentById).toHaveBeenCalledWith('test-id');
      expect(mockComponentTreeService.getComponentPath).toHaveBeenCalledWith('test-id');
    });

    it('should not process focus when debug mode is disabled', () => {
      service.updateConfig({ debugMode: false });

      service.focusComponent('test-id');

      expect(mockComponentTreeService.findComponentById).toHaveBeenCalledWith('test-id');
      expect(mockComponentTreeService.getComponentPath).not.toHaveBeenCalled();
    });

    it('should handle non-existent component gracefully', () => {
      mockComponentTreeService.findComponentById.mockReturnValue(null);

      expect(() => service.focusComponent('non-existent')).not.toThrow();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      const mockTree = createMockComponentTree();
      const mockEvents = [createMockChangeDetectionEvent()];

      mockComponentTreeService.componentTree.mockReturnValue(mockTree);
      mockMonitorService.recentEvents.mockReturnValue(mockEvents);
      mockMonitorService.isMonitoring.mockReturnValue(true);
    });

    it('should expose component tree from service', () => {
      const tree = service.componentTree();

      expect(tree).toHaveLength(3);
      expect(tree[0].name).toBe('ParentComponent');
    });

    it('should expose active changes from monitor service', () => {
      const changes = service.activeChanges();

      expect(changes).toHaveLength(1);
    });

    it('should expose monitoring status', () => {
      expect(service.isMonitoring()).toBe(true);
    });
  });

  describe('Periodic Scanning', () => {
    it('should set up periodic component tree scanning', async () => {
      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);
      await flushTimersAndPromises();

      // Should have called scanComponentTree during periodic scanning
      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should only scan when monitoring is active and enabled', async () => {
      mockMonitorService.isMonitoring.mockReturnValue(false);

      jest.advanceTimersByTime(5000);
      await flushTimersAndPromises();

      // Reset call count and test
      mockComponentTreeService.scanComponentTree.mockClear();

      jest.advanceTimersByTime(5000);
      await flushTimersAndPromises();

      // Should not scan when monitoring is inactive
      expect(mockComponentTreeService.scanComponentTree).not.toHaveBeenCalled();
    });

    it('should respect disabled state for periodic scanning', async () => {
      service.updateConfig({ enabled: false });
      mockComponentTreeService.scanComponentTree.mockClear();

      jest.advanceTimersByTime(5000);
      await flushTimersAndPromises();

      expect(mockComponentTreeService.scanComponentTree).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle monitor service errors gracefully', () => {
      mockMonitorService.startMonitoring.mockImplementation(() => {
        throw new Error('Monitor error');
      });

      expect(() => service.startMonitoring()).not.toThrow();
    });

    it('should handle component tree service errors gracefully', () => {
      mockComponentTreeService.scanComponentTree.mockImplementation(() => {
        throw new Error('Tree service error');
      });

      expect(() => service.refreshComponentTree()).not.toThrow();
    });

    it('should handle export errors gracefully', () => {
      mockComponentTreeService.componentTree.mockImplementation(() => {
        throw new Error('Export error');
      });

      const exportedData = service.exportData();

      // Should still return valid JSON even with errors
      expect(() => JSON.parse(exportedData)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should coordinate between monitor and tree services', () => {
      service.startMonitoring();

      expect(mockMonitorService.startMonitoring).toHaveBeenCalled();
      expect(mockComponentTreeService.scanComponentTree).toHaveBeenCalled();
    });

    it('should clear both services when clearing history', () => {
      service.clearHistory();

      expect(mockMonitorService.clearHistory).toHaveBeenCalled();
      expect(mockComponentTreeService.resetActivityStates).toHaveBeenCalled();
    });

    it('should coordinate configuration updates with effect system', async () => {
      service.updateConfig({ enabled: false });
      await flushTimersAndPromises();

      expect(mockMonitorService.stopMonitoring).toHaveBeenCalled();

      service.updateConfig({ enabled: true });
      await flushTimersAndPromises();

      expect(mockMonitorService.startMonitoring).toHaveBeenCalledTimes(2);
    });
  });
});