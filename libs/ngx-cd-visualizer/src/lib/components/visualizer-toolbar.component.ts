import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  tablerRefresh, 
  tablerRefreshOff, 
  tablerClock, 
  tablerClockOff,
  tablerHash,
  tablerMaximize,
  tablerMinimize,
  tablerSun,
  tablerMoon,
  tablerDevices,
  tablerComponents
} from '@ng-icons/tabler-icons';
import { FilterMode, VisualizerThemeType } from '../models';

/**
 * Toolbar component for the visualizer with filtering and configuration options
 */
@Component({
  selector: 'lib-visualizer-toolbar',
  template: `
    <div class="visualizer-toolbar">
      <!-- Filter section -->
      <div class="toolbar-section filter-section">
        <span class="section-label">Filter:</span>
        <div class="filter-buttons">
          <button 
            class="filter-btn"
            [class.active]="filterMode() === 'all'"
            (click)="setFilter('all')"
            title="Show all components">
            All
          </button>
          <button 
            class="filter-btn"
            [class.active]="filterMode() === 'active-only'"
            (click)="setFilter('active-only')"
            title="Show only active components">
            Active
          </button>
          <button 
            class="filter-btn"
            [class.active]="filterMode() === 'onpush-only'"
            (click)="setFilter('onpush-only')"
            title="Show only OnPush components">
            OnPush
          </button>
          <button 
            class="filter-btn"
            [class.active]="filterMode() === 'modified-only'"
            (click)="setFilter('modified-only')"
            title="Show only modified components">
            Modified
          </button>
        </div>
      </div>

      <!-- Actions section -->
      <div class="toolbar-section actions-section">
        <button 
          class="action-btn scan-btn"
          [disabled]="isScanning()"
          (click)="scanComponents.emit()"
          title="Rescan component tree">
          <ng-icon name="tablerRefresh" size="14"></ng-icon>
          {{ isScanning() ? 'Scanning...' : 'Scan' }}
        </button>
        
        <button 
          class="action-btn reset-btn"
          (click)="resetActivity.emit()"
          title="Reset all activity states">
          <ng-icon name="tablerRefreshOff" size="14"></ng-icon>
          Reset
        </button>
        
        <!-- Demo trigger buttons -->
        <button 
          class="action-btn demo-btn user-trigger"
          (click)="simulateUserTrigger.emit()"
          title="Simulate user interaction trigger">
          👆 User
        </button>
        
        <button 
          class="action-btn demo-btn signal-trigger"
          (click)="simulateSignalTrigger.emit()"
          title="Simulate signal update trigger">
          ⚡ Signal
        </button>
        
        <button 
          class="action-btn demo-btn async-trigger"
          (click)="simulateAsyncTrigger.emit()"
          title="Simulate async operation trigger">
          ⏳ Async
        </button>
      </div>

      <!-- View options section -->
      <div class="toolbar-section view-section">
        <div class="view-controls">
          <button 
            class="view-toggle"
            [class.active]="showTimestamps()"
            (click)="toggleTimestamps()"
            title="Toggle timestamps">
            <ng-icon name="tablerClock" size="12"></ng-icon>
          </button>
          
          <button 
            class="view-toggle"
            [class.active]="showCounts()"
            (click)="toggleCounts()"
            title="Toggle change detection counts">
            <ng-icon name="tablerHash" size="12"></ng-icon>
          </button>

          <button 
            class="view-toggle"
            [class.active]="compact()"
            (click)="toggleCompact()"
            title="Toggle compact view">
            <ng-icon 
              [name]="compact() ? 'tablerMinimize' : 'tablerMaximize'" 
              size="12">
            </ng-icon>
          </button>
        </div>
      </div>

      <!-- Theme toggle -->
      <div class="toolbar-section theme-section">
        <button 
          class="theme-toggle"
          (click)="cycleTheme()"
          [title]="'Current theme: ' + theme()">
          @switch (theme()) {
            @case ('light') {
              <ng-icon name="tablerSun" size="14"></ng-icon>
            }
            @case ('dark') {
              <ng-icon name="tablerMoon" size="14"></ng-icon>
            }
            @default {
              <ng-icon name="tablerDevices" size="14"></ng-icon>
            }
          }
        </button>
      </div>

      <!-- Statistics -->
      <div class="toolbar-section stats-section">
        <div class="stats">
          <span class="stat-item" title="Total components">
            <ng-icon name="tablerComponents" size="12"></ng-icon>
            {{ componentCount() }}
          </span>
          <span class="stat-item onpush" title="OnPush components">
            <ng-icon name="tablerComponents" size="12"></ng-icon>
            {{ onPushCount() }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visualizer-toolbar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: var(--cd-toolbar-bg, #f8fafc);
      border-bottom: 1px solid var(--cd-border, #e2e8f0);
      gap: 12px;
      font-size: 12px;
      overflow-x: auto;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .section-label {
      font-weight: 500;
      color: var(--cd-text-muted, #64748b);
      margin-right: 4px;
    }

    .filter-buttons {
      display: flex;
      gap: 2px;
      border: 1px solid var(--cd-border, #e2e8f0);
      border-radius: 6px;
      overflow: hidden;
      background: var(--cd-surface, #ffffff);
    }

    .filter-btn {
      padding: 4px 8px;
      border: none;
      background: transparent;
      color: var(--cd-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 11px;
      font-weight: 500;
    }

    .filter-btn:hover {
      background: var(--cd-hover, #f1f5f9);
      color: var(--cd-text, #334155);
    }

    .filter-btn.active {
      background: var(--cd-primary, #3b82f6);
      color: white;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: 1px solid var(--cd-border, #e2e8f0);
      border-radius: 4px;
      background: var(--cd-surface, #ffffff);
      color: var(--cd-text, #334155);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 11px;
      font-weight: 500;
    }

    .action-btn:hover:not(:disabled) {
      background: var(--cd-hover, #f1f5f9);
      border-color: var(--cd-primary, #3b82f6);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .demo-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      font-weight: 600;
      font-size: 11px;
      padding: 6px 10px;
      min-width: 50px;
      
      &:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      &.user-trigger {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        &:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
      }
      
      &.signal-trigger {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        &:hover { background: linear-gradient(135deg, #047857 0%, #065f46 100%); }
      }
      
      &.async-trigger {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        &:hover { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); }
      }
    }

    .scan-btn svg {
      animation: none;
    }

    .action-btn:disabled .scan-btn svg {
      animation: spin 1s linear infinite;
    }

    .view-controls {
      display: flex;
      gap: 2px;
      border: 1px solid var(--cd-border, #e2e8f0);
      border-radius: 4px;
      overflow: hidden;
      background: var(--cd-surface, #ffffff);
    }

    .view-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--cd-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .view-toggle:hover {
      background: var(--cd-hover, #f1f5f9);
      color: var(--cd-text, #334155);
    }

    .view-toggle.active {
      background: var(--cd-primary, #3b82f6);
      color: white;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--cd-border, #e2e8f0);
      border-radius: 4px;
      background: var(--cd-surface, #ffffff);
      color: var(--cd-text, #334155);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .theme-toggle:hover {
      background: var(--cd-hover, #f1f5f9);
      border-color: var(--cd-primary, #3b82f6);
    }

    .stats {
      display: flex;
      gap: 8px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 10px;
      background: var(--cd-stat-bg, #f1f5f9);
      color: var(--cd-text, #334155);
      font-weight: 600;
      font-size: 10px;
    }

    .stat-item.onpush {
      background: var(--cd-onpush-bg, #f3e8ff);
      color: var(--cd-onpush-text, #7c3aed);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .visualizer-toolbar {
        --cd-toolbar-bg: #1e293b;
        --cd-border: #374151;
        --cd-surface: #374151;
        --cd-text: #e2e8f0;
        --cd-text-muted: #94a3b8;
        --cd-hover: #475569;
        --cd-stat-bg: #475569;
        --cd-onpush-bg: #2e1065;
        --cd-onpush-text: #c4b5fd;
      }
    }
  `],
  imports: [CommonModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ 
      tablerRefresh, 
      tablerRefreshOff, 
      tablerClock, 
      tablerClockOff,
      tablerHash,
      tablerMaximize,
      tablerMinimize,
      tablerSun,
      tablerMoon,
      tablerDevices,
      tablerComponents
    })
  ]
})
export class VisualizerToolbarComponent {
  // Inputs
  readonly filterMode = input<FilterMode>('all');
  readonly isScanning = input<boolean>(false);
  readonly componentCount = input<number>(0);
  readonly onPushCount = input<number>(0);
  readonly showTimestamps = input<boolean>(true);
  readonly showCounts = input<boolean>(true);
  readonly compact = input<boolean>(false);
  readonly theme = input<VisualizerThemeType>('auto');

  // Outputs
  readonly filterChange = output<FilterMode>();
  readonly scanComponents = output<void>();
  readonly resetActivity = output<void>();
  readonly timestampsToggle = output<boolean>();
  readonly countsToggle = output<boolean>();
  readonly compactToggle = output<boolean>();
  readonly themeChange = output<VisualizerThemeType>();
  readonly simulateUserTrigger = output<void>();
  readonly simulateSignalTrigger = output<void>();
  readonly simulateAsyncTrigger = output<void>();

  setFilter(mode: FilterMode): void {
    this.filterChange.emit(mode);
  }

  toggleTimestamps(): void {
    this.timestampsToggle.emit(!this.showTimestamps());
  }

  toggleCounts(): void {
    this.countsToggle.emit(!this.showCounts());
  }

  toggleCompact(): void {
    this.compactToggle.emit(!this.compact());
  }

  cycleTheme(): void {
    const current = this.theme();
    const themes: VisualizerThemeType[] = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.themeChange.emit(themes[nextIndex]);
  }
}