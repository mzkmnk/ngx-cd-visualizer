import { ApplicationRef, NgZone, ComponentRef, Type, ViewRef, Injector, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Type definitions for testing utilities
 * Provides proper typing for mock objects without using 'any'
 */

// Mock ElementRef type
export interface MockElementRef extends ElementRef {
  nativeElement: HTMLElement;
}

// Mock location type for ComponentRef
export interface MockLocation {
  nativeElement: HTMLElement;
}

// Mock ViewRef type
export interface MockViewRef {
  detectChanges: jest.Mock;
  destroy: jest.Mock;
  destroyed: boolean;
}

// Mock ChangeDetectorRef type
export interface MockChangeDetectorRef {
  detectChanges: jest.Mock;
  markForCheck: jest.Mock;
  detach: jest.Mock;
  reattach: jest.Mock;
}

// Mock Injector type
export interface MockInjector {
  get: jest.Mock;
}

// Mock ComponentRef type
export interface MockComponentRef<T = object> {
  componentType: Type<T>;
  instance: T;
  location: MockLocation;
  injector: MockInjector;
  hostView: MockViewRef;
  changeDetectorRef: MockChangeDetectorRef;
  destroy: jest.Mock;
  onDestroy: jest.Mock;
  setInput: jest.Mock;
}

// Mock ApplicationRef type
export interface MockApplicationRef {
  components: ComponentRef<unknown>[];
  tick: jest.Mock;
  attachView: jest.Mock;
  detachView: jest.Mock;
  viewCount: number;
  isStable: boolean;
  bootstrap: jest.Mock;
  destroy: jest.Mock;
}

// Mock NgZone type
export interface MockNgZone {
  run: jest.Mock;
  runOutsideAngular: jest.Mock;
  runGuarded: jest.Mock;
  runTask: jest.Mock;
  isStable: boolean;
  onStable: {
    subscribe: jest.Mock;
  };
  onUnstable: {
    subscribe: jest.Mock;
  };
  onError: {
    subscribe: jest.Mock;
  };
  onMicrotaskEmpty: {
    subscribe: jest.Mock;
  };
}

// Provider types for better type safety
export interface TestProvider {
  provide: unknown;
  useValue: unknown;
}

export interface TestProviderConfig {
  providers: TestProvider[];
}

// Generic mock function type
export type MockFunction<T = unknown> = jest.Mock<T, unknown[]>;

// Type for component constructors in testing
export type TestComponentType<T = object> = new () => T;

// Type for component annotations
export interface ComponentAnnotation {
  selector?: string;
  template?: string;
  changeDetection?: number;
}

// Type for component class with annotations
export interface TestComponentClass {
  __annotations__?: ComponentAnnotation[];
}

// Union type for provider values
export type ProviderValue = string | number | boolean | object | Function;

// Type for mock service methods
export interface MockServiceMethods {
  [key: string]: MockFunction | (() => unknown);
}