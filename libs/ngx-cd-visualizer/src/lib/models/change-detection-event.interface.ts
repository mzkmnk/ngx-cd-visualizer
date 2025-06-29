import { ComponentNode } from './component-node.interface';

export interface ChangeDetectionEvent {
  id: string;
  timestamp: number;
  componentNode: ComponentNode;
  trigger: ChangeDetectionTrigger;
  duration?: number;
  isManualTrigger: boolean;
}

export enum ChangeDetectionTrigger {
  UserInteraction = 'user-interaction',
  AsyncOperation = 'async-operation',
  InputChange = 'input-change',
  OutputEvent = 'output-event',
  SignalUpdate = 'signal-update',
  ManualTrigger = 'manual-trigger',
  Unknown = 'unknown'
}

export interface ChangeDetectionCycle {
  id: string;
  startTime: number;
  endTime?: number;
  events: ChangeDetectionEvent[];
  affectedComponents: ComponentNode[];
}