import { 
  Component, 
  ChangeDetectionStrategy,
  signal,
  inject,
  ElementRef,
  viewChild,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentTreeService } from '../services/component-tree.service';
import { CdVisualizerService } from '../services/cd-visualizer.service';
import { ComponentTreeComponent } from './component-tree.component';

/**
 * Main overlay window component that provides draggable UI for CD visualization
 */
@Component({
  selector: 'lib-visualizer-overlay',
  template: `
    <div 
      #overlay
      class="cd-visualizer-overlay"
      [class.minimized]="isMinimized()"
      [class.dragging]="isDragging()"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      [style.z-index]="9999">
      
      <!-- Header -->
      <div 
        class="cd-visualizer-header"
        (mousedown)="startDrag($event)"
        (dblclick)="toggleMinimized()">
        <div class="header-content">
          <span class="title">CD Visualizer</span>
          <div class="stats">
            <span class="component-count">{{componentCount()}} components</span>
            <span class="onpush-count">{{onPushCount()}} OnPush</span>
          </div>
        </div>
        <div class="header-controls">
          <button 
            class="control-btn"
            (click)="toggleMinimized()"
            [title]="isMinimized() ? 'Expand' : 'Minimize'">
            {{isMinimized() ? '◊' : '−'}}
          </button>
          <button 
            class="control-btn close-btn"
            (click)="close()"
            title="Close">
            ×
          </button>
        </div>
      </div>

      <!-- Content -->
      @if (!isMinimized()) {
        <div class="cd-visualizer-content">
          <div class="toolbar">
            <button 
              class="scan-btn"
              (click)="scanComponents()"
              [disabled]="isScanning()">
              {{isScanning() ? 'Scanning...' : 'Scan Tree'}}
            </button>
            <button 
              class="reset-btn"
              (click)="resetActivity()">
              Reset Activity
            </button>
          </div>
          
          <lib-component-tree 
            [nodes]="rootComponents()"
            [expandedNodes]="expandedNodes()"
            (nodeToggle)="toggleNode($event)"
            (nodeSelect)="selectNode($event)">
          </lib-component-tree>
        </div>
      }
    </div>
  `,
  styles: [`
    .cd-visualizer-overlay {
      position: fixed;
      width: 320px;
      min-height: 40px;
      background: var(--cd-bg, #ffffff);
      border: 1px solid var(--cd-border, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      user-select: none;
      transition: all 0.2s ease;
    }

    .cd-visualizer-overlay.minimized {
      height: 40px;
      overflow: hidden;
    }

    .cd-visualizer-overlay.dragging {
      cursor: grabbing;
      transition: none;
    }

    .cd-visualizer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--cd-header-bg, #f5f5f5);
      border-bottom: 1px solid var(--cd-border, #e0e0e0);
      border-radius: 8px 8px 0 0;
      cursor: grab;
    }

    .cd-visualizer-header:active {
      cursor: grabbing;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .title {
      font-weight: 600;
      color: var(--cd-title, #333);
    }

    .stats {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: var(--cd-subtitle, #666);
    }

    .header-controls {
      display: flex;
      gap: 4px;
    }

    .control-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--cd-control, #666);
    }

    .control-btn:hover {
      background: var(--cd-control-hover, #e0e0e0);
    }

    .close-btn:hover {
      background: #ff4444;
      color: white;
    }

    .cd-visualizer-content {
      max-height: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--cd-border, #e0e0e0);
      background: var(--cd-toolbar-bg, #fafafa);
    }

    .scan-btn, .reset-btn {
      padding: 4px 8px;
      border: 1px solid var(--cd-btn-border, #ddd);
      background: var(--cd-btn-bg, #fff);
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }

    .scan-btn:hover, .reset-btn:hover {
      background: var(--cd-btn-hover, #f0f0f0);
    }

    .scan-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .cd-visualizer-overlay {
        --cd-bg: #2d2d2d;
        --cd-border: #404040;
        --cd-header-bg: #3a3a3a;
        --cd-title: #ffffff;
        --cd-subtitle: #cccccc;
        --cd-control: #cccccc;
        --cd-control-hover: #505050;
        --cd-toolbar-bg: #353535;
        --cd-btn-bg: #404040;
        --cd-btn-border: #555555;
        --cd-btn-hover: #4a4a4a;
      }
    }
  `],
  imports: [CommonModule, ComponentTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualizerOverlayComponent {
  private componentTreeService = inject(ComponentTreeService);
  private cdVisualizerService = inject(CdVisualizerService);
  
  private overlay = viewChild.required<ElementRef<HTMLDivElement>>('overlay');
  
  // State signals
  private readonly _isMinimized = signal(false);
  private readonly _isDragging = signal(false);
  private readonly _position = signal({ x: 20, y: 20 });
  private readonly _expandedNodes = signal<Set<string>>(new Set());
  private readonly _selectedNode = signal<string | null>(null);

  // Computed properties
  readonly isMinimized = this._isMinimized.asReadonly();
  readonly isDragging = this._isDragging.asReadonly();
  readonly position = this._position.asReadonly();
  readonly expandedNodes = this._expandedNodes.asReadonly();
  readonly selectedNode = this._selectedNode.asReadonly();

  // Component tree data
  readonly componentCount = this.componentTreeService.componentCount;
  readonly onPushCount = this.componentTreeService.onPushComponentCount;
  readonly isScanning = this.componentTreeService.isScanning;
  readonly rootComponents = this.componentTreeService.rootComponents;

  // Drag state
  private dragStartPosition = { x: 0, y: 0 };
  private dragStartMousePosition = { x: 0, y: 0 };

  constructor() {
    // Initialize position based on screen size
    effect(() => {
      if (typeof window !== 'undefined') {
        const initialX = window.innerWidth - 340; // 320 + 20 margin
        const initialY = window.innerHeight - 440; // 400 + 40 margin
        this._position.set({ 
          x: Math.max(20, initialX), 
          y: Math.max(20, initialY) 
        });
      }
    });

    // Setup drag event listeners
    this.setupDragListeners();
  }

  toggleMinimized(): void {
    this._isMinimized.update(minimized => !minimized);
  }

  close(): void {
    this.cdVisualizerService.hide();
  }

  scanComponents(): void {
    this.componentTreeService.scanComponentTree();
  }

  resetActivity(): void {
    this.componentTreeService.resetActivityStates();
  }

  toggleNode(nodeId: string): void {
    this._expandedNodes.update(expanded => {
      const newExpanded = new Set(expanded);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }

  selectNode(nodeId: string): void {
    this._selectedNode.set(nodeId);
  }

  startDrag(event: MouseEvent): void {
    if (event.target !== event.currentTarget) return;
    
    event.preventDefault();
    this._isDragging.set(true);
    
    this.dragStartPosition = this._position();
    this.dragStartMousePosition = { x: event.clientX, y: event.clientY };
  }

  private setupDragListeners(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('mousemove', (event) => {
      if (!this._isDragging()) return;

      const deltaX = event.clientX - this.dragStartMousePosition.x;
      const deltaY = event.clientY - this.dragStartMousePosition.y;
      
      const newX = Math.max(0, Math.min(
        window.innerWidth - 320, 
        this.dragStartPosition.x + deltaX
      ));
      const newY = Math.max(0, Math.min(
        window.innerHeight - 40,
        this.dragStartPosition.y + deltaY
      ));
      
      this._position.set({ x: newX, y: newY });
    });

    document.addEventListener('mouseup', () => {
      this._isDragging.set(false);
    });
  }
}