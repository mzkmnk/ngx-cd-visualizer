import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsData } from '../../services/analytics.service';

@Component({
  selector: 'app-realtime-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      } @else {
        <div class="chart-header">
          <div class="metric-tabs">
            <button 
              class="metric-tab"
              [class.active]="selectedMetric === 'visitors'"
              (click)="selectedMetric = 'visitors'">
              👥 Visitors
            </button>
            <button 
              class="metric-tab"
              [class.active]="selectedMetric === 'revenue'"
              (click)="selectedMetric = 'revenue'">
              💰 Revenue
            </button>
            <button 
              class="metric-tab"
              [class.active]="selectedMetric === 'sales'"
              (click)="selectedMetric = 'sales'">
              🛒 Sales
            </button>
          </div>
          <div class="current-value">
            {{ getCurrentValue() }}
          </div>
        </div>

        <div class="chart-area">
          <div class="chart-bars">
            @for (point of getChartData(); track point.date; let i = $index) {
              <div class="bar-container">
                <div 
                  class="bar"
                  [style.height.%]="point.percentage"
                  [style.background]="getBarColor(point.percentage)"
                  [title]="point.date + ': ' + point.value">
                </div>
                @if (i % 5 === 0) {
                  <div class="bar-label">{{ point.shortDate }}</div>
                }
              </div>
            }
          </div>
        </div>

        <div class="chart-summary">
          <div class="summary-item">
            <span class="summary-label">Average</span>
            <span class="summary-value">{{ getAverage() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Peak</span>
            <span class="summary-value">{{ getPeak() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Growth</span>
            <span class="summary-value" [class.positive]="getGrowth() > 0" [class.negative]="getGrowth() < 0">
              {{ getGrowth() > 0 ? '+' : '' }}{{ getGrowth() }}%
            </span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      height: 300px;
      position: relative;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748b;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .metric-tabs {
      display: flex;
      gap: 8px;
    }

    .metric-tab {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .metric-tab:hover {
      border-color: #3b82f6;
    }

    .metric-tab.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .current-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .chart-area {
      height: 180px;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      background: #fafbfc;
      position: relative;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      height: 100%;
      gap: 2px;
    }

    .bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
    }

    .bar {
      width: 100%;
      min-height: 2px;
      border-radius: 2px 2px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .bar:hover {
      opacity: 0.8;
      transform: scaleY(1.05);
    }

    .bar-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 8px;
      transform: rotate(-45deg);
      white-space: nowrap;
    }

    .chart-summary {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .summary-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .summary-value.positive {
      color: #16a34a;
    }

    .summary-value.negative {
      color: #dc2626;
    }
  `]
})
export class RealtimeChartComponent {
  data = input.required<AnalyticsData[]>();
  isLoading = input<boolean>(false);

  selectedMetric: 'visitors' | 'revenue' | 'sales' = 'visitors';

  getChartData() {
    const data = this.data();
    if (!data.length) return [];

    const values = data.map(d => d[this.selectedMetric]);
    const max = Math.max(...values);
    
    return data.map(d => ({
      date: d.date,
      shortDate: new Date(d.date).getDate().toString(),
      value: d[this.selectedMetric],
      percentage: max ? (d[this.selectedMetric] / max) * 100 : 0
    }));
  }

  getCurrentValue(): string {
    const data = this.data();
    if (!data.length) return '0';
    
    const current = data[data.length - 1][this.selectedMetric];
    return this.formatValue(current);
  }

  getAverage(): string {
    const data = this.data();
    if (!data.length) return '0';
    
    const sum = data.reduce((acc, d) => acc + d[this.selectedMetric], 0);
    const avg = sum / data.length;
    return this.formatValue(avg);
  }

  getPeak(): string {
    const data = this.data();
    if (!data.length) return '0';
    
    const max = Math.max(...data.map(d => d[this.selectedMetric]));
    return this.formatValue(max);
  }

  getGrowth(): number {
    const data = this.data();
    if (data.length < 2) return 0;
    
    const first = data[0][this.selectedMetric];
    const last = data[data.length - 1][this.selectedMetric];
    
    if (first === 0) return 0;
    return Math.round(((last - first) / first) * 100);
  }

  getBarColor(percentage: number): string {
    if (percentage > 80) return '#10b981';
    if (percentage > 60) return '#3b82f6';
    if (percentage > 40) return '#f59e0b';
    return '#ef4444';
  }

  private formatValue(value: number): string {
    if (this.selectedMetric === 'revenue') {
      return '$' + (value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toString());
    }
    return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toString();
  }
}