import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: Date;
  icon: string;
}

@Component({
  selector: 'app-activity-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="activity-feed">
      @for (activity of displayedActivities(); track activity.id) {
        <div class="activity-item">
          <div class="activity-icon" [class]="'type-' + activity.type">
            {{ activity.icon }}
          </div>
          <div class="activity-content">
            <div class="activity-message">{{ activity.message }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      }
      
      @if (activities().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No recent activities</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .activity-feed {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .type-user .activity-icon {
      background: #eff6ff;
      color: #3b82f6;
    }

    .type-sale .activity-icon {
      background: #ecfdf5;
      color: #10b981;
    }

    .type-system .activity-icon {
      background: #f3e8ff;
      color: #8b5cf6;
    }

    .type-product .activity-icon {
      background: #fffbeb;
      color: #f59e0b;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-message {
      font-size: 14px;
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .activity-time {
      font-size: 12px;
      color: #64748b;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* Custom scrollbar */
    .activity-feed::-webkit-scrollbar {
      width: 6px;
    }

    .activity-feed::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .activity-feed::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .activity-feed::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class ActivityFeedComponent {
  activities = input.required<Activity[]>();
  maxItems = input<number>(10);

  displayedActivities = () => {
    return this.activities().slice(0, this.maxItems());
  };

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
}