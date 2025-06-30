import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-card" [class.inactive]="!user().isActive">
      <div class="user-avatar">
        {{ user().avatar }}
      </div>
      
      <div class="user-info">
        <h3>{{ user().name }}</h3>
        <p class="user-email">{{ user().email }}</p>
        
        <div class="user-meta">
          <span class="role-badge" [class]="'role-' + user().role">
            {{ user().role }}
          </span>
          <span class="status-badge" [class.active]="user().isActive">
            {{ user().isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
        
        <div class="last-login">
          Last login: {{ formatTime(user().lastLogin) }}
        </div>
      </div>
      
      <div class="user-actions">
        <button class="action-btn edit-btn" (click)="toggleEdit()">
          {{ isEditing() ? 'Cancel' : 'Edit' }}
        </button>
        <button class="action-btn toggle-btn" (click)="toggleActive()">
          {{ user().isActive ? 'Deactivate' : 'Activate' }}
        </button>
        <button class="action-btn delete-btn" (click)="confirmDelete()">
          Delete
        </button>
      </div>

      @if (isEditing()) {
        <div class="edit-overlay">
          <div class="edit-form">
            <input 
              [(ngModel)]="editName" 
              placeholder="Name"
              class="edit-input">
            <input 
              [(ngModel)]="editEmail" 
              placeholder="Email"
              class="edit-input">
            <select [(ngModel)]="editRole" class="edit-select">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
            <div class="edit-actions">
              <button class="save-btn" (click)="saveChanges()">Save</button>
              <button class="cancel-btn" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      position: relative;
      border: 2px solid transparent;
    }

    .user-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      border-color: #e2e8f0;
    }

    .user-card.inactive {
      opacity: 0.7;
      background: #f8fafc;
    }

    .user-avatar {
      font-size: 48px;
      text-align: center;
      margin-bottom: 15px;
    }

    .user-info h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #1e293b;
      text-align: center;
    }

    .user-email {
      margin: 0 0 15px 0;
      color: #64748b;
      font-size: 14px;
      text-align: center;
    }

    .user-meta {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-admin {
      background: #fee2e2;
      color: #dc2626;
    }

    .role-manager {
      background: #e0f2fe;
      color: #0369a1;
    }

    .role-user {
      background: #f0fdf4;
      color: #16a34a;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .last-login {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      margin-bottom: 15px;
    }

    .user-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-btn {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .edit-btn:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .toggle-btn:hover {
      background: #f59e0b;
      color: white;
      border-color: #f59e0b;
    }

    .delete-btn:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .edit-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.95);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .edit-form {
      padding: 20px;
      width: 100%;
    }

    .edit-input, .edit-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }

    .save-btn {
      flex: 1;
      padding: 8px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .cancel-btn {
      flex: 1;
      padding: 8px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class UserCardComponent {
  user = input.required<User>();
  userUpdated = output<User>();
  userDeleted = output<number>();

  isEditing = signal(false);
  editName = '';
  editEmail = '';
  editRole: 'admin' | 'user' | 'manager' = 'user';

  toggleEdit(): void {
    if (!this.isEditing()) {
      this.editName = this.user().name;
      this.editEmail = this.user().email;
      this.editRole = this.user().role;
    }
    this.isEditing.update(editing => !editing);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveChanges(): void {
    const updatedUser: User = {
      ...this.user(),
      name: this.editName,
      email: this.editEmail,
      role: this.editRole
    };
    this.userUpdated.emit(updatedUser);
    this.isEditing.set(false);
  }

  toggleActive(): void {
    const updatedUser: User = {
      ...this.user(),
      isActive: !this.user().isActive
    };
    this.userUpdated.emit(updatedUser);
  }

  confirmDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.user().name}?`)) {
      this.userDeleted.emit(this.user().id);
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}