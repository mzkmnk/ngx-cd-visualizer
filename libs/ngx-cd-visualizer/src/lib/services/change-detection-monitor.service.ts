import { Injectable, NgZone, signal, computed, inject } from '@angular/core';

declare interface Task {
  type: string;
  source: string;
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

  readonly events = this._events.asReadonly();
  readonly cycles = this._cycles.asReadonly();
  readonly isMonitoring = this._isMonitoring.asReadonly();
  readonly recentEvents = computed(() => 
    this._events().slice(-50)
  );

  private ngZone = inject(NgZone);

  startMonitoring(): void {
    if (this._isMonitoring()) return;

    this._isMonitoring.set(true);
    this.setupZoneHooks();
  }

  stopMonitoring(): void {
    this._isMonitoring.set(false);
    this.cleanupZoneHooks();
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
    // Simplified Zone monitoring for Phase 1
    // Full Zone.js hooks implementation planned for Phase 2
    console.log('ChangeDetectionMonitorService: Monitoring started');
    
    this.ngZone.runOutsideAngular(() => {
      setInterval(() => {
        if (this._isMonitoring()) {
          this.startCycle();
          setTimeout(() => this.endCycle(), 100);
        }
      }, 1000);
    });
  }

  private cleanupZoneHooks(): void {
    // Zone hooks cleanup implementation planned for Phase 2
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
}