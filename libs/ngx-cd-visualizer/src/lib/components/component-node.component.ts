import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentNode } from '../models';

/**
 * Component that displays a single component node in the tree
 */
@Component({
  selector: 'lib-component-node',
  template: `
    <div 
      class="component-node"
      [class.active]="node().isActive"
      [class.selected]="isSelected()"
      [class.onpush]="node().isOnPushStrategy"
      [style.padding-left.px]="indentWidth()"
      (click)="onSelect()"
      (keyup.enter)="onSelect()"
      (keyup.space)="onSelect()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'Component ' + node().name + (isSelected() ? ' (selected)' : '')">
      
      <!-- Expand/Collapse Toggle -->
      <button 
        class="toggle-btn"
        [class.expanded]="isExpanded()"
        [class.has-children]="hasChildren()"
        (click)="onToggle($event)"
        [disabled]="!hasChildren()">
        @if (hasChildren()) {
          {{ isExpanded() ? '▼' : '▶' }}
        } @else {
          <span class="no-children">•</span>
        }
      </button>

      <!-- Component Info -->
      <div class="node-content">
        <div class="node-main">
          <span class="component-name">{{ node().name }}</span>
          <span class="component-selector">{{ node().selector }}</span>
        </div>
        
        <div class="node-indicators">
          <!-- OnPush Strategy Indicator -->
          @if (node().isOnPushStrategy) {
            <span class="indicator onpush-indicator" title="OnPush Strategy">OP</span>
          }
          
          <!-- Activity Indicator -->
          @if (node().isActive) {
            <span class="indicator activity-indicator" title="Recently Active">●</span>
          }
          
          <!-- Change Detection Count -->
          @if (node().changeDetectionCount > 0) {
            <span class="indicator count-indicator" [title]="'Change detections: ' + node().changeDetectionCount">
              {{ formatCount(node().changeDetectionCount) }}
            </span>
          }
        </div>
      </div>

      <!-- Timing Info -->
      @if (node().lastChangeDetectionTime) {
        <div class="timing-info">
          {{ formatTime(node().lastChangeDetectionTime) }}
        </div>
      }
    </div>
  `,
  styles: [`
    .component-node {
      display: flex;
      align-items: center;
      min-height: 28px;
      padding: 2px 8px 2px 0;
      border-bottom: 1px solid var(--cd-node-border, transparent);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 11px;
    }

    .component-node:hover {
      background: var(--cd-node-hover, #f8f8f8);
    }

    .component-node.selected {
      background: var(--cd-node-selected, #e3f2fd);
      border-color: var(--cd-node-selected-border, #2196f3);
    }

    .component-node.active {
      background: var(--cd-node-active, #fff3e0);
      border-left: 3px solid var(--cd-active-color, #ff9800);
    }

    .component-node.active.selected {
      background: var(--cd-node-active-selected, #ffe0b2);
    }

    .component-node.onpush {
      border-left: 2px solid var(--cd-onpush-color, #4caf50);
    }

    .component-node.onpush.active {
      border-left: 3px solid var(--cd-active-color, #ff9800);
    }

    .toggle-btn {
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: var(--cd-toggle, #666);
      margin-right: 4px;
      flex-shrink: 0;
    }

    .toggle-btn:disabled {
      cursor: default;
      opacity: 0.4;
    }

    .toggle-btn.has-children:hover {
      background: var(--cd-toggle-hover, #e0e0e0);
      border-radius: 2px;
    }

    .no-children {
      opacity: 0.3;
      font-size: 6px;
    }

    .node-content {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 0; /* Allow text truncation */
    }

    .node-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .component-name {
      font-weight: 500;
      color: var(--cd-name, #333);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .component-selector {
      font-size: 10px;
      color: var(--cd-selector, #666);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }

    .node-indicators {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .indicator {
      font-size: 9px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 8px;
      line-height: 1.2;
    }

    .onpush-indicator {
      background: var(--cd-onpush-bg, #e8f5e8);
      color: var(--cd-onpush-text, #2e7d32);
    }

    .activity-indicator {
      background: var(--cd-activity-bg, #fff3e0);
      color: var(--cd-activity-text, #ef6c00);
      animation: pulse 1s infinite;
    }

    .count-indicator {
      background: var(--cd-count-bg, #e3f2fd);
      color: var(--cd-count-text, #1565c0);
      min-width: 16px;
      text-align: center;
    }

    .timing-info {
      font-size: 9px;
      color: var(--cd-timing, #999);
      margin-left: 8px;
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .component-node {
        --cd-node-hover: #404040;
        --cd-node-selected: #1e3a8a;
        --cd-node-selected-border: #3b82f6;
        --cd-node-active: #451a03;
        --cd-node-active-selected: #92400e;
        --cd-name: #ffffff;
        --cd-selector: #cccccc;
        --cd-toggle: #cccccc;
        --cd-toggle-hover: #505050;
        --cd-timing: #999999;
        --cd-onpush-bg: #1b5e20;
        --cd-onpush-text: #81c784;
        --cd-activity-bg: #e65100;
        --cd-activity-text: #ffcc02;
        --cd-count-bg: #0d47a1;
        --cd-count-text: #90caf9;
      }
    }
  `],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentNodeComponent {
  // Inputs
  readonly node = input.required<ComponentNode>();
  readonly level = input.required<number>();
  readonly isExpanded = input.required<boolean>();
  readonly hasChildren = input.required<boolean>();
  readonly isSelected = input<boolean>(false);

  // Outputs
  readonly nodeToggle = output<void>();
  readonly nodeSelect = output<void>();

  // Computed properties
  readonly indentWidth = computed(() => this.level() * 16 + 8);

  onToggle(event: MouseEvent): void {
    event.stopPropagation();
    this.nodeToggle.emit();
  }

  onSelect(): void {
    this.nodeSelect.emit();
  }

  formatCount(count: number): string {
    if (count > 999) return '999+';
    return count.toString();
  }

  formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 1000) return 'now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  }
}