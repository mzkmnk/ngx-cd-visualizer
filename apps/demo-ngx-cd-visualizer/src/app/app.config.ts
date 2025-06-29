import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideNgxCdVisualizer } from '@mzkmnk/ngx-cd-visualizer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    ...provideNgxCdVisualizer({
      debugMode: true,
      enabled: true,
      theme: 'dark'
    }),
  ],
};
