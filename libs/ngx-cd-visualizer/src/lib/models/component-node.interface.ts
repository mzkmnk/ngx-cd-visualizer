import { ComponentRef, Type } from '@angular/core';

/**
 * Represents a component in the Angular component tree
 */
export interface ComponentNode<T = object> {
  id: string;
  name: string;
  selector: string;
  type: string;
  componentRef: ComponentRef<T>;
  componentType: Type<T>;
  parent: ComponentNode | null;
  children: ComponentNode[];
  isOnPushStrategy: boolean;
  lastChangeDetectionTime?: number;
  changeDetectionCount: number;
  isActive: boolean;
  depth: number;
  // Change detection trigger tracking
  triggerSource?: ChangeDetectionTriggerSource;
  propagatedFrom?: string; // ID of the component that triggered this change
  triggerTimestamp?: number;
}

/**
 * Detailed information about what triggered change detection
 */
export interface ChangeDetectionTriggerSource {
  type: 'user-interaction' | 'signal-update' | 'async-operation' | 'input-change' | 'manual' | 'unknown';
  details: {
    event?: string; // DOM event type (click, input, etc.)
    target?: string; // Element selector or description
    signalName?: string; // Signal that was updated
    inputProperty?: string; // Input property that changed
    asyncType?: 'http' | 'timer' | 'promise' | 'observable';
    description?: string; // Human-readable description
  };
  confidence: 'high' | 'medium' | 'low'; // Confidence in the trigger identification
}

export interface ComponentTreeSnapshot {
  timestamp: number;
  nodes: ComponentNode[];
  rootNodes: ComponentNode[];
}