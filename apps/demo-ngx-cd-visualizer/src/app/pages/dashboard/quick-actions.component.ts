import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="quick-actions">
      <div class="actions-grid">
        <button class="action-card primary" (click)="triggerAction('add-user')">
          <div class="action-icon">👤</div>
          <div class="action-content">
            <h4>Add User</h4>
            <p>Create new user account</p>
          </div>
        </button>

        <button class="action-card secondary" (click)="triggerAction('refresh-products')">
          <div class="action-icon">📦</div>
          <div class="action-content">
            <h4>Refresh Products</h4>
            <p>Update product inventory</p>
          </div>
        </button>

        <button class="action-card tertiary" (click)="triggerAction('generate-report')">
          <div class="action-icon">📊</div>
          <div class="action-content">
            <h4>Generate Report</h4>
            <p>Create analytics report</p>
          </div>
        </button>

        <button class="action-card warning" (click)="triggerAction('bulk-update')">
          <div class="action-icon">⚡</div>
          <div class="action-content">
            <h4>Bulk Update</h4>
            <p>Trigger multiple changes</p>
          </div>
        </button>
      </div>

      <div class="bulk-actions">
        <button class="bulk-btn" (click)="triggerMultiple()">
          🚀 Trigger All Actions
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quick-actions {
      
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .action-card.primary {
      border-color: #3b82f6;
    }

    .action-card.primary:hover {
      background: #eff6ff;
      border-color: #2563eb;
    }

    .action-card.secondary {
      border-color: #10b981;
    }

    .action-card.secondary:hover {
      background: #ecfdf5;
      border-color: #059669;
    }

    .action-card.tertiary {
      border-color: #8b5cf6;
    }

    .action-card.tertiary:hover {
      background: #f3e8ff;
      border-color: #7c3aed;
    }

    .action-card.warning {
      border-color: #f59e0b;
    }

    .action-card.warning:hover {
      background: #fffbeb;
      border-color: #d97706;
    }

    .action-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .action-content h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
    }

    .action-content p {
      margin: 0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.3;
    }

    .bulk-actions {
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }

    .bulk-btn {
      width: 100%;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .bulk-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
    }

    .bulk-btn:active {
      transform: translateY(0);
    }
  `]
})
export class QuickActionsComponent {
  actionTriggered = output<string>();

  triggerAction(action: string): void {
    this.actionTriggered.emit(action);
  }

  triggerMultiple(): void {
    // Trigger multiple actions with delays to show change detection cascade
    const actions = ['add-user', 'refresh-products', 'generate-report', 'bulk-update'];
    
    actions.forEach((action, index) => {
      setTimeout(() => {
        this.actionTriggered.emit(action);
      }, index * 300);
    });
  }
}