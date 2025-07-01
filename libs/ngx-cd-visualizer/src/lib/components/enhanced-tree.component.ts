import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentNode } from '../models';

export interface TreeNodeDisplay {
  node: ComponentNode;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isLastChild: boolean;
  parentPath: boolean[]; // Array indicating which levels have more siblings
}

/**
 * Enhanced tree component with improved visual hierarchy
 * Features folder-tree-like indentation with connecting lines
 */
@Component({
  selector: 'lib-enhanced-tree',
  template: `
    <div class="enhanced-tree" [class.compact]="compact()">
      @if (filteredNodes().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🌳</div>
          <div class="empty-message">
            @if (filterMode() === 'active-only') {
              No active components found
            } @else if (filterMode() === 'onpush-only') {
              No OnPush components found
            } @else {
              No components to display
            }
          </div>
        </div>
      } @else {
        @for (item of displayItems(); track item.node.id) {
          <div 
            class="tree-node"
            [class.selected]="selectedNode() === item.node.id"
            [class.active]="item.node.isActive"
            [class.onpush]="item.node.isOnPushStrategy"
            [class.modified]="item.node.changeDetectionCount > 0"
            [style.padding-left.px]="getIndentWidth(item)"
            (click)="selectNode(item.node.id)"
            (keydown.enter)="selectNode(item.node.id)"
            (keydown.space)="selectNode(item.node.id)"
            tabindex="0"
            role="button"
            [attr.aria-label]="'Select component ' + item.node.name">
            
            <!-- Connection lines -->
            <div class="tree-lines">
              @for (hasLine of item.parentPath; track $index) {
                <div 
                  class="tree-line vertical"
                  [class.active]="hasLine"
                  [style.left.px]="$index * 20 + 8">
                </div>
              }
              
              @if (item.level > 0) {
                <div 
                  class="tree-line horizontal"
                  [style.left.px]="(item.level - 1) * 20 + 8">
                </div>
                <div 
                  class="tree-line vertical-short"
                  [class.last]="item.isLastChild"
                  [style.left.px]="(item.level - 1) * 20 + 8">
                </div>
              }
            </div>
            
            <!-- Expand/collapse button -->
            @if (item.hasChildren) {
              <button 
                class="expand-button"
                [class.expanded]="item.isExpanded"
                (click)="toggleNode(item.node.id, $event)"
                [title]="item.isExpanded ? 'Collapse' : 'Expand'">
                @if (item.isExpanded) {
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                  </svg>
                } @else {
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M5 3L8 6L5 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                  </svg>
                }
              </button>
            } @else {
              <div class="expand-placeholder"></div>
            }
            
            <!-- Component icon -->
            <div class="component-icon">
              @if (item.node.isOnPushStrategy) {
                <svg width="16" height="16" viewBox="0 0 16 16" class="onpush-icon">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <circle cx="8" cy="8" r="2" fill="currentColor"/>
                </svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 16 16" class="default-icon">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
              }
            </div>
            
            <!-- Component information -->
            <div class="component-info">
              <div class="component-name">
                {{ item.node.name }}
                @if (item.node.isActive) {
                  <span class="activity-indicator" title="Active">●</span>
                }
              </div>
              <div class="component-details">
                <span class="selector">{{ item.node.selector }}</span>
                @if (showCounts()) {
                  <span class="change-count" [title]="'Change detections: ' + item.node.changeDetectionCount">
                    {{ formatCount(item.node.changeDetectionCount) }}
                  </span>
                }
                @if (showTimestamps() && item.node.lastChangeDetectionTime) {
                  <span class="last-update" [title]="'Last update: ' + formatTimestamp(item.node.lastChangeDetectionTime)">
                    {{ formatTime(item.node.lastChangeDetectionTime) }}
                  </span>
                }
              </div>
            </div>
            
            <!-- Strategy badge -->
            @if (item.node.isOnPushStrategy) {
              <div class="strategy-badge onpush" title="OnPush Change Detection">
                OnPush
              </div>
            } @else {
              <div class="strategy-badge default" title="Default Change Detection">
                Default
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .enhanced-tree {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
      color: var(--cd-text, #334155);
      background: var(--cd-surface, #ffffff);
      border-radius: 6px;
      overflow: hidden;
    }

    .enhanced-tree.compact {
      font-size: 12px;
      line-height: 1.3;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--cd-text-muted, #64748b);
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    .empty-message {
      font-size: 14px;
      font-weight: 500;
    }

    .tree-node {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 32px;
      padding: 4px 12px 4px 0;
      cursor: pointer;
      transition: all 0.15s ease;
      border-bottom: 1px solid var(--cd-border-light, #f1f5f9);
    }

    .tree-node:hover {
      background: var(--cd-hover, #f8fafc);
    }

    .tree-node.selected {
      background: var(--cd-selected, #eff6ff);
      border-color: var(--cd-primary, #3b82f6);
    }

    .tree-node.active {
      box-shadow: inset 3px 0 0 var(--cd-success, #10b981);
    }

    .tree-node.active .activity-indicator {
      color: var(--cd-success, #10b981);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .tree-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .tree-line {
      position: absolute;
      border-color: var(--cd-border, #e2e8f0);
    }

    .tree-line.vertical {
      top: 0;
      bottom: 0;
      width: 1px;
      border-left: 1px dashed transparent;
    }

    .tree-line.vertical.active {
      border-left-color: var(--cd-border, #e2e8f0);
    }

    .tree-line.horizontal {
      top: 16px;
      width: 12px;
      height: 1px;
      border-top: 1px dashed var(--cd-border, #e2e8f0);
    }

    .tree-line.vertical-short {
      top: 0;
      height: 16px;
      width: 1px;
      border-left: 1px dashed var(--cd-border, #e2e8f0);
    }

    .tree-line.vertical-short.last {
      height: 16px;
    }

    .expand-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin-right: 4px;
      background: none;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      color: var(--cd-text-muted, #64748b);
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .expand-button:hover {
      background: var(--cd-hover, #f1f5f9);
      color: var(--cd-text, #334155);
    }

    .expand-placeholder {
      width: 20px;
      height: 20px;
      margin-right: 4px;
      flex-shrink: 0;
    }

    .component-icon {
      display: flex;
      align-items: center;
      margin-right: 8px;
      color: var(--cd-icon, #64748b);
      flex-shrink: 0;
    }

    .onpush-icon {
      color: var(--cd-onpush, #8b5cf6);
    }

    .default-icon {
      color: var(--cd-default, #6b7280);
    }

    .component-info {
      flex: 1;
      min-width: 0;
      margin-right: 8px;
    }

    .component-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--cd-text, #1e293b);
      margin-bottom: 2px;
    }

    .activity-indicator {
      margin-left: 6px;
      font-size: 8px;
      color: var(--cd-success, #10b981);
    }

    .component-details {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--cd-text-muted, #64748b);
    }

    .selector {
      font-family: monospace;
      background: var(--cd-code-bg, #f1f5f9);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10px;
    }

    .change-count {
      background: var(--cd-count-bg, #fef3c7);
      color: var(--cd-count-text, #92400e);
      padding: 1px 5px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      min-width: 18px;
      text-align: center;
    }

    .last-update {
      color: var(--cd-timestamp, #6b7280);
      font-size: 10px;
    }

    .strategy-badge {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .strategy-badge.onpush {
      background: var(--cd-onpush-bg, #f3e8ff);
      color: var(--cd-onpush-text, #7c3aed);
    }

    .strategy-badge.default {
      background: var(--cd-default-bg, #f1f5f9);
      color: var(--cd-default-text, #64748b);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .enhanced-tree {
        --cd-text: #e2e8f0;
        --cd-text-muted: #94a3b8;
        --cd-surface: #1e293b;
        --cd-border: #374151;
        --cd-border-light: #2d3748;
        --cd-hover: #334155;
        --cd-selected: #1e3a8a;
        --cd-code-bg: #374151;
        --cd-count-bg: #451a03;
        --cd-count-text: #fdba74;
        --cd-onpush-bg: #2e1065;
        --cd-onpush-text: #c4b5fd;
        --cd-default-bg: #374151;
        --cd-default-text: #9ca3af;
      }
    }
  `],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnhancedTreeComponent {
  // Inputs
  readonly nodes = input<ComponentNode[]>([]);
  readonly expandedNodes = input<Set<string>>(new Set());
  readonly selectedNode = input<string | null>(null);
  readonly compact = input<boolean>(false);
  readonly showCounts = input<boolean>(true);
  readonly showTimestamps = input<boolean>(true);
  readonly filterMode = input<'all' | 'active-only' | 'onpush-only' | 'modified-only'>('all');

  // Outputs
  readonly nodeToggle = output<string>();
  readonly nodeSelect = output<string>();

  // Computed properties
  readonly filteredNodes = computed(() => {
    const nodes = this.nodes();
    const mode = this.filterMode();

    if (mode === 'all') return nodes;

    return nodes.filter(node => {
      switch (mode) {
        case 'active-only':
          return node.isActive;
        case 'onpush-only':
          return node.isOnPushStrategy;
        case 'modified-only':
          return node.changeDetectionCount > 0;
        default:
          return true;
      }
    });
  });

  readonly displayItems = computed(() => {
    const nodes = this.filteredNodes();
    const expanded = this.expandedNodes();
    const items: TreeNodeDisplay[] = [];

    const processNode = (
      node: ComponentNode, 
      level: number, 
      parentPath: boolean[] = [],
      isLastChild = false
    ) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded.has(node.id);

      items.push({
        node,
        level,
        isExpanded,
        hasChildren,
        isLastChild,
        parentPath: [...parentPath]
      });

      if (hasChildren && isExpanded) {
        const children = node.children || [];
        children.forEach((child, index) => {
          const isLast = index === children.length - 1;
          const newParentPath = [...parentPath];
          
          if (level >= 0) {
            newParentPath[level] = !isLastChild;
          }

          processNode(child, level + 1, newParentPath, isLast);
        });
      }
    };

    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      processNode(node, 0, [], isLast);
    });

    return items;
  });

  toggleNode(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.nodeToggle.emit(nodeId);
  }

  selectNode(nodeId: string): void {
    this.nodeSelect.emit(nodeId);
  }

  getIndentWidth(item: TreeNodeDisplay): number {
    return Math.max(0, item.level * 20 + 12);
  }

  formatCount(count: number): string {
    if (count === 0) return '0';
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

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}