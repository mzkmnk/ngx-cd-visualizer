/**
 * Position options for the visualizer overlay
 */
export type VisualizerPositionType = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';

/**
 * Theme options for the visualizer
 */
export type VisualizerThemeType = 'light' | 'dark' | 'auto' | 'custom';

/**
 * Filtering mode for component display
 */
export type FilterMode = 'all' | 'active-only' | 'onpush-only' | 'modified-only';

/**
 * Animation speed options
 */
export type AnimationSpeed = 'none' | 'slow' | 'normal' | 'fast';

/**
 * Size presets for the overlay
 */
export type OverlaySize = 'compact' | 'normal' | 'large' | 'custom';

/**
 * Performance monitoring level
 */
export type PerformanceLevel = 'minimal' | 'standard' | 'detailed';

/**
 * Main configuration interface for the CD Visualizer
 */
export interface CdVisualizerConfig {
  // Core settings
  enabled?: boolean;
  autoDisableInProduction?: boolean;
  
  // UI Configuration
  position?: VisualizerPositionType;
  customPosition?: VisualizerCustomPosition;
  theme?: VisualizerThemeType;
  customTheme?: VisualizerTheme;
  size?: OverlaySize;
  customSize?: { width: number; height: number };
  
  // Display Settings
  filterMode?: FilterMode;
  showOnlyChanges?: boolean;
  excludeComponents?: string[];
  includeComponents?: string[];
  showTimestamps?: boolean;
  showCounts?: boolean;
  showPerformanceMetrics?: boolean;
  
  // Behavior Settings
  autoMinimize?: boolean;
  minimizeOnInactivity?: boolean;
  inactivityTimeout?: number; // milliseconds
  rememberPosition?: boolean;
  rememberState?: boolean;
  
  // Performance Settings
  maxHistorySize?: number;
  updateInterval?: number; // milliseconds
  performanceLevel?: PerformanceLevel;
  enableBatching?: boolean;
  batchSize?: number;
  
  // Animation Settings
  animationSpeed?: AnimationSpeed;
  enableTransitions?: boolean;
  highlightDuration?: number; // milliseconds
  
  // Development Settings
  debugMode?: boolean;
  verboseLogging?: boolean;
  showInternalComponents?: boolean;
  enableHotkeys?: boolean;
  
  // Accessibility
  highContrast?: boolean;
  reducedMotion?: boolean;
  screenReaderSupport?: boolean;
  
  // Integration Settings
  enableGlobalStyles?: boolean;
  zIndex?: number;
  customCssClasses?: string[];
  
  // Callbacks
  onToggle?: (isVisible: boolean) => void;
  onComponentSelect?: (componentId: string) => void;
  onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
}

/**
 * Custom position configuration
 */
export interface VisualizerCustomPosition {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  transform?: string;
  zIndex?: number;
}

/**
 * Comprehensive theme configuration
 */
export interface VisualizerTheme {
  // Base colors
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  overlay: string;
  
  // Text colors
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  
  // Component state colors
  active: string;
  inactive: string;
  onPush: string;
  modified: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Interactive colors
  hover: string;
  focus: string;
  selected: string;
  disabled: string;
  
  // Border and shadow
  border: string;
  shadow: string;
  
  // Custom properties
  customProperties?: Record<string, string>;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  componentCount: number;
  activeComponents: number;
  changeDetectionCycles: number;
  averageCycleTime: number;
  memoryUsage?: number;
  renderTime?: number;
}

/**
 * Predefined theme configurations
 */
export const VISUALIZER_THEMES: Record<string, VisualizerTheme> = {
  light: {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    overlay: 'rgba(255, 255, 255, 0.95)',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#1e293b',
    onSurface: '#334155',
    active: '#10b981',
    inactive: '#9ca3af',
    onPush: '#8b5cf6',
    modified: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    hover: '#f1f5f9',
    focus: '#dbeafe',
    selected: '#eff6ff',
    disabled: '#f1f5f9',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    overlay: 'rgba(15, 23, 42, 0.95)',
    onPrimary: '#0f172a',
    onSecondary: '#0f172a',
    onBackground: '#f1f5f9',
    onSurface: '#e2e8f0',
    active: '#34d399',
    inactive: '#64748b',
    onPush: '#a78bfa',
    modified: '#fbbf24',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    hover: '#334155',
    focus: '#1e40af',
    selected: '#1e3a8a',
    disabled: '#374151',
    border: '#374151',
    shadow: 'rgba(0, 0, 0, 0.3)'
  }
};

/**
 * Default configuration values
 */
export const DEFAULT_CD_VISUALIZER_CONFIG: Required<CdVisualizerConfig> = {
  // Core settings
  enabled: true,
  autoDisableInProduction: true,
  
  // UI Configuration
  position: 'bottom-right',
  customPosition: {},
  theme: 'auto',
  customTheme: VISUALIZER_THEMES['light'],
  size: 'normal',
  customSize: { width: 400, height: 500 },
  
  // Display Settings
  filterMode: 'all',
  showOnlyChanges: false,
  excludeComponents: [],
  includeComponents: [],
  showTimestamps: true,
  showCounts: true,
  showPerformanceMetrics: false,
  
  // Behavior Settings
  autoMinimize: false,
  minimizeOnInactivity: false,
  inactivityTimeout: 30000,
  rememberPosition: true,
  rememberState: true,
  
  // Performance Settings
  maxHistorySize: 1000,
  updateInterval: 100,
  performanceLevel: 'standard',
  enableBatching: true,
  batchSize: 10,
  
  // Animation Settings
  animationSpeed: 'normal',
  enableTransitions: true,
  highlightDuration: 1500,
  
  // Development Settings
  debugMode: false,
  verboseLogging: false,
  showInternalComponents: false,
  enableHotkeys: true,
  
  // Accessibility
  highContrast: false,
  reducedMotion: false,
  screenReaderSupport: true,
  
  // Integration Settings
  enableGlobalStyles: true,
  zIndex: 9999,
  customCssClasses: [],
  
  // Callbacks (no-op functions by default)
  onToggle: () => { /* no-op */ },
  onComponentSelect: () => { /* no-op */ },
  onPerformanceAlert: () => { /* no-op */ }
};

/**
 * Environment-specific configuration helper
 */
export interface EnvironmentConfig {
  development?: Partial<CdVisualizerConfig>;
  testing?: Partial<CdVisualizerConfig>;
  production?: Partial<CdVisualizerConfig>;
}

/**
 * Configuration builder utility
 */
export class CdVisualizerConfigBuilder {
  private config: Partial<CdVisualizerConfig> = {};

  static create(): CdVisualizerConfigBuilder {
    return new CdVisualizerConfigBuilder();
  }

  enabled(enabled: boolean): this {
    this.config.enabled = enabled;
    return this;
  }

  position(position: VisualizerPositionType): this {
    this.config.position = position;
    return this;
  }

  theme(theme: VisualizerThemeType): this {
    this.config.theme = theme;
    return this;
  }

  filterMode(mode: FilterMode): this {
    this.config.filterMode = mode;
    return this;
  }

  exclude(...components: string[]): this {
    this.config.excludeComponents = [...(this.config.excludeComponents || []), ...components];
    return this;
  }

  performance(level: PerformanceLevel): this {
    this.config.performanceLevel = level;
    return this;
  }

  debugMode(enabled = true): this {
    this.config.debugMode = enabled;
    return this;
  }

  build(): Partial<CdVisualizerConfig> {
    return { ...this.config };
  }

  buildForEnvironment(env: 'development' | 'production' | 'testing'): Partial<CdVisualizerConfig> {
    const envDefaults: Record<string, Partial<CdVisualizerConfig>> = {
      development: {
        enabled: true,
        debugMode: true,
        verboseLogging: true,
        performanceLevel: 'detailed'
      },
      production: {
        enabled: false,
        debugMode: false,
        verboseLogging: false,
        performanceLevel: 'minimal'
      },
      testing: {
        enabled: false,
        debugMode: false,
        verboseLogging: false
      }
    };

    return {
      ...envDefaults[env],
      ...this.config
    };
  }
}