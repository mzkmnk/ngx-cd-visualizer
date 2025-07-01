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
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  tablerWorld, 
  tablerTrees, 
  tablerMinus, 
  tablerX,
  tablerMaximize
} from '@ng-icons/tabler-icons';
import { ComponentTreeService } from '../services/component-tree.service';
import { CdVisualizerService } from '../services/cd-visualizer.service';
import { EnhancedTreeComponent } from './enhanced-tree.component';
import { ComponentGraphComponent } from './component-graph.component';
import { VisualizerToolbarComponent } from './visualizer-toolbar.component';
import { FilterMode, VisualizerThemeType } from '../models';

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
      [class.resizing]="isResizing()"
      [class.graph-mode]="viewMode() === 'graph'"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      [style.width.px]="size().width"
      [style.height.px]="size().height"
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
            class="control-btn view-toggle-btn"
            (click)="toggleViewMode()"
            [title]="viewMode() === 'tree' ? 'Switch to Graph View' : 'Switch to Tree View'">
            <ng-icon 
              [name]="viewMode() === 'tree' ? 'tablerWorld' : 'tablerTrees'"
              size="16">
            </ng-icon>
          </button>
          <button 
            class="control-btn"
            (click)="toggleMinimized()"
            [title]="isMinimized() ? 'Expand' : 'Minimize'">
            <ng-icon 
              [name]="isMinimized() ? 'tablerMaximize' : 'tablerMinus'" 
              size="16">
            </ng-icon>
          </button>
          <button 
            class="control-btn close-btn"
            (click)="close()"
            title="Close">
            <ng-icon name="tablerX" size="16"></ng-icon>
          </button>
        </div>
      </div>

      <!-- Content -->
      @if (!isMinimized()) {
        <div class="cd-visualizer-content">
          <!-- Enhanced Toolbar -->
          <lib-visualizer-toolbar
            [filterMode]="filterMode()"
            [isScanning]="isScanning()"
            [componentCount]="componentCount()"
            [onPushCount]="onPushCount()"
            [showTimestamps]="showTimestamps()"
            [showCounts]="showCounts()"
            [compact]="compactView()"
            [theme]="currentTheme()"
            (filterChange)="setFilterMode($event)"
            (scanComponents)="scanComponents()"
            (resetActivity)="resetActivity()"
            (timestampsToggle)="toggleTimestamps($event)"
            (countsToggle)="toggleCounts($event)"
            (compactToggle)="toggleCompactView($event)"
            (themeChange)="setTheme($event)"
            (simulateUserTrigger)="simulateUserTrigger()"
            (simulateSignalTrigger)="simulateSignalTrigger()"
            (simulateAsyncTrigger)="simulateAsyncTrigger()">
          </lib-visualizer-toolbar>
          
          <!-- View Content -->
          @if (viewMode() === 'tree') {
            <lib-enhanced-tree 
              [nodes]="rootComponents()"
              [expandedNodes]="expandedNodes()"
              [selectedNode]="selectedNode()"
              [compact]="compactView()"
              [showCounts]="showCounts()"
              [showTimestamps]="showTimestamps()"
              [filterMode]="filterMode()"
              (nodeToggle)="toggleNode($event)"
              (nodeSelect)="selectNode($event)">
            </lib-enhanced-tree>
          } @else {
            <lib-component-graph
              [nodes]="rootComponents()"
              [selectedNode]="selectedNode()"
              [activeNodes]="activeComponentIds()"
              (nodeSelect)="selectNode($event)">
            </lib-component-graph>
          }
        </div>
      }

      <!-- Resize handles -->
      @if (!isMinimized()) {
        <div class="resize-handles">
          <!-- Corner resize handles -->
          <div 
            class="resize-handle resize-nw"
            (mousedown)="startResize($event, 'nw')"
            title="Resize">
          </div>
          <div 
            class="resize-handle resize-ne"
            (mousedown)="startResize($event, 'ne')"
            title="Resize">
          </div>
          <div 
            class="resize-handle resize-sw"
            (mousedown)="startResize($event, 'sw')"
            title="Resize">
          </div>
          <div 
            class="resize-handle resize-se"
            (mousedown)="startResize($event, 'se')"
            title="Resize">
          </div>
          <!-- Edge resize handles -->
          <div 
            class="resize-handle resize-n"
            (mousedown)="startResize($event, 'n')"
            title="Resize height">
          </div>
          <div 
            class="resize-handle resize-e"
            (mousedown)="startResize($event, 'e')"
            title="Resize width">
          </div>
          <div 
            class="resize-handle resize-s"
            (mousedown)="startResize($event, 's')"
            title="Resize height">
          </div>
          <div 
            class="resize-handle resize-w"
            (mousedown)="startResize($event, 'w')"
            title="Resize width">
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cd-visualizer-overlay {
      position: fixed;
      min-width: 350px;
      max-width: 95vw;
      min-height: 300px;
      max-height: 95vh;
      background: var(--cd-bg, #ffffff);
      border: 1px solid var(--cd-border, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      user-select: none;
      transition: all 0.2s ease;
      resize: none;
    }

    .cd-visualizer-overlay.graph-mode {
      /* Keep the same size and position, don't force full-screen */
      z-index: 9999;
    }

    .cd-visualizer-overlay.minimized {
      height: 40px;
      overflow: hidden;
    }

    .cd-visualizer-overlay.dragging {
      cursor: grabbing;
      transition: none;
    }

    .cd-visualizer-overlay.resizing {
      transition: none;
      user-select: none;
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

    .view-toggle-btn {
      font-size: 12px;
    }

    .view-toggle-btn:hover {
      background: var(--cd-control-hover, #e0e0e0);
      transform: scale(1.1);
    }

    .cd-visualizer-content {
      height: calc(100% - 40px); /* Header height */
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .cd-visualizer-overlay.graph-mode .cd-visualizer-content {
      max-height: 100vh;
      height: 100vh;
    }

    /* Resize handles */
    .resize-handles {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .resize-handle {
      position: absolute;
      pointer-events: auto;
      background: transparent;
      transition: background-color 0.2s ease;
    }

    .resize-handle:hover {
      background: var(--cd-resize-hover, rgba(59, 130, 246, 0.3));
    }

    /* Corner resize handles */
    .resize-nw {
      top: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: nw-resize;
      border-radius: 8px 0 0 0;
    }

    .resize-ne {
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: ne-resize;
      border-radius: 0 8px 0 0;
    }

    .resize-sw {
      bottom: 0;
      left: 0;
      width: 12px;
      height: 12px;
      cursor: sw-resize;
      border-radius: 0 0 0 8px;
    }

    .resize-se {
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      cursor: se-resize;
      border-radius: 0 0 8px 0;
    }

    .resize-se::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 8px;
      height: 8px;
      background: linear-gradient(-45deg, transparent 40%, var(--cd-resize-indicator, #94a3b8) 40%, var(--cd-resize-indicator, #94a3b8) 60%, transparent 60%);
    }

    /* Edge resize handles */
    .resize-n {
      top: 0;
      left: 12px;
      right: 12px;
      height: 4px;
      cursor: n-resize;
    }

    .resize-e {
      top: 12px;
      right: 0;
      width: 4px;
      bottom: 12px;
      cursor: e-resize;
    }

    .resize-s {
      bottom: 0;
      left: 12px;
      right: 12px;
      height: 4px;
      cursor: s-resize;
    }

    .resize-w {
      top: 12px;
      left: 0;
      width: 4px;
      bottom: 12px;
      cursor: w-resize;
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
  imports: [CommonModule, NgIcon, EnhancedTreeComponent, ComponentGraphComponent, VisualizerToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ 
      tablerWorld, 
      tablerTrees, 
      tablerMinus, 
      tablerX,
      tablerMaximize
    })
  ]
})
export class VisualizerOverlayComponent {
  private componentTreeService = inject(ComponentTreeService);
  private cdVisualizerService = inject(CdVisualizerService);
  
  private overlay = viewChild.required<ElementRef<HTMLDivElement>>('overlay');
  
  // State signals
  private readonly _isMinimized = signal(false);
  private readonly _isDragging = signal(false);
  private readonly _isResizing = signal(false);
  private readonly _position = signal({ x: 20, y: 20 });
  private readonly _size = signal({ width: 320, height: 400 });
  private readonly _expandedNodes = signal<Set<string>>(new Set());
  private readonly _selectedNode = signal<string | null>(null);
  
  // UI configuration signals
  private readonly _filterMode = signal<FilterMode>('all');
  private readonly _showTimestamps = signal(true);
  private readonly _showCounts = signal(true);
  private readonly _compactView = signal(false);
  private readonly _currentTheme = signal<VisualizerThemeType>('auto');
  private readonly _viewMode = signal<'tree' | 'graph'>('graph');

  // Computed properties
  readonly isMinimized = this._isMinimized.asReadonly();
  readonly isDragging = this._isDragging.asReadonly();
  readonly isResizing = this._isResizing.asReadonly();
  readonly position = this._position.asReadonly();
  readonly size = this._size.asReadonly();
  readonly expandedNodes = this._expandedNodes.asReadonly();
  readonly selectedNode = this._selectedNode.asReadonly();
  
  // UI configuration computed properties
  readonly filterMode = this._filterMode.asReadonly();
  readonly showTimestamps = this._showTimestamps.asReadonly();
  readonly showCounts = this._showCounts.asReadonly();
  readonly compactView = this._compactView.asReadonly();
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();

  // Component tree data
  readonly componentCount = this.componentTreeService.componentCount;
  readonly onPushCount = this.componentTreeService.onPushComponentCount;
  readonly isScanning = this.componentTreeService.isScanning;
  readonly rootComponents = this.componentTreeService.rootComponents;
  readonly activeComponentIds = this.componentTreeService.activeComponentIds;

  // Drag state
  private dragStartPosition = { x: 0, y: 0 };
  private dragStartMousePosition = { x: 0, y: 0 };

  // Resize state
  private resizeStartSize = { width: 0, height: 0 };
  private resizeStartMousePosition = { x: 0, y: 0 };
  private resizeStartPosition = { x: 0, y: 0 };
  private resizeDirection: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | null = null;

  constructor() {
    // Initialize position and size based on screen size and view mode
    effect(() => {
      if (typeof window !== 'undefined') {
        const viewMode = this._viewMode();
        
        // Developer tool typical size - similar to React DevTools, Vue DevTools
        const defaultWidth = viewMode === 'graph' 
          ? Math.min(800, Math.floor(window.innerWidth * 0.5))  // 50% of screen width for graph (like DevTools)
          : Math.min(400, Math.floor(window.innerWidth * 0.25)); // 25% for tree view
          
        const defaultHeight = viewMode === 'graph'
          ? Math.min(600, Math.floor(window.innerHeight * 0.75)) // 75% of screen height for graph
          : Math.min(500, Math.floor(window.innerHeight * 0.4)); // 40% for tree view
        
        const initialX = window.innerWidth - defaultWidth - 20;
        const initialY = window.innerHeight - defaultHeight - 20;
        
        this._position.set({ 
          x: Math.max(20, initialX), 
          y: Math.max(20, initialY) 
        });
        
        this._size.set({
          width: Math.max(350, defaultWidth), // Ensure minimum width for dev tools
          height: Math.max(300, defaultHeight) // Ensure minimum height for dev tools
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

  // New methods for toolbar functionality
  setFilterMode(mode: FilterMode): void {
    this._filterMode.set(mode);
  }

  toggleTimestamps(show: boolean): void {
    this._showTimestamps.set(show);
  }

  toggleCounts(show: boolean): void {
    this._showCounts.set(show);
  }

  toggleCompactView(compact: boolean): void {
    this._compactView.set(compact);
  }

  setTheme(theme: VisualizerThemeType): void {
    this._currentTheme.set(theme);
  }

  toggleViewMode(): void {
    this._viewMode.update(mode => {
      const newMode = mode === 'tree' ? 'graph' : 'tree';
      
      // Automatically adjust size when switching view modes
      if (typeof window !== 'undefined') {
        const defaultWidth = newMode === 'graph' 
          ? Math.min(800, Math.floor(window.innerWidth * 0.5))
          : Math.min(400, Math.floor(window.innerWidth * 0.25));
          
        const defaultHeight = newMode === 'graph'
          ? Math.min(600, Math.floor(window.innerHeight * 0.75))
          : Math.min(500, Math.floor(window.innerHeight * 0.4));
        
        // Update size for the new view mode
        this._size.set({
          width: Math.max(350, defaultWidth),
          height: Math.max(300, defaultHeight)
        });
        
        // Adjust position to keep within screen bounds
        const currentPos = this._position();
        const maxX = window.innerWidth - defaultWidth - 20;
        const maxY = window.innerHeight - defaultHeight - 20;
        
        this._position.set({
          x: Math.min(currentPos.x, Math.max(20, maxX)),
          y: Math.min(currentPos.y, Math.max(20, maxY))
        });
      }
      
      return newMode;
    });
  }

  startDrag(event: MouseEvent): void {
    if (event.target !== event.currentTarget) return;
    
    event.preventDefault();
    this._isDragging.set(true);
    
    this.dragStartPosition = this._position();
    this.dragStartMousePosition = { x: event.clientX, y: event.clientY };
  }

  startResize(event: MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w'): void {
    event.preventDefault();
    event.stopPropagation();
    
    this._isResizing.set(true);
    this.resizeDirection = direction;
    this.resizeStartSize = this._size();
    this.resizeStartPosition = this._position();
    this.resizeStartMousePosition = { x: event.clientX, y: event.clientY };
  }

  private setupDragListeners(): void {
    if (typeof document === 'undefined') return;

    const handleMouseMove = (event: MouseEvent) => {
      // Handle dragging
      if (this._isDragging()) {
        const deltaX = event.clientX - this.dragStartMousePosition.x;
        const deltaY = event.clientY - this.dragStartMousePosition.y;
        
        const currentSize = this._size();
        const newX = Math.max(0, Math.min(
          window.innerWidth - currentSize.width, 
          this.dragStartPosition.x + deltaX
        ));
        const newY = Math.max(0, Math.min(
          window.innerHeight - 40,
          this.dragStartPosition.y + deltaY
        ));
        
        this._position.set({ x: newX, y: newY });
      }

      // Handle resizing
      if (this._isResizing() && this.resizeDirection) {
        const deltaX = event.clientX - this.resizeStartMousePosition.x;
        const deltaY = event.clientY - this.resizeStartMousePosition.y;
        
        let newWidth = this.resizeStartSize.width;
        let newHeight = this.resizeStartSize.height;
        let newX = this.resizeStartPosition.x;
        let newY = this.resizeStartPosition.y;

        // Calculate new dimensions and position based on resize direction
        switch (this.resizeDirection) {
          case 'nw': // Top-left corner
            newWidth = Math.max(350, this.resizeStartSize.width - deltaX);
            newHeight = Math.max(300, this.resizeStartSize.height - deltaY);
            newX = Math.min(this.resizeStartPosition.x + deltaX, this.resizeStartPosition.x + this.resizeStartSize.width - 350);
            newY = Math.min(this.resizeStartPosition.y + deltaY, this.resizeStartPosition.y + this.resizeStartSize.height - 300);
            break;
          case 'ne': // Top-right corner
            newWidth = Math.max(350, this.resizeStartSize.width + deltaX);
            newHeight = Math.max(300, this.resizeStartSize.height - deltaY);
            newY = Math.min(this.resizeStartPosition.y + deltaY, this.resizeStartPosition.y + this.resizeStartSize.height - 300);
            break;
          case 'sw': // Bottom-left corner
            newWidth = Math.max(350, this.resizeStartSize.width - deltaX);
            newHeight = Math.max(300, this.resizeStartSize.height + deltaY);
            newX = Math.min(this.resizeStartPosition.x + deltaX, this.resizeStartPosition.x + this.resizeStartSize.width - 350);
            break;
          case 'se': // Bottom-right corner
            newWidth = Math.max(350, this.resizeStartSize.width + deltaX);
            newHeight = Math.max(300, this.resizeStartSize.height + deltaY);
            break;
          case 'n': // Top edge
            newHeight = Math.max(300, this.resizeStartSize.height - deltaY);
            newY = Math.min(this.resizeStartPosition.y + deltaY, this.resizeStartPosition.y + this.resizeStartSize.height - 300);
            break;
          case 'e': // Right edge
            newWidth = Math.max(350, this.resizeStartSize.width + deltaX);
            break;
          case 's': // Bottom edge
            newHeight = Math.max(300, this.resizeStartSize.height + deltaY);
            break;
          case 'w': // Left edge
            newWidth = Math.max(350, this.resizeStartSize.width - deltaX);
            newX = Math.min(this.resizeStartPosition.x + deltaX, this.resizeStartPosition.x + this.resizeStartSize.width - 350);
            break;
        }

        // Ensure component stays within screen bounds
        newWidth = Math.min(newWidth, window.innerWidth - newX - 20);
        newHeight = Math.min(newHeight, window.innerHeight - newY - 20);
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));
        
        // Enforce developer tool minimum sizes
        newWidth = Math.max(350, newWidth);
        newHeight = Math.max(300, newHeight);

        this._size.set({ width: newWidth, height: newHeight });
        this._position.set({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      this._isDragging.set(false);
      this._isResizing.set(false);
      this.resizeDirection = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  simulateUserTrigger(): void {
    const rootComponents = this.componentTreeService.rootComponents();
    if (rootComponents.length > 0) {
      this.componentTreeService.simulateTriggerPropagation(
        rootComponents[0].id, 
        'user-interaction', 
        'Button click'
      );
    }
  }
  
  simulateSignalTrigger(): void {
    const rootComponents = this.componentTreeService.rootComponents();
    if (rootComponents.length > 0) {
      this.componentTreeService.simulateTriggerPropagation(
        rootComponents[0].id, 
        'signal-update', 
        'userCount signal'
      );
    }
  }
  
  simulateAsyncTrigger(): void {
    const rootComponents = this.componentTreeService.rootComponents();
    if (rootComponents.length > 0) {
      this.componentTreeService.simulateTriggerPropagation(
        rootComponents[0].id, 
        'async-operation', 
        'HTTP response'
      );
    }
  }
}