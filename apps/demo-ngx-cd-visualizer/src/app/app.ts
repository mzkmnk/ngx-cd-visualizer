import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { CounterComponent } from './test-components/counter.component';
import { DefaultCdComponent } from './test-components/default-cd.component';
import { DebugPanelComponent } from './test-components/debug-panel.component';

@Component({
  imports: [NxWelcome, RouterModule, CounterComponent, DefaultCdComponent, DebugPanelComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'demo-ngx-cd-visualizer';
}
