import { ComponentRef, Type } from '@angular/core';

export interface ComponentNode {
  id: string;
  name: string;
  selector: string;
  componentRef: ComponentRef<any>;
  componentType: Type<any>;
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