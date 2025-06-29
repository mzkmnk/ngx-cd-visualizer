import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-form">
      <h3>➕ Add New User</h3>
      
      <form (ngSubmit)="submitForm()" #userForm="ngForm">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input 
              type="text" 
              [(ngModel)]="formData.name" 
              name="name"
              required
              class="form-input"
              placeholder="Enter full name">
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input 
              type="email" 
              [(ngModel)]="formData.email" 
              name="email"
              required
              class="form-input"
              placeholder="Enter email address">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Role</label>
            <select [(ngModel)]="formData.role" name="role" class="form-select">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Avatar</label>
            <div class="avatar-picker">
              @for (avatar of avatars; track avatar) {
                <button 
                  type="button"
                  class="avatar-btn"
                  [class.selected]="formData.avatar === avatar"
                  (click)="selectAvatar(avatar)">
                  {{ avatar }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="submit-btn"
            [disabled]="!userForm.valid || isSubmitting()">
            {{ isSubmitting() ? 'Adding...' : 'Add User' }}
          </button>
          <button 
            type="button" 
            class="cancel-btn"
            (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .user-form {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
    }

    .user-form h3 {
      margin: 0 0 20px 0;
      color: #1e293b;
      font-size: 18px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
      font-size: 14px;
    }

    .form-input, .form-select {
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .avatar-picker {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .avatar-btn {
      width: 40px;
      height: 40px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-btn:hover {
      border-color: #3b82f6;
      transform: scale(1.05);
    }

    .avatar-btn.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .submit-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      background: #059669;
    }

    .submit-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .cancel-btn:hover {
      background: #4b5563;
    }
  `]
})
export class UserFormComponent {
  userAdded = output<Omit<User, 'id'>>();
  cancelled = output<void>();

  isSubmitting = signal(false);
  
  formData = {
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user' | 'manager',
    avatar: '👤'
  };

  avatars = ['👤', '👨‍💻', '👩‍💼', '👨‍🔬', '👩‍🎨', '👨‍💼', '👩‍🔬', '👨‍🎨'];

  selectAvatar(avatar: string): void {
    this.formData.avatar = avatar;
  }

  submitForm(): void {
    if (this.formData.name && this.formData.email) {
      this.isSubmitting.set(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const userData: Omit<User, 'id'> = {
          name: this.formData.name,
          email: this.formData.email,
          role: this.formData.role,
          avatar: this.formData.avatar,
          lastLogin: new Date(),
          isActive: true
        };

        this.userAdded.emit(userData);
        this.resetForm();
        this.isSubmitting.set(false);
      }, 500);
    }
  }

  cancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      role: 'user',
      avatar: '👤'
    };
  }
}