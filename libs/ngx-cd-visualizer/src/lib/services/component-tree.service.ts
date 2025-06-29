import { Injectable, ApplicationRef, ComponentRef, signal, computed, ChangeDetectionStrategy, Type } from '@angular/core';
import { ComponentNode, ComponentTreeSnapshot } from '../models';

/**
 * Interface for ViewNode structure in Angular's internal implementation
 */
interface ViewNode {
  componentView?: {
    component?: object;
    ref?: ComponentRef<object>;
  };
  childNodes?: ViewNode[];
}

/**
 * Interface for component annotations metadata
 */
interface ComponentAnnotation {
  selector?: string;
  changeDetection?: ChangeDetectionStrategy;
}

/**
 * Interface for component type with metadata
 */
interface ComponentTypeWithMetadata extends Type<object> {
  __annotations__?: ComponentAnnotation[];
}

@Injectable({
  providedIn: 'root'
})
export class ComponentTreeService {
  private readonly _componentTree = signal<ComponentNode[]>([]);
  private readonly _rootComponents = signal<ComponentNode[]>([]);
  private readonly _isScanning = signal(false);
  private _nodeIdCounter = 0;

  readonly componentTree = this._componentTree.asReadonly();
  readonly rootComponents = this._rootComponents.asReadonly();
  readonly isScanning = this._isScanning.asReadonly();
  readonly componentCount = computed(() => this._componentTree().length);
  readonly onPushComponentCount = computed(() => 
    this._componentTree().filter(node => node.isOnPushStrategy).length
  );

  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private applicationRef: ApplicationRef) {}

  scanComponentTree(): void {
    if (this._isScanning()) return;

    this._isScanning.set(true);
    
    try {
      const rootComponents = this.applicationRef.components;
      const allNodes: ComponentNode[] = [];
      const rootNodes: ComponentNode[] = [];

      for (const rootComponentRef of rootComponents) {
        const rootNode = this.buildComponentNode(rootComponentRef, null, 0);
        rootNodes.push(rootNode);
        this.collectAllNodes(rootNode, allNodes);
      }

      this._componentTree.set(allNodes);
      this._rootComponents.set(rootNodes);
    } finally {
      this._isScanning.set(false);
    }
  }

  findComponentById(id: string): ComponentNode | null {
    return this._componentTree().find(node => node.id === id) || null;
  }

  findComponentBySelector(selector: string): ComponentNode[] {
    return this._componentTree().filter(node => node.selector === selector);
  }

  findComponentsByName(name: string): ComponentNode[] {
    return this._componentTree().filter(node => node.name.includes(name));
  }

  getComponentPath(componentId: string): ComponentNode[] {
    const component = this.findComponentById(componentId);
    if (!component) return [];

    const path: ComponentNode[] = [];
    let current: ComponentNode | null = component;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  createSnapshot(): ComponentTreeSnapshot {
    return {
      timestamp: Date.now(),
      nodes: [...this._componentTree()],
      rootNodes: [...this._rootComponents()]
    };
  }

  updateComponentActivity(componentId: string, isActive: boolean): void {
    const nodes = this._componentTree();
    const updatedNodes = nodes.map(node => 
      node.id === componentId 
        ? { ...node, isActive, lastChangeDetectionTime: isActive ? Date.now() : node.lastChangeDetectionTime }
        : node
    );
    this._componentTree.set(updatedNodes);
  }

  incrementChangeDetectionCount(componentId: string): void {
    const nodes = this._componentTree();
    const updatedNodes = nodes.map(node => 
      node.id === componentId 
        ? { 
            ...node, 
            changeDetectionCount: node.changeDetectionCount + 1,
            lastChangeDetectionTime: Date.now(),
            isActive: true
          }
        : node
    );
    this._componentTree.set(updatedNodes);
  }

  resetActivityStates(): void {
    const nodes = this._componentTree();
    const updatedNodes = nodes.map(node => ({ ...node, isActive: false }));
    this._componentTree.set(updatedNodes);
  }

  private buildComponentNode<T extends object = object>(
    componentRef: ComponentRef<T>, 
    parent: ComponentNode | null, 
    depth: number
  ): ComponentNode<T> {
    // Guard against invalid component ref
    if (!componentRef || !componentRef.componentType) {
      throw new Error('Invalid component reference provided');
    }

    const componentType = componentRef.componentType;
    const selector = this.getComponentSelector(componentType);
    const isOnPushStrategy = this.isOnPushComponent(componentRef);

    const node: ComponentNode<T> = {
      id: this.generateNodeId(),
      name: componentType.name || 'Unknown',
      selector: selector,
      componentRef,
      componentType,
      parent,
      children: [],
      isOnPushStrategy,
      changeDetectionCount: 0,
      isActive: false,
      depth
    };

    // Get child components from the component's view
    const children = this.getChildComponents();
    for (const childRef of children) {
      const childNode = this.buildComponentNode(childRef, node, depth + 1);
      node.children.push(childNode);
    }

    return node;
  }

  private getComponentSelector(componentType: Type<object>): string {
    // Guard against invalid component type
    if (!componentType) {
      return '<unknown>';
    }

    // Try to get selector from component metadata
    try {
      const annotations = (componentType as ComponentTypeWithMetadata).__annotations__ || [];
      for (const annotation of annotations) {
        if (annotation.selector) {
          return annotation.selector;
        }
      }
    } catch {
      // Fallback to component name if metadata access fails
    }

    // Fallback to component name
    return componentType.name ? `<${this.camelToKebab(componentType.name)}>` : '<unknown>';
  }

  private isOnPushComponent<T extends object>(componentRef: ComponentRef<T>): boolean {
    try {
      const componentType = componentRef.componentType;
      const annotations = (componentType as ComponentTypeWithMetadata).__annotations__ || [];
      for (const annotation of annotations) {
        if (annotation.changeDetection === ChangeDetectionStrategy.OnPush) {
          return true;
        }
      }
    } catch {
      // Default to false if metadata access fails
    }
    return false;
  }

  private getChildComponents(): ComponentRef<object>[] {
    // Child component detection implementation planned for Phase 2
    return [];
  }

  private traverseViewNodes(nodes: ViewNode[], children: ComponentRef<object>[]): void {
    for (const node of nodes) {
      if (node.componentView && node.componentView.component) {
        // This is a component node
        const componentRef = node.componentView.ref;
        if (componentRef) {
          children.push(componentRef);
        }
      }

      // Recursively traverse child nodes
      if (node.childNodes) {
        this.traverseViewNodes(node.childNodes, children);
      }
    }
  }

  private collectAllNodes(node: ComponentNode, allNodes: ComponentNode[]): void {
    allNodes.push(node);
    for (const child of node.children) {
      this.collectAllNodes(child, allNodes);
    }
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private generateNodeId(): string {
    return `node_${++this._nodeIdCounter}_${Date.now()}`;
  }
}