import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-default-cd',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="default-cd-container">
      <h3>Default Change Detection Component</h3>
      <p>Count: {{ count }}</p>
      <p>Current Time: {{ currentTime | date:'medium' }}</p>
      <button (click)="increment()">Increment</button>
      <button (click)="updateTime()">Update Time</button>
      <button (click)="heavyOperation()">Heavy Operation</button>
    </div>
  `,
  styles: [`
    .default-cd-container {
      border: 2px solid #ff6b35;
      border-radius: 8px;
      padding: 16px;
      margin: 16px;
      background-color: #fff5f0;
    }
    
    button {
      margin: 4px;
      padding: 8px 16px;
      background-color: #ff6b35;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #e55a2b;
    }
  `]
})
export class DefaultCdComponent {
  count = 0;
  currentTime = new Date();

  increment() {
    this.count++;
  }

  updateTime() {
    this.currentTime = new Date();
  }

  heavyOperation() {
    // Simulate heavy computation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    this.count = Math.floor(result % 100);
  }
}