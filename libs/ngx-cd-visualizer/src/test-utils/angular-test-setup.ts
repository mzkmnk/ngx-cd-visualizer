import { TestBed } from '@angular/core/testing';
import { ApplicationRef, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createMockApplicationRef, createMockNgZone } from './test-utils';

/**
 * Complete Angular test environment setup
 * Provides all necessary dependencies for Angular services
 */

export function setupAngularTestEnvironment() {
  // Reset TestBed to clean state
  TestBed.resetTestingModule();
  
  // Create mock dependencies with proper observables
  const mockApplicationRef = {
    ...createMockApplicationRef(),
    isStable: new BehaviorSubject(true).asObservable()
  };

  const mockNgZone = {
    ...createMockNgZone(),
    onStable: new BehaviorSubject(null),
    onUnstable: new BehaviorSubject(null),
    onError: new BehaviorSubject(null),
    onMicrotaskEmpty: new BehaviorSubject(null)
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: ApplicationRef, useValue: mockApplicationRef },
      { provide: NgZone, useValue: mockNgZone }
    ]
  });

  return { mockApplicationRef, mockNgZone };
}

/**
 * Setup for services that don't require complex Angular dependencies
 */
export function setupSimpleTestEnvironment() {
  TestBed.resetTestingModule();
  return {};
}