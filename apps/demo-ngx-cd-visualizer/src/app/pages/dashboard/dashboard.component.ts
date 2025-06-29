import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
import { AnalyticsService } from '../../services/analytics.service';
import { StatsCardComponent } from './stats-card.component';
import { RealtimeChartComponent } from './realtime-chart.component';
import { ActivityFeedComponent } from './activity-feed.component';
import { QuickActionsComponent } from './quick-actions.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, StatsCardComponent, RealtimeChartComponent, ActivityFeedComponent, QuickActionsComponent],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h1>📊 Dashboard</h1>
        <p>Mixed Change Detection Strategies Demo</p>
        <div class="header-actions">
          <button class="refresh-btn" (click)="refreshAll()">
            🔄 Refresh All
          </button>
          <div class="update-counter">
            Updates: {{ updateCount }}
          </div>
        </div>
      </div>

      <!-- Stats Grid (OnPush Components) -->
      <div class="stats-grid">
        <app-stats-card
          title="Total Users"
          [value]="userService.users().length"
          icon="👥"
          color="blue"
          [trend]="5">
        </app-stats-card>
        
        <app-stats-card
          title="Active Products"
          [value]="inStockProducts"
          icon="📦"
          color="green"
          [trend]="2">
        </app-stats-card>
        
        <app-stats-card
          title="Revenue"
          [value]="totalRevenue"
          icon="💰"
          color="purple"
          [trend]="12"
          prefix="$">
        </app-stats-card>
        
        <app-stats-card
          title="Analytics"
          [value]="analyticsService.data().length"
          icon="📈"
          color="orange"
          [trend]="0"
          suffix=" days">
        </app-stats-card>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <div class="chart-section">
          <h2>📈 Real-time Analytics</h2>
          <app-realtime-chart 
            [data]="analyticsService.data()"
            [isLoading]="analyticsService.isLoading()">
          </app-realtime-chart>
        </div>

        <div class="activity-section">
          <h2>📋 Recent Activity</h2>
          <app-activity-feed 
            [activities]="activities"
            [maxItems]="8">
          </app-activity-feed>
        </div>

        <div class="actions-section">
          <h2>⚡ Quick Actions</h2>
          <app-quick-actions 
            (actionTriggered)="onActionTriggered($event)">
          </app-quick-actions>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      margin-left: 270px;
      padding: 20px;
      min-height: 100vh;
      background: #f8fafc;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: #1e293b;
    }

    .page-header p {
      margin: 5px 0 0 0;
      color: #64748b;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .refresh-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .refresh-btn:hover {
      background: #2563eb;
    }

    .update-counter {
      background: #f1f5f9;
      color: #64748b;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-template-rows: auto auto;
      gap: 30px;
    }

    .chart-section {
      grid-column: 1;
      grid-row: 1;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .activity-section {
      grid-column: 2;
      grid-row: 1 / 3;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .actions-section {
      grid-column: 1;
      grid-row: 2;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #1e293b;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 10px;
    }

    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
      }

      .chart-section {
        grid-column: 1;
        grid-row: 1;
      }

      .activity-section {
        grid-column: 1;
        grid-row: 2;
      }

      .actions-section {
        grid-column: 1;
        grid-row: 3;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  productService = inject(ProductService);
  analyticsService = inject(AnalyticsService);

  updateCount = 0;
  totalRevenue = 127450;
  
  // Using getters to trigger change detection on every access
  get inStockProducts(): number {
    return this.productService.products().filter(p => p.inStock).length;
  }
  
  activities = [
    { id: 1, type: 'user', message: 'New user Alice Johnson registered', timestamp: new Date(Date.now() - 1000 * 60 * 5), icon: '👤' },
    { id: 2, type: 'sale', message: 'Product "Wireless Headphones" sold', timestamp: new Date(Date.now() - 1000 * 60 * 15), icon: '💰' },
    { id: 3, type: 'system', message: 'Database backup completed', timestamp: new Date(Date.now() - 1000 * 60 * 30), icon: '💾' },
    { id: 4, type: 'user', message: 'User Bob Smith updated profile', timestamp: new Date(Date.now() - 1000 * 60 * 45), icon: '✏️' },
    { id: 5, type: 'product', message: 'Smart Watch went out of stock', timestamp: new Date(Date.now() - 1000 * 60 * 60), icon: '📦' },
    { id: 6, type: 'sale', message: 'Coffee Mug sold to customer', timestamp: new Date(Date.now() - 1000 * 60 * 75), icon: '☕' },
    { id: 7, type: 'system', message: 'Performance report generated', timestamp: new Date(Date.now() - 1000 * 60 * 90), icon: '📊' },
    { id: 8, type: 'user', message: 'Admin privileges updated', timestamp: new Date(Date.now() - 1000 * 60 * 120), icon: '🔐' }
  ];

  private updateInterval?: number;
  private bulkUpdateListener?: () => void;

  ngOnInit(): void {
    // Start real-time updates
    this.analyticsService.simulateRealtimeUpdate();
    
    // Listen for bulk update events from navigation
    this.bulkUpdateListener = () => {
      this.triggerBulkUpdate();
    };
    window.addEventListener('demo-bulk-update', this.bulkUpdateListener);

    // Regular updates to trigger change detection
    this.updateInterval = window.setInterval(() => {
      this.updateCount++;
      this.totalRevenue += Math.floor(Math.random() * 1000);
      
      // Add new activity occasionally
      if (Math.random() > 0.7) {
        this.addRandomActivity();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.bulkUpdateListener) {
      window.removeEventListener('demo-bulk-update', this.bulkUpdateListener);
    }
  }

  refreshAll(): void {
    this.updateCount++;
    this.analyticsService.refreshData();
    this.totalRevenue = Math.floor(Math.random() * 200000) + 50000;
  }

  onActionTriggered(action: string): void {
    this.updateCount++;
    
    switch (action) {
      case 'add-user':
        // Simulate adding a user
        this.addActivity('user', 'Quick user creation completed', '👤');
        break;
      case 'refresh-products':
        // Simulate product refresh
        this.addActivity('product', 'Product inventory refreshed', '📦');
        break;
      case 'generate-report':
        // Simulate report generation
        this.addActivity('system', 'New analytics report generated', '📊');
        break;
    }
  }

  private triggerBulkUpdate(): void {
    // Trigger multiple updates to demonstrate change detection impact
    this.updateCount += 5;
    this.totalRevenue += Math.floor(Math.random() * 5000);
    
    // Add multiple activities
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.addRandomActivity(), i * 200);
    }
  }

  private addRandomActivity(): void {
    const messages = [
      { type: 'user', message: 'User session started', icon: '🔐' },
      { type: 'sale', message: 'New order placed', icon: '🛒' },
      { type: 'system', message: 'System health check passed', icon: '✅' },
      { type: 'product', message: 'Inventory updated', icon: '📋' }
    ];
    
    const activity = messages[Math.floor(Math.random() * messages.length)];
    this.addActivity(activity.type, activity.message, activity.icon);
  }

  private addActivity(type: string, message: string, icon: string): void {
    const newActivity = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
      icon
    };
    
    this.activities = [newActivity, ...this.activities].slice(0, 10);
  }
}