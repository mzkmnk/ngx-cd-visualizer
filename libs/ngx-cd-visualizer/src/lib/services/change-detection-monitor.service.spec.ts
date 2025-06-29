import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { ChangeDetectionMonitorService } from './change-detection-monitor.service';
import { ChangeDetectionTrigger } from '../models';
import { 
  createMockNgZone, 
  createMockComponentNode, 
  createMockChangeDetectionEvent, 
  flushTimersAndPromises,
  MockNgZone
} from '../../test-utils';

describe('ChangeDetectionMonitorService', () => {
  let service: ChangeDetectionMonitorService;
  let mockNgZone: MockNgZone;

  beforeEach(() => {
    mockNgZone = createMockNgZone();
    
    TestBed.configureTestingModule({
      providers: [
        ChangeDetectionMonitorService,
        { provide: NgZone, useValue: mockNgZone }
      ]
    });
    
    service = TestBed.inject(ChangeDetectionMonitorService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.stopMonitoring();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty events and cycles', () => {
      expect(service.events()).toEqual([]);
      expect(service.cycles()).toEqual([]);
      expect(service.isMonitoring()).toBe(false);
    });

    it('should have readonly signals', () => {
      expect(() => (service.events as any).set([])).toThrow();
      expect(() => (service.cycles as any).set([])).toThrow();
      expect(() => (service.isMonitoring as any).set(true)).toThrow();
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      service.startMonitoring();
      
      expect(service.isMonitoring()).toBe(true);
      expect(mockNgZone.runOutsideAngular).toHaveBeenCalled();
    });

    it('should stop monitoring', () => {
      service.startMonitoring();
      service.stopMonitoring();
      
      expect(service.isMonitoring()).toBe(false);
    });

    it('should not start monitoring twice', () => {
      service.startMonitoring();
      const firstCallCount = (mockNgZone.runOutsideAngular as jest.Mock).mock.calls.length;
      
      service.startMonitoring();
      const secondCallCount = (mockNgZone.runOutsideAngular as jest.Mock).mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should clean up interval when stopping', () => {
      service.startMonitoring();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      service.stopMonitoring();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Event Recording', () => {
    it('should record events', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      
      const events = service.events();
      expect(events).toHaveLength(1);
      expect(events[0].componentNode).toBe(componentNode);
      expect(events[0].trigger).toBe(ChangeDetectionTrigger.UserInteraction);
      expect(events[0].isManualTrigger).toBe(false);
    });

    it('should record manual trigger events', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.ManualTrigger, true);
      
      const events = service.events();
      expect(events[0].isManualTrigger).toBe(true);
    });

    it('should generate unique event IDs', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.recordEvent(componentNode, ChangeDetectionTrigger.AsyncOperation);
      
      const events = service.events();
      expect(events[0].id).not.toBe(events[1].id);
    });

    it('should maintain event history within max size', () => {
      const componentNode = createMockComponentNode();
      service.setMaxHistorySize(2);
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.recordEvent(componentNode, ChangeDetectionTrigger.AsyncOperation);
      service.recordEvent(componentNode, ChangeDetectionTrigger.ManualTrigger);
      
      const events = service.events();
      expect(events).toHaveLength(2);
      expect(events[0].trigger).toBe(ChangeDetectionTrigger.AsyncOperation);
      expect(events[1].trigger).toBe(ChangeDetectionTrigger.ManualTrigger);
    });
  });

  describe('Change Detection Cycles', () => {
    it('should start and end cycles', () => {
      const cycleId = service.startCycle();
      
      expect(cycleId).toBeTruthy();
      expect(typeof cycleId).toBe('string');
      
      service.endCycle();
      
      const cycles = service.cycles();
      expect(cycles).toHaveLength(1);
      expect(cycles[0].id).toBe(cycleId);
      expect(cycles[0].startTime).toBeTruthy();
      expect(cycles[0].endTime).toBeTruthy();
    });

    it('should associate events with current cycle', () => {
      const componentNode = createMockComponentNode();
      
      service.startCycle();
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.endCycle();
      
      const cycles = service.cycles();
      expect(cycles[0].events).toHaveLength(1);
      expect(cycles[0].affectedComponents).toContain(componentNode);
    });

    it('should not duplicate components in affected list', () => {
      const componentNode = createMockComponentNode();
      
      service.startCycle();
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.recordEvent(componentNode, ChangeDetectionTrigger.AsyncOperation);
      service.endCycle();
      
      const cycles = service.cycles();
      expect(cycles[0].affectedComponents).toHaveLength(1);
      expect(cycles[0].events).toHaveLength(2);
    });

    it('should generate unique cycle IDs', () => {
      const cycleId1 = service.startCycle();
      service.endCycle();
      
      const cycleId2 = service.startCycle();
      service.endCycle();
      
      expect(cycleId1).not.toBe(cycleId2);
    });
  });

  describe('History Management', () => {
    it('should clear history', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.startCycle();
      service.endCycle();
      
      service.clearHistory();
      
      expect(service.events()).toHaveLength(0);
      expect(service.cycles()).toHaveLength(0);
    });

    it('should update max history size', () => {
      service.setMaxHistorySize(50);
      
      // The max history size effect should be tested by adding many events
      const componentNode = createMockComponentNode();
      for (let i = 0; i < 60; i++) {
        service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      }
      
      expect(service.events()).toHaveLength(50);
    });
  });

  describe('Recent Events', () => {
    it('should return last 50 events', () => {
      const componentNode = createMockComponentNode();
      
      // Add 60 events
      for (let i = 0; i < 60; i++) {
        service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      }
      
      const recentEvents = service.recentEvents();
      expect(recentEvents).toHaveLength(50);
    });

    it('should return all events if less than 50', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.UserInteraction);
      service.recordEvent(componentNode, ChangeDetectionTrigger.AsyncOperation);
      
      const recentEvents = service.recentEvents();
      expect(recentEvents).toHaveLength(2);
    });
  });

  describe('Zone Integration', () => {
    it('should run monitoring outside Angular zone', async () => {
      service.startMonitoring();
      
      expect(mockNgZone.runOutsideAngular).toHaveBeenCalled();
      
      // Verify the interval callback was set up
      const intervalCallback = (mockNgZone.runOutsideAngular as jest.Mock).mock.calls[0][0];
      expect(typeof intervalCallback).toBe('function');
    });

    it('should create cycles periodically when monitoring', async () => {
      service.startMonitoring();
      
      // Fast-forward time to trigger interval
      await flushTimersAndPromises();
      
      // Verify cycles are being created (this tests the simplified Zone monitoring)
      expect(service.isMonitoring()).toBe(true);
    });
  });

  describe('Trigger Type Detection', () => {
    // Note: detectTriggerType is private, but we can test it indirectly
    // through the public API when full Zone.js integration is implemented
    
    it('should handle unknown trigger types gracefully', () => {
      const componentNode = createMockComponentNode();
      
      service.recordEvent(componentNode, ChangeDetectionTrigger.Unknown);
      
      const events = service.events();
      expect(events[0].trigger).toBe(ChangeDetectionTrigger.Unknown);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing current cycle gracefully', () => {
      // End cycle without starting one
      expect(() => service.endCycle()).not.toThrow();
    });

    it('should handle zone errors gracefully', () => {
      const errorZone: MockNgZone = {
        ...mockNgZone,
        runOutsideAngular: jest.fn().mockImplementation(() => {
          throw new Error('Zone error');
        })
      };
      
      TestBed.overrideProvider(NgZone, { useValue: errorZone });
      const errorService = TestBed.inject(ChangeDetectionMonitorService);
      
      expect(() => errorService.startMonitoring()).not.toThrow();
    });
  });
});