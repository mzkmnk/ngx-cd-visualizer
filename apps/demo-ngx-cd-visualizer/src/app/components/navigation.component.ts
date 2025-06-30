import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navigation">
      <div class="nav-brand">
        <h2>📊 Demo App</h2>
      </div>
      
      <ul class="nav-menu">
        @for (item of navItems; track item.path) {
          <li>
            <a [routerLink]="item.path" 
               routerLinkActive="active"
               class="nav-link">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>

      <div class="nav-footer">
        <button class="demo-btn" (click)="triggerBulkUpdate()">
          🔄 Trigger Updates
        </button>
        <div class="update-counter">
          Updates: {{ updateCount() }}
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navigation {
      width: 250px;
      height: 100vh;
      background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
      color: white;
      padding: 20px;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }

    .nav-brand h2 {
      margin: 0 0 30px 0;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 15px;
    }

    .nav-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      flex: 1;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
      transform: translateX(4px);
    }

    .nav-link.active {
      background: rgba(255,255,255,0.15);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .nav-icon {
      font-size: 18px;
      margin-right: 12px;
      width: 20px;
      text-align: center;
    }

    .nav-label {
      font-weight: 500;
    }

    .nav-footer {
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 20px;
      margin-top: 20px;
    }

    .demo-btn {
      width: 100%;
      background: #ef4444;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      margin-bottom: 10px;
    }

    .demo-btn:hover {
      background: #dc2626;
    }

    .update-counter {
      text-align: center;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      background: rgba(0,0,0,0.2);
      padding: 6px;
      border-radius: 4px;
    }
  `]
})
export class NavigationComponent {
  private router = Router;
  
  updateCount = signal(0);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/analytics', label: 'Analytics', icon: '📈' }
  ];

  triggerBulkUpdate(): void {
    // Trigger multiple updates to demonstrate change detection
    this.updateCount.update(count => count + 1);
    
    // Dispatch custom event to trigger updates in other components
    window.dispatchEvent(new CustomEvent('demo-bulk-update', {
      detail: { timestamp: Date.now() }
    }));
  }
}