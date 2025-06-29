import { Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  avatar: string;
  lastLogin: Date;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _users = signal<User[]>([
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin',
      avatar: '👩‍💼',
      lastLogin: new Date(Date.now() - 1000 * 60 * 30),
      isActive: true
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'user',
      avatar: '👨‍💻',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isActive: true
    },
    {
      id: 3,
      name: 'Carol Williams',
      email: 'carol@example.com',
      role: 'manager',
      avatar: '👩‍🎨',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isActive: false
    },
    {
      id: 4,
      name: 'David Brown',
      email: 'david@example.com',
      role: 'user',
      avatar: '👨‍🔬',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6),
      isActive: true
    },
    {
      id: 5,
      name: 'Eva Martinez',
      email: 'eva@example.com',
      role: 'manager',
      avatar: '👩‍💼',
      lastLogin: new Date(Date.now() - 1000 * 60 * 15),
      isActive: true
    }
  ]);

  readonly users = this._users.asReadonly();

  addUser(userData: Omit<User, 'id'>): void {
    const newUser: User = {
      ...userData,
      id: Math.max(...this._users().map(u => u.id)) + 1
    };
    this._users.update(users => [...users, newUser]);
  }

  updateUser(id: number, updates: Partial<User>): void {
    this._users.update(users =>
      users.map(user => user.id === id ? { ...user, ...updates } : user)
    );
  }

  deleteUser(id: number): void {
    this._users.update(users => users.filter(user => user.id !== id));
  }

  getUserById(id: number): User | undefined {
    return this._users().find(user => user.id === id);
  }
}