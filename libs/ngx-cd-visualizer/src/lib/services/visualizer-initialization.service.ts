import { 
  Injectable, 
  ApplicationRef, 
  createComponent, 
  EnvironmentInjector,
  ComponentRef,
  inject,
  effect
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { VisualizerOverlayComponent } from '../components/visualizer-overlay.component';
import { CdVisualizerService } from './cd-visualizer.service';

@Injectable({
  providedIn: 'root'
})
export class VisualizerInitializationService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private document = inject(DOCUMENT);
  private visualizerService = inject(CdVisualizerService);
  
  private overlayRef: ComponentRef<VisualizerOverlayComponent> | null = null;

  constructor() {
    // Initialize when config is enabled
    effect(() => {
      const config = this.visualizerService.config();
      if (config.enabled && !this.overlayRef) {
        setTimeout(() => this.initializeOverlay(), 100);
      } else if (!config.enabled && this.overlayRef) {
        this.destroyOverlay();
      }
    });

    // Handle visibility changes
    effect(() => {
      const isVisible = this.visualizerService.isVisible();
      if (this.overlayRef) {
        const element = this.overlayRef.location.nativeElement;
        element.style.display = isVisible ? 'block' : 'none';
      }
    });
  }

  private initializeOverlay(): void {
    if (this.overlayRef) {
      return; // Already initialized
    }

    try {
      // Create the component
      this.overlayRef = createComponent(VisualizerOverlayComponent, {
        environmentInjector: this.injector
      });

      // Attach to the application
      this.appRef.attachView(this.overlayRef.hostView);

      // Add to DOM
      const domElem = this.overlayRef.location.nativeElement;
      this.document.body.appendChild(domElem);

    } catch {
      // Handle initialization errors gracefully
    }
  }

  private destroyOverlay(): void {
    if (this.overlayRef) {
      this.appRef.detachView(this.overlayRef.hostView);
      this.overlayRef.destroy();
      this.overlayRef = null;
    }
  }

  // Expose method for manual initialization if needed
  public forceInitialize(): void {
    if (!this.overlayRef) {
      this.initializeOverlay();
    }
  }
}