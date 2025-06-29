import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="stats-card" [class]="'color-' + color()">
      <div class="card-header">
        <div class="icon">{{ icon() }}</div>
        <div class="trend" [class.positive]="trend() > 0" [class.negative]="trend() < 0">
          @if (trend() > 0) {
            ↗ +{{ trend() }}%
          } @else if (trend() < 0) {
            ↘ {{ trend() }}%
          } @else {
            — {{ trend() }}%
          }
        </div>
      </div>
      
      <div class="card-content">
        <div class="value">
          {{ prefix() }}{{ formattedValue() }}{{ suffix() }}
        </div>
        <div class="title">{{ title() }}</div>
      </div>
      
      <div class="card-footer">
        <div class="update-indicator">
          Updated {{ getTimeAgo() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      border-left: 4px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }

    .stats-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .stats-card.color-blue {
      border-left-color: #3b82f6;
    }

    .stats-card.color-green {
      border-left-color: #10b981;
    }

    .stats-card.color-purple {
      border-left-color: #8b5cf6;
    }

    .stats-card.color-orange {
      border-left-color: #f59e0b;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .icon {
      font-size: 24px;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
    }

    .color-blue .icon {
      background: #eff6ff;
    }

    .color-green .icon {
      background: #ecfdf5;
    }

    .color-purple .icon {
      background: #f3e8ff;
    }

    .color-orange .icon {
      background: #fffbeb;
    }

    .trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
    }

    .trend.positive {
      background: #dcfce7;
      color: #16a34a;
    }

    .trend.negative {
      background: #fee2e2;
      color: #dc2626;
    }

    .value {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1;
    }

    .title {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .card-footer {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .update-indicator {
      font-size: 11px;
      color: #94a3b8;
    }

    /* Animated background for active cards */
    .stats-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class StatsCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  icon = input.required<string>();
  color = input<string>('blue');
  trend = input<number>(0);
  prefix = input<string>('');
  suffix = input<string>('');

  private lastUpdate = new Date();

  formattedValue = computed(() => {
    const val = this.value();
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toString();
  });

  getTimeAgo(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }
}