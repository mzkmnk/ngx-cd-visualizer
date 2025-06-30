import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentNode } from '../models';
import { ComponentNodeComponent } from './component-node.component';

/**
 * Component that displays the hierarchical tree of components
 */
@Component({
  selector: 'lib-component-tree',
  template: `
    <div class="component-tree">
      @if (flattenedNodes().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🌳</div>
          <div class="empty-text">No components found</div>
          <div class="empty-subtext">Click "Scan Tree" to analyze your application</div>
        </div>
      } @else {
        <div class="tree-container">
          @for (item of flattenedNodes(); track item.node.id) {
            <lib-component-node
              [node]="item.node"
              [level]="item.level"
              [isExpanded]="expandedNodes().has(item.node.id)"
              [hasChildren]="item.node.children.length > 0"
              [isSelected]="selectedNode() === item.node.id"
              (nodeToggle)="onNodeToggle(item.node.id)"
              (nodeSelect)="onNodeSelect(item.node.id)">
            </lib-component-node>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .component-tree {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--cd-muted, #666);
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    .empty-text {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--cd-text, #333);
    }

    .empty-subtext {
      font-size: 12px;
      opacity: 0.8;
    }

    .tree-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 300px;
    }

    /* Scrollbar styling */
    .tree-container::-webkit-scrollbar {
      width: 6px;
    }

    .tree-container::-webkit-scrollbar-track {
      background: var(--cd-scrollbar-track, #f1f1f1);
    }

    .tree-container::-webkit-scrollbar-thumb {
      background: var(--cd-scrollbar-thumb, #c1c1c1);
      border-radius: 3px;
    }

    .tree-container::-webkit-scrollbar-thumb:hover {
      background: var(--cd-scrollbar-thumb-hover, #a1a1a1);
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .component-tree {
        --cd-text: #ffffff;
        --cd-muted: #cccccc;
        --cd-scrollbar-track: #404040;
        --cd-scrollbar-thumb: #606060;
        --cd-scrollbar-thumb-hover: #707070;
      }
    }
  `],
  imports: [CommonModule, ComponentNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentTreeComponent {
  // Inputs
  readonly nodes = input.required<ComponentNode[]>();
  readonly expandedNodes = input.required<Set<string>>();
  readonly selectedNode = input<string | null>(null);

  // Outputs
  readonly nodeToggle = output<string>();
  readonly nodeSelect = output<string>();

  // Computed flattened tree for rendering
  readonly flattenedNodes = computed(() => {
    const result: Array<{ node: ComponentNode; level: number }> = [];
    const expanded = this.expandedNodes();
    
    const traverse = (nodes: ComponentNode[], level = 0) => {
      for (const node of nodes) {
        result.push({ node, level });
        
        // Add children if node is expanded
        if (expanded.has(node.id) && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      }
    };
    
    traverse(this.nodes());
    return result;
  });

  onNodeToggle(nodeId: string): void {
    this.nodeToggle.emit(nodeId);
  }

  onNodeSelect(nodeId: string): void {
    this.nodeSelect.emit(nodeId);
  }
}