import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ChangeDetectionMonitorService } from './change-detection-monitor.service';
import { ComponentTreeService } from './component-tree.service';
import { CdVisualizerConfig } from '../models';
import { NGX_CD_VISUALIZER_CONFIG, DEFAULT_CD_VISUALIZER_CONFIG } from '../tokens';

@Injectable({
  providedIn: 'root'
})
export class CdVisualizerService {
  private readonly _injectedConfig = inject(NGX_CD_VISUALIZER_CONFIG, { optional: true });
  private readonly _config = signal<CdVisualizerConfig>(
    this._injectedConfig || DEFAULT_CD_VISUALIZER_CONFIG
  );

  private readonly _isVisible = signal(true);
  private readonly _isMinimized = signal(false);

  readonly config = this._config.asReadonly();
  readonly isVisible = this._isVisible.asReadonly();
  readonly isMinimized = this._isMinimized.asReadonly();
  readonly componentTree = computed(() => this.componentTreeService.componentTree());
  readonly activeChanges = computed(() => this.monitorService.recentEvents());
  readonly isMonitoring = computed(() => this.monitorService.isMonitoring());

  readonly filteredComponentTree = computed(() => {
    const tree = this.componentTree();
    const config = this._config();
    
    if (!config.showOnlyChanges && (!config.excludeComponents || config.excludeComponents.length === 0)) {
      return tree;
    }

    return tree.filter(node => {
      // Filter out excluded components
      if (config.excludeComponents?.includes(node.selector) || 
          config.excludeComponents?.includes(node.name)) {
        return false;
      }

      // Show only components with recent changes if enabled
      if (config.showOnlyChanges) {
        return node.isActive || node.changeDetectionCount > 0;
      }

      return true;
    });
  });

  private monitorService = inject(ChangeDetectionMonitorService);
  private componentTreeService = inject(ComponentTreeService);

  constructor() {
    // Auto-start monitoring when service is created
    effect(() => {
      if (this._config().enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    });

    // Periodic tree scanning
    this.setupPeriodicScanning();
  }

  updateConfig(config: Partial<CdVisualizerConfig>): void {
    this._config.update(current => ({ ...current, ...config }));
  }

  toggle(): void {
    this._isVisible.update(visible => !visible);
  }

  show(): void {
    this._isVisible.set(true);
  }

  hide(): void {
    this._isVisible.set(false);
  }

  minimize(): void {
    this._isMinimized.set(true);
  }

  maximize(): void {
    this._isMinimized.set(false);
  }

  toggleMinimize(): void {
    this._isMinimized.update(minimized => !minimized);
  }

  startMonitoring(): void {
    this.monitorService.startMonitoring();
    this.componentTreeService.scanComponentTree();
  }

  stopMonitoring(): void {
    this.monitorService.stopMonitoring();
  }

  refreshComponentTree(): void {
    this.componentTreeService.scanComponentTree();
  }

  clearHistory(): void {
    this.monitorService.clearHistory();
    this.componentTreeService.resetActivityStates();
  }

  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      config: this._config(),
      componentTree: this.componentTree(),
      events: this.activeChanges(),
      statistics: {
        totalComponents: this.componentTreeService.componentCount(),
        onPushComponents: this.componentTreeService.onPushComponentCount(),
        totalEvents: this.monitorService.events().length
      }
    };

    return JSON.stringify(data, null, 2);
  }

  focusComponent(componentId: string): void {
    const component = this.componentTreeService.findComponentById(componentId);
    if (component && this._config().debugMode) {
      console.log('Focused component:', component);
      console.log('Component path:', this.componentTreeService.getComponentPath(componentId));
    }
  }

  private setupPeriodicScanning(): void {
    // Scan component tree every 5 seconds when monitoring is active
    setInterval(() => {
      if (this._config().enabled && this.monitorService.isMonitoring()) {
        this.componentTreeService.scanComponentTree();
      }
    }, 5000);
  }
}