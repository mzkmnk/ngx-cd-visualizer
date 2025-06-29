import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';
import { UserCardComponent } from './user-card.component';
import { UserFormComponent } from './user-form.component';

@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UserCardComponent, UserFormComponent],
  template: `
    <div class="user-list-container">
      <div class="page-header">
        <h1>👥 User Management</h1>
        <p>OnPush Components with Signals</p>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-value">{{ totalUsers() }}</span>
            <span class="stat-label">Total Users</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ activeUsers() }}</span>
            <span class="stat-label">Active Users</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ adminUsers() }}</span>
            <span class="stat-label">Admins</span>
          </div>
        </div>
      </div>

      <div class="content-section">
        <div class="section-header">
          <h2>User List</h2>
          <button class="add-btn" (click)="toggleAddForm()">
            {{ showAddForm() ? 'Cancel' : '+ Add User' }}
          </button>
        </div>

        @if (showAddForm()) {
          <div class="add-form-section">
            <app-user-form 
              (userAdded)="onUserAdded($event)"
              (cancelled)="toggleAddForm()">
            </app-user-form>
          </div>
        }

        <div class="user-grid">
          @for (user of userService.users(); track user.id) {
            <app-user-card 
              [user]="user"
              (userUpdated)="onUserUpdated($event)"
              (userDeleted)="onUserDeleted($event)">
            </app-user-card>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-list-container {
      margin-left: 270px;
      padding: 20px;
      min-height: 100vh;
      background: #f8fafc;
    }

    .page-header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #1e293b;
    }

    .page-header p {
      margin: 0 0 20px 0;
      color: #64748b;
      font-size: 16px;
    }

    .stats {
      display: flex;
      gap: 20px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border-radius: 8px;
      min-width: 120px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .content-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 15px;
    }

    .section-header h2 {
      margin: 0;
      color: #1e293b;
    }

    .add-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .add-btn:hover {
      background: #059669;
    }

    .add-form-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 2px dashed #cbd5e1;
    }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
  `]
})
export class UserListComponent {
  userService = inject(UserService);
  showAddForm = signal(false);

  totalUsers = computed(() => this.userService.users().length);
  activeUsers = computed(() => this.userService.users().filter(u => u.isActive).length);
  adminUsers = computed(() => this.userService.users().filter(u => u.role === 'admin').length);

  toggleAddForm(): void {
    this.showAddForm.update(show => !show);
  }

  onUserAdded(userData: Omit<User, 'id'>): void {
    this.userService.addUser(userData);
    this.showAddForm.set(false);
  }

  onUserUpdated(user: User): void {
    this.userService.updateUser(user.id, user);
  }

  onUserDeleted(userId: number): void {
    this.userService.deleteUser(userId);
  }
}