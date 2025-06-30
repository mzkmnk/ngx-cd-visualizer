import { Provider, APP_INITIALIZER } from '@angular/core';
import { CdVisualizerConfig } from '../models';
import { NGX_CD_VISUALIZER_CONFIG, DEFAULT_CD_VISUALIZER_CONFIG } from '../tokens';
import { VisualizerInitializationService } from '../services/visualizer-initialization.service';

export function provideNgxCdVisualizer(config?: Partial<CdVisualizerConfig>): Provider[] {
  return [
    {
      provide: NGX_CD_VISUALIZER_CONFIG,
      useValue: {
        ...DEFAULT_CD_VISUALIZER_CONFIG,
        ...config
      } as CdVisualizerConfig
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (initService: VisualizerInitializationService) => {
        return () => {
          // Force service instantiation to trigger effects
          initService.forceInitialize();
        };
      },
      deps: [VisualizerInitializationService],
      multi: true
    }
  ];
}