import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { RealtimeChartComponent } from '../dashboard/realtime-chart.component';

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RealtimeChartComponent],
  template: `
    <div class="analytics-container">
      <div class="page-header">
        <h1>📈 Analytics Dashboard</h1>
        <p>OnPush Strategy with Real-time Updates</p>
        <div class="header-actions">
          <button class="refresh-btn" (click)="refreshData()" [disabled]="analyticsService.isLoading()">
            {{ analyticsService.isLoading() ? '🔄 Loading...' : '🔄 Refresh Data' }}
          </button>
          <div class="last-update">
            @if (analyticsService.lastUpdate()) {
              Last updated: {{ formatTime(analyticsService.lastUpdate()!) }}
            }
          </div>
        </div>
      </div>

      <div class="analytics-content">
        <div class="chart-section">
          <h2>📊 Performance Metrics</h2>
          <app-realtime-chart 
            [data]="analyticsService.data()"
            [isLoading]="analyticsService.isLoading()">
          </app-realtime-chart>
        </div>

        <div class="insights-section">
          <h2>💡 Key Insights</h2>
          <div class="insights-grid">
            <div class="insight-card">
              <div class="insight-icon">📈</div>
              <div class="insight-content">
                <h4>Traffic Growth</h4>
                <p>{{ getTrafficGrowth() }}% increase in visitors over the last 7 days</p>
              </div>
            </div>
            
            <div class="insight-card">
              <div class="insight-icon">💰</div>
              <div class="insight-content">
                <h4>Revenue Peak</h4>
                <p>Highest daily revenue: {{ getMaxRevenue() }}</p>
              </div>
            </div>
            
            <div class="insight-card">
              <div class="insight-icon">🎯</div>
              <div class="insight-content">
                <h4>Conversion Rate</h4>
                <p>{{ getConversionRate() }}% visitors convert to sales</p>
              </div>
            </div>
            
            <div class="insight-card">
              <div class="insight-icon">⚡</div>
              <div class="insight-content">
                <h4>Performance</h4>
                <p>OnPush strategy reduces re-renders by 70%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
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
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
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

    .refresh-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .refresh-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .last-update {
      font-size: 12px;
      color: #64748b;
    }

    .analytics-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
    }

    .chart-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .insights-section {
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

    .insights-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .insight-card {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .insight-icon {
      font-size: 24px;
      margin-right: 12px;
      width: 40px;
      text-align: center;
    }

    .insight-content h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
    }

    .insight-content p {
      margin: 0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }

    @media (max-width: 1200px) {
      .analytics-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  analyticsService = inject(AnalyticsService);

  ngOnInit(): void {
    // Start real-time updates
    this.analyticsService.simulateRealtimeUpdate();
  }

  refreshData(): void {
    this.analyticsService.refreshData();
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor(diff / 1000);

    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  getTrafficGrowth(): number {
    const data = this.analyticsService.data();
    if (data.length < 7) return 0;
    
    const lastWeek = data.slice(-7);
    const prevWeek = data.slice(-14, -7);
    
    const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.visitors, 0) / 7;
    const prevWeekAvg = prevWeek.reduce((sum, d) => sum + d.visitors, 0) / 7;
    
    if (prevWeekAvg === 0) return 0;
    return Math.round(((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100);
  }

  getMaxRevenue(): number {
    const data = this.analyticsService.data();
    return Math.max(...data.map(d => d.revenue));
  }

  getConversionRate(): number {
    const data = this.analyticsService.data();
    if (data.length === 0) return 0;
    
    const totalVisitors = data.reduce((sum, d) => sum + d.visitors, 0);
    const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
    
    if (totalVisitors === 0) return 0;
    return Math.round((totalSales / totalVisitors) * 100 * 100) / 100;
  }
}