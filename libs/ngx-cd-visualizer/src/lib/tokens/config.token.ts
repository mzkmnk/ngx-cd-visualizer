import { InjectionToken } from '@angular/core';
import { CdVisualizerConfig } from '../models';

export const NGX_CD_VISUALIZER_CONFIG = new InjectionToken<CdVisualizerConfig>('NGX_CD_VISUALIZER_CONFIG');

export const DEFAULT_CD_VISUALIZER_CONFIG: CdVisualizerConfig = {
  enabled: true,
  position: 'bottom-right',
  theme: 'dark',
  showOnlyChanges: false,
  excludeComponents: [],
  maxHistorySize: 1000,
  debugMode: false
};