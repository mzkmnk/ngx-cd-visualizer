import { ComponentRef, Type } from '@angular/core';

/**
 * Represents a component in the Angular component tree
 */
export interface ComponentNode<T = object> {
  id: string;
  name: string;
  selector: string;
  componentRef: ComponentRef<T>;
  componentType: Type<T>;
  parent: ComponentNode | null;
  children: ComponentNode[];
  isOnPushStrategy: boolean;
  lastChangeDetectionTime?: number;
  changeDetectionCount: number;
  isActive: boolean;
  depth: number;
}

export interface ComponentTreeSnapshot {
  timestamp: number;
  nodes: ComponentNode[];
  rootNodes: ComponentNode[];
}