import { Provider } from '@angular/core';
import { CdVisualizerConfig } from '../models';
import { NGX_CD_VISUALIZER_CONFIG, DEFAULT_CD_VISUALIZER_CONFIG } from '../tokens';

export function provideNgxCdVisualizer(config?: Partial<CdVisualizerConfig>): Provider[] {
  return [
    {
      provide: NGX_CD_VISUALIZER_CONFIG,
      useValue: {
        ...DEFAULT_CD_VISUALIZER_CONFIG,
        ...config
      } as CdVisualizerConfig
    }
  ];
}