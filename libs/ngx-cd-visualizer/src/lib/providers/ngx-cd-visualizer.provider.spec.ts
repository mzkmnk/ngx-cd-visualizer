import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { provideNgxCdVisualizer } from './ngx-cd-visualizer.provider';
import { NGX_CD_VISUALIZER_CONFIG, DEFAULT_CD_VISUALIZER_CONFIG } from '../tokens';
import { CdVisualizerConfig } from '../models';

describe('provideNgxCdVisualizer', () => {
  describe('Provider Function', () => {
    it('should provide default configuration when no config is passed', () => {
      const providers = provideNgxCdVisualizer();
      
      expect(providers).toHaveLength(2);
      expect((providers[0] as Provider & { provide: unknown; useValue: unknown }).provide).toBe(NGX_CD_VISUALIZER_CONFIG);
      expect((providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue).toEqual(DEFAULT_CD_VISUALIZER_CONFIG);
    });

    it('should merge provided config with defaults', () => {
      const customConfig: Partial<CdVisualizerConfig> = {
        theme: 'dark',
        position: 'top-left',
        enabled: false
      };
      
      const providers = provideNgxCdVisualizer(customConfig);
      
      expect((providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue).toEqual({
        ...DEFAULT_CD_VISUALIZER_CONFIG,
        ...customConfig
      });
    });

    it('should preserve all default values when partial config is provided', () => {
      const customConfig: Partial<CdVisualizerConfig> = {
        theme: 'dark'
      };
      
      const providers = provideNgxCdVisualizer(customConfig);
      const config = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
      
      expect(config.theme).toBe('dark');
      expect(config.enabled).toBe(DEFAULT_CD_VISUALIZER_CONFIG.enabled);
      expect(config.position).toBe(DEFAULT_CD_VISUALIZER_CONFIG.position);
      expect(config.showOnlyChanges).toBe(DEFAULT_CD_VISUALIZER_CONFIG.showOnlyChanges);
      expect(config.excludeComponents).toEqual(DEFAULT_CD_VISUALIZER_CONFIG.excludeComponents);
      expect(config.debugMode).toBe(DEFAULT_CD_VISUALIZER_CONFIG.debugMode);
      expect(config.maxHistorySize).toBe(DEFAULT_CD_VISUALIZER_CONFIG.maxHistorySize);
    });

    it('should handle empty config object', () => {
      const providers = provideNgxCdVisualizer({});
      
      expect((providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue).toEqual(DEFAULT_CD_VISUALIZER_CONFIG);
    });

    it('should handle undefined config', () => {
      const providers = provideNgxCdVisualizer(undefined);
      
      expect((providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue).toEqual(DEFAULT_CD_VISUALIZER_CONFIG);
    });
  });

  describe('Angular Integration', () => {
    it('should provide configuration token that can be injected', () => {
      const customConfig: Partial<CdVisualizerConfig> = {
        enabled: false,
        theme: 'dark',
        position: 'top-right'
      };

      TestBed.configureTestingModule({
        providers: [...provideNgxCdVisualizer(customConfig)]
      });

      const injectedConfig = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);

      expect(injectedConfig.enabled).toBe(false);
      expect(injectedConfig.theme).toBe('dark');
      expect(injectedConfig.position).toBe('top-right');
    });

    it('should work with multiple provider configurations', () => {
      const config1: Partial<CdVisualizerConfig> = { theme: 'dark' };
      const config2: Partial<CdVisualizerConfig> = { enabled: false };

      // Last provider should win
      TestBed.configureTestingModule({
        providers: [
          ...provideNgxCdVisualizer(config1),
          ...provideNgxCdVisualizer(config2)
        ]
      });

      const injectedConfig = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);

      expect(injectedConfig.enabled).toBe(false);
      expect(injectedConfig.theme).toBe(DEFAULT_CD_VISUALIZER_CONFIG.theme); // Should be default, not 'dark'
    });

    it('should allow overriding the provider', () => {
      const customConfig: CdVisualizerConfig = {
        enabled: true,
        position: 'bottom-left',
        theme: 'auto',
        showOnlyChanges: true,
        excludeComponents: ['test-component'],
        debugMode: false,
        maxHistorySize: 500
      };

      TestBed.configureTestingModule({
        providers: [
          ...provideNgxCdVisualizer(),
          { provide: NGX_CD_VISUALIZER_CONFIG, useValue: customConfig }
        ]
      });

      const injectedConfig = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);

      expect(injectedConfig).toEqual(customConfig);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle all valid position values', () => {
      const positions: CdVisualizerConfig['position'][] = [
        'bottom-right', 'bottom-left', 'top-right', 'top-left'
      ];

      positions.forEach(position => {
        const providers = provideNgxCdVisualizer({ position });
        const config = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
        
        expect(config.position).toBe(position);
      });
    });

    it('should handle all valid theme values', () => {
      const themes: CdVisualizerConfig['theme'][] = ['light', 'dark', 'auto'];

      themes.forEach(theme => {
        const providers = provideNgxCdVisualizer({ theme });
        const config = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
        
        expect(config.theme).toBe(theme);
      });
    });

    it('should handle boolean flags correctly', () => {
      const booleanConfigs = [
        { enabled: true },
        { enabled: false },
        { showOnlyChanges: true },
        { showOnlyChanges: false },
        { debugMode: true },
        { debugMode: false }
      ];

      booleanConfigs.forEach(config => {
        const providers = provideNgxCdVisualizer(config);
        const resultConfig = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
        
        Object.entries(config).forEach(([key, value]) => {
          expect(resultConfig[key as keyof CdVisualizerConfig]).toBe(value);
        });
      });
    });

    it('should handle excludeComponents array', () => {
      const excludeComponents = ['component1', 'component2', 'component3'];
      const providers = provideNgxCdVisualizer({ excludeComponents });
      const config = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
      
      expect(config.excludeComponents).toEqual(excludeComponents);
      expect(config.excludeComponents === excludeComponents).toBe(true); // Uses the same reference
    });

    it('should handle maxHistorySize number', () => {
      const maxHistorySize = 2000;
      const providers = provideNgxCdVisualizer({ maxHistorySize });
      const config = (providers[0] as Provider & { provide: unknown; useValue: unknown }).useValue as CdVisualizerConfig;
      
      expect(config.maxHistorySize).toBe(maxHistorySize);
    });
  });

  describe('Type Safety', () => {
    it('should accept valid partial configuration', () => {
      // These should compile without TypeScript errors
      expect(() => {
        provideNgxCdVisualizer({});
        provideNgxCdVisualizer({ enabled: true });
        provideNgxCdVisualizer({ theme: 'dark' });
        provideNgxCdVisualizer({ position: 'top-left' });
        provideNgxCdVisualizer({ 
          enabled: false, 
          theme: 'auto', 
          showOnlyChanges: true 
        });
      }).not.toThrow();
    });

    it('should return proper provider type', () => {
      const providers = provideNgxCdVisualizer();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers[0]).toHaveProperty('provide');
      expect(providers[0]).toHaveProperty('useValue');
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for development environment setup', () => {
      const devConfig = provideNgxCdVisualizer({
        enabled: true,
        debugMode: true,
        theme: 'dark',
        position: 'bottom-right'
      });

      TestBed.configureTestingModule({
        providers: [...devConfig]
      });

      const config = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);
      
      expect(config.enabled).toBe(true);
      expect(config.debugMode).toBe(true);
      expect(config.theme).toBe('dark');
    });

    it('should work for production environment setup', () => {
      const prodConfig = provideNgxCdVisualizer({
        enabled: false,
        debugMode: false
      });

      TestBed.configureTestingModule({
        providers: [...prodConfig]
      });

      const config = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);
      
      expect(config.enabled).toBe(false);
      expect(config.debugMode).toBe(false);
    });

    it('should work for minimal configuration', () => {
      const minimalConfig = provideNgxCdVisualizer({
        enabled: true
      });

      TestBed.configureTestingModule({
        providers: [...minimalConfig]
      });

      const config = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);
      
      expect(config.enabled).toBe(true);
      // All other values should be defaults
      expect(config.theme).toBe(DEFAULT_CD_VISUALIZER_CONFIG.theme);
      expect(config.position).toBe(DEFAULT_CD_VISUALIZER_CONFIG.position);
    });

    it('should work for comprehensive configuration', () => {
      const comprehensiveConfig = provideNgxCdVisualizer({
        enabled: true,
        position: 'top-left',
        theme: 'auto',
        showOnlyChanges: true,
        excludeComponents: ['app-header', 'app-footer'],
        debugMode: true,
        maxHistorySize: 2000
      });

      TestBed.configureTestingModule({
        providers: [...comprehensiveConfig]
      });

      const config = TestBed.inject(NGX_CD_VISUALIZER_CONFIG);
      
      expect(config.enabled).toBe(true);
      expect(config.position).toBe('top-left');
      expect(config.theme).toBe('auto');
      expect(config.showOnlyChanges).toBe(true);
      expect(config.excludeComponents).toEqual(['app-header', 'app-footer']);
      expect(config.debugMode).toBe(true);
      expect(config.maxHistorySize).toBe(2000);
    });
  });
});