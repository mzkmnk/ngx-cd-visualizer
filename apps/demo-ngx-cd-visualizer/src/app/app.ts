import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationComponent } from './components/navigation.component';

@Component({
  imports: [RouterModule, NavigationComponent],
  selector: 'app-root',
  template: `
    <div class="app-layout">
      <app-navigation></app-navigation>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      background: #f8fafc;
    }
  `]
})
export class App {
  protected title = 'demo-ngx-cd-visualizer';
}
