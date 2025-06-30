import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 1L10 4M7 1L4 4M7 1V8M13 7C13 10.314 10.314 13 7 13S1 10.314 1 7" 
                  stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          {{ isScanning() ? 'Scanning...' : 'Scan' }}
        </button>
        
        <button 
          class="action-btn reset-btn"
          (click)="resetActivity.emit()"
          title="Reset all activity states">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M13 7C13 10.314 10.314 13 7 13S1 10.314 1 7S3.686 1 7 1C8.5 1 9.5 1.5 10.5 2.5" 
                  stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          Reset
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
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M6 3V6L8 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
          
          <button 
            class="view-toggle"
            [class.active]="showCounts()"
            (click)="toggleCounts()"
            title="Toggle change detection counts">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="4" width="10" height="1.5" fill="currentColor"/>
              <rect x="1" y="6.5" width="7" height="1.5" fill="currentColor"/>
              <rect x="1" y="9" width="4" height="1.5" fill="currentColor"/>
            </svg>
          </button>

          <button 
            class="view-toggle"
            [class.active]="compact()"
            (click)="toggleCompact()"
            title="Toggle compact view">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="2" width="10" height="1" fill="currentColor"/>
              <rect x="1" y="5" width="10" height="1" fill="currentColor"/>
              <rect x="1" y="8" width="10" height="1" fill="currentColor"/>
            </svg>
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
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M7 1V3M7 11V13M1 7H3M11 7H13M2.5 2.5L4 4M10 10L11.5 11.5M11.5 2.5L10 4M4 10L2.5 11.5" 
                      stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            }
            @case ('dark') {
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M7 1C7 1 10 3 10 7S7 13 7 13C10.314 13 13 10.314 13 7S10.314 1 7 1Z" 
                      stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            }
            @default {
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M7 1V7L13 7" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            }
          }
        </button>
      </div>

      <!-- Statistics -->
      <div class="toolbar-section stats-section">
        <div class="stats">
          <span class="stat-item" title="Total components">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            {{ componentCount() }}
          </span>
          <span class="stat-item onpush" title="OnPush components">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <circle cx="6" cy="6" r="2" fill="currentColor"/>
            </svg>
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
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
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