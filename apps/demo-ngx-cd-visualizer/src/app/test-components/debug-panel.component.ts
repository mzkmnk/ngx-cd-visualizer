import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdVisualizerService } from '@mzkmnk/ngx-cd-visualizer';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-panel">
      <h3>ngx-cd-visualizer Debug Panel</h3>
      
      <div class="status-section">
        <h4>Monitoring Status</h4>
        <p>Active: {{ isMonitoring() ? 'Yes' : 'No' }}</p>
        <p>Components: {{ componentCount() }}</p>
        <p>OnPush: {{ onPushCount() }}</p>
      </div>

      <div class="component-list-section">
        <h4>Component Tree</h4>
        <div class="component-list">
          @for (component of componentTree(); track component.id) {
            <div class="component-item" 
                 [class.on-push]="component.isOnPushStrategy">
              <span class="component-name">{{ component.name }}</span>
              <span class="component-strategy">
                {{ component.isOnPushStrategy ? 'OnPush' : 'Default' }}
              </span>
            </div>
          }
        </div>
      </div>

      <div class="controls-section">
        <h4>Controls</h4>
        <button (click)="startMonitoring()">Start Monitoring</button>
        <button (click)="refreshTree()">Refresh Tree</button>
        <button (click)="clearHistory()">Clear History</button>
      </div>
    </div>
  `,
  styles: [`
    .debug-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      overflow-y: auto;
      background: white;
      border: 2px solid #007acc;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 12px;
      z-index: 1000;
    }
    
    .status-section, .component-list-section, .controls-section {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }
    
    .component-list {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .component-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      margin: 2px 0;
      border-radius: 4px;
      background: #f9f9f9;
      border-left: 3px solid #ddd;
    }
    
    .component-item.on-push {
      background: #f3e5f5;
      border-left: 3px solid #9c27b0;
    }
    
    .component-name {
      font-weight: 500;
    }
    
    .component-strategy {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background: #e0e0e0;
      color: #666;
    }
    
    .component-item.on-push .component-strategy {
      background: #9c27b0;
      color: white;
    }
    
    button {
      margin: 4px 4px 4px 0;
      padding: 6px 12px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    
    button:hover {
      background: #005c99;
    }
  `]
})
export class DebugPanelComponent implements OnInit {
  visualizerService = inject(CdVisualizerService);
  
  componentCount = computed(() => this.visualizerService.componentTree().length);
  onPushCount = computed(() => 
    this.visualizerService.componentTree().filter(c => c.isOnPushStrategy).length
  );
  isMonitoring = computed(() => this.visualizerService.isMonitoring());
  componentTree = computed(() => this.visualizerService.componentTree());

  ngOnInit() {
    console.log('DebugPanelComponent initialized');
    // Auto-start monitoring for demo purposes
    this.startMonitoring();
  }

  startMonitoring() {
    this.visualizerService.startMonitoring();
    this.refreshTree();
  }

  refreshTree() {
    this.visualizerService.refreshComponentTree();
  }

  clearHistory() {
    this.visualizerService.clearHistory();
  }
}