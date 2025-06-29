export interface CdVisualizerConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  showOnlyChanges?: boolean;
  excludeComponents?: string[];
  maxHistorySize?: number;
  debugMode?: boolean;
}

export interface VisualizerPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface VisualizerTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  success: string;
  warning: string;
  error: string;
}