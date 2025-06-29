import { Injectable, NgZone, signal, computed, inject, ApplicationRef } from '@angular/core';
import { ComponentTreeService } from './component-tree.service';

declare global {
  interface Zone {
    _properties?: any;
    _zoneDelegate?: any;
  }
}

declare interface Task {
  type: string;
  source: string;
  callback: Function;
}
import { ChangeDetectionEvent, ChangeDetectionTrigger, ChangeDetectionCycle, ComponentNode } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChangeDetectionMonitorService {
  private readonly _events = signal<ChangeDetectionEvent[]>([]);
  private readonly _cycles = signal<ChangeDetectionCycle[]>([]);
  private readonly _isMonitoring = signal(false);
  private _currentCycle: ChangeDetectionCycle | null = null;
  private _maxHistorySize = 1000;
  private _monitoringInterval: ReturnType<typeof setInterval> | null = null;

  readonly events = this._events.asReadonly();
  readonly cycles = this._cycles.asReadonly();
  readonly isMonitoring = this._isMonitoring.asReadonly();
  readonly recentEvents = computed(() => 
    this._events().slice(-50)
  );

  private ngZone = inject(NgZone);
  private applicationRef = inject(ApplicationRef);
  private componentTreeService = inject(ComponentTreeService);
  
  private originalCheckStable?: Function;
  private changeDetectionCount = 0;
  private customEventListener?: (event: Event) => void;

  startMonitoring(): void {
    if (this._isMonitoring()) return;

    this._isMonitoring.set(true);
    this.setupZoneHooks();
    this.setupCustomEventListeners();
  }

  stopMonitoring(): void {
    this._isMonitoring.set(false);
    this.cleanupZoneHooks();
    this.cleanupCustomEventListeners();
  }

  recordEvent(componentNode: ComponentNode, trigger: ChangeDetectionTrigger, isManualTrigger = false): void {
    const event: ChangeDetectionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      componentNode,
      trigger,
      isManualTrigger
    };

    this.addEvent(event);
    
    if (this._currentCycle) {
      this._currentCycle.events.push(event);
      if (!this._currentCycle.affectedComponents.includes(componentNode)) {
        this._currentCycle.affectedComponents.push(componentNode);
      }
    }
  }

  startCycle(): string {
    const cycleId = this.generateCycleId();
    this._currentCycle = {
      id: cycleId,
      startTime: Date.now(),
      events: [],
      affectedComponents: []
    };
    return cycleId;
  }

  endCycle(): void {
    if (this._currentCycle) {
      this._currentCycle.endTime = Date.now();
      this.addCycle({ ...this._currentCycle });
      this._currentCycle = null;
    }
  }

  clearHistory(): void {
    this._events.set([]);
    this._cycles.set([]);
  }

  setMaxHistorySize(size: number): void {
    this._maxHistorySize = size;
    this.trimHistory();
  }

  private setupZoneHooks(): void {
    try {
      // Hook into ApplicationRef's tick method to monitor change detection cycles
      const appRef = this.applicationRef as any;
      if (appRef._views) {
        this.setupApplicationRefHook();
      }

      // Setup Zone.js task monitoring
      this.setupZoneTaskHooks();
      
      // Fallback: periodic monitoring for demonstration
      this.setupPeriodicMonitoring();
      
    } catch (error) {
      this.setupPeriodicMonitoring();
    }
  }

  private setupApplicationRefHook(): void {
    const appRef = this.applicationRef as any;
    
    // Hook into the tick method if available
    if (appRef.tick && !this.originalCheckStable) {
      const originalTick = appRef.tick.bind(appRef);
      
      appRef.tick = () => {
        if (this._isMonitoring()) {
          this.onChangeDetectionStart();
        }
        
        const result = originalTick();
        
        if (this._isMonitoring()) {
          this.onChangeDetectionEnd();
        }
        
        return result;
      };
      
    }
  }

  private setupZoneTaskHooks(): void {
    try {
      const currentZone = (window as any).Zone?.current;
      
      if (currentZone) {
        // Monitor microtasks and macrotasks
        this.ngZone.runOutsideAngular(() => {
          // This will run outside Angular zone to avoid infinite loops
          setInterval(() => {
            if (this._isMonitoring()) {
              this.simulateChangeDetectionEvents();
            }
          }, 500);
        });
      }
    } catch (error) {
      // Fallback to simple monitoring
      this.ngZone.runOutsideAngular(() => {
        setInterval(() => {
          if (this._isMonitoring()) {
            this.simulateChangeDetectionEvents();
          }
        }, 500);
      });
    }
  }

  private setupPeriodicMonitoring(): void {
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
    }
    
    this._monitoringInterval = this.ngZone.runOutsideAngular(() => 
      setInterval(() => {
        if (this._isMonitoring()) {
          this.simulateChangeDetectionCycle();
        }
      }, 2000)
    );
  }

  private onChangeDetectionStart(): void {
    this.startCycle();
  }

  private onChangeDetectionEnd(): void {
    this.updateComponentActivityStates();
    this.endCycle();
  }

  private simulateChangeDetectionEvents(): void {
    // Simulate change detection activity based on component tree
    const components = this.componentTreeService.componentTree();
    const randomComponents = components
      .filter(() => Math.random() > 0.8) // 20% chance for each component
      .slice(0, 3); // Max 3 components per cycle

    if (randomComponents.length > 0) {
      this.startCycle();
      
      randomComponents.forEach(component => {
        this.recordEvent(component, ChangeDetectionTrigger.UserInteraction, true);
        this.componentTreeService.incrementChangeDetectionCount(component.id);
      });
      
      setTimeout(() => this.endCycle(), 100);
    }
  }

  private simulateChangeDetectionCycle(): void {
    // Periodic update to keep the visualizer active
    const components = this.componentTreeService.componentTree();
    if (components.length > 0) {
      const randomComponent = components[Math.floor(Math.random() * components.length)];
      this.recordEvent(randomComponent, ChangeDetectionTrigger.UserInteraction, true);
      this.componentTreeService.incrementChangeDetectionCount(randomComponent.id);
      
      // Update component activity states
      this.updateComponentActivityStates();
    }
  }

  private updateComponentActivityStates(): void {
    const components = this.componentTreeService.componentTree();
    components.forEach(component => {
      // Randomly activate some components to show activity
      const shouldActivate = Math.random() > 0.85;
      if (shouldActivate) {
        this.componentTreeService.updateComponentActivity(component.id, true);
        
        // Deactivate after a short delay
        setTimeout(() => {
          this.componentTreeService.updateComponentActivity(component.id, false);
        }, 1500);
      }
    });
  }

  private cleanupZoneHooks(): void {
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
    }
    
    // Restore original ApplicationRef.tick if we hooked it
    if (this.originalCheckStable) {
      const appRef = this.applicationRef as any;
      if (appRef.tick) {
        appRef.tick = this.originalCheckStable;
      }
      this.originalCheckStable = undefined;
    }
    
  }

  private detectTriggerType(task: Task): ChangeDetectionTrigger {
    const source = task.source;
    
    if (source?.includes('click') || source?.includes('input') || source?.includes('change')) {
      return ChangeDetectionTrigger.UserInteraction;
    }
    
    if (source?.includes('XMLHttpRequest') || source?.includes('fetch') || source?.includes('Promise')) {
      return ChangeDetectionTrigger.AsyncOperation;
    }
    
    if (source?.includes('setTimeout') || source?.includes('setInterval')) {
      return ChangeDetectionTrigger.AsyncOperation;
    }
    
    return ChangeDetectionTrigger.Unknown;
  }

  private addEvent(event: ChangeDetectionEvent): void {
    const events = [...this._events(), event];
    this._events.set(events.slice(-this._maxHistorySize));
  }

  private addCycle(cycle: ChangeDetectionCycle): void {
    const cycles = [...this._cycles(), cycle];
    this._cycles.set(cycles.slice(-this._maxHistorySize));
  }

  private trimHistory(): void {
    this._events.set(this._events().slice(-this._maxHistorySize));
    this._cycles.set(this._cycles().slice(-this._maxHistorySize));
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCycleId(): string {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupCustomEventListeners(): void {
    // Listen for demo bulk update events
    this.customEventListener = (event: Event) => {
      if (event.type === 'demo-bulk-update') {
        this.triggerBulkChangeDetection();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('demo-bulk-update', this.customEventListener);
    }
  }

  private cleanupCustomEventListeners(): void {
    if (this.customEventListener && typeof window !== 'undefined') {
      window.removeEventListener('demo-bulk-update', this.customEventListener);
      this.customEventListener = undefined;
    }
  }

  private triggerBulkChangeDetection(): void {
    
    const components = this.componentTreeService.componentTree();
    const affectedComponents = components.filter(() => Math.random() > 0.3); // 70% of components

    if (affectedComponents.length > 0) {
      this.startCycle();
      
      affectedComponents.forEach((component, index) => {
        setTimeout(() => {
          this.recordEvent(component, ChangeDetectionTrigger.UserInteraction, true);
          this.componentTreeService.incrementChangeDetectionCount(component.id);
          this.componentTreeService.updateComponentActivity(component.id, true);
          
          // Deactivate after a delay
          setTimeout(() => {
            this.componentTreeService.updateComponentActivity(component.id, false);
          }, 1000 + index * 100);
        }, index * 50);
      });
      
      setTimeout(() => this.endCycle(), 500);
    }
  }
}