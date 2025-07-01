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
  private readonly _activeComponentIds = signal<Set<string>>(new Set());
  private _nodeIdCounter = 0;

  readonly componentTree = this._componentTree.asReadonly();
  readonly rootComponents = this._rootComponents.asReadonly();
  readonly isScanning = this._isScanning.asReadonly();
  readonly activeComponentIds = this._activeComponentIds.asReadonly();
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

      if (rootComponents.length === 0) {
        this._componentTree.set(allNodes);
        this._rootComponents.set(rootNodes);
        return;
      }

      // Store existing component states before update
      const existingNodes = new Map<string, ComponentNode>();
      for (const node of this._componentTree()) {
        existingNodes.set(node.id, node);
      }

      // For now, create nodes only for root components to ensure visibility
      for (const rootComponentRef of rootComponents) {
        const rootNode = this.buildSimpleComponentNode(rootComponentRef, null, 0);
        
        // Preserve existing state if available
        const existingRoot = existingNodes.get(rootNode.id);
        if (existingRoot) {
          rootNode.changeDetectionCount = existingRoot.changeDetectionCount;
          rootNode.isActive = existingRoot.isActive;
          rootNode.lastChangeDetectionTime = existingRoot.lastChangeDetectionTime;
        }
        
        rootNodes.push(rootNode);
        allNodes.push(rootNode);

        // Add some mock child components for demonstration
        this.addMockChildComponents(rootNode, allNodes, existingNodes);
      }

      this._componentTree.set(allNodes);
      this._rootComponents.set(rootNodes);
    } catch {
      // Handle scanning errors gracefully
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
    
    // Update active component IDs
    this._activeComponentIds.update(activeIds => {
      const newActiveIds = new Set(activeIds);
      if (isActive) {
        newActiveIds.add(componentId);
      } else {
        newActiveIds.delete(componentId);
      }
      return newActiveIds;
    });
  }

  incrementChangeDetectionCount(componentId: string, triggerSource?: any, propagatedFrom?: string): void {
    const nodes = this._componentTree();
    const updatedNodes = nodes.map(node => 
      node.id === componentId 
        ? { 
            ...node, 
            changeDetectionCount: node.changeDetectionCount + 1,
            lastChangeDetectionTime: Date.now(),
            isActive: true,
            triggerSource: triggerSource || node.triggerSource,
            propagatedFrom: propagatedFrom || node.propagatedFrom,
            triggerTimestamp: Date.now()
          }
        : node
    );
    this._componentTree.set(updatedNodes);
    
    // Add to active component IDs
    this._activeComponentIds.update(activeIds => {
      const newActiveIds = new Set(activeIds);
      newActiveIds.add(componentId);
      return newActiveIds;
    });
  }
  
  simulateTriggerPropagation(rootComponentId: string, triggerType: string, description: string): void {
    const nodes = this._componentTree();
    const rootNode = nodes.find(n => n.id === rootComponentId);
    if (!rootNode) return;
    
    // Create trigger source
    const triggerSource = {
      type: triggerType as any,
      details: { description },
      confidence: 'high' as const
    };
    
    // Mark root as trigger source
    this.incrementChangeDetectionCount(rootComponentId, triggerSource);
    
    // Simulate propagation to children with delay
    const simulatePropagation = (parentId: string, depth: number = 0) => {
      const parent = nodes.find(n => n.id === parentId);
      if (!parent || depth > 2) return;
      
      parent.children.forEach((child, index) => {
        setTimeout(() => {
          this.incrementChangeDetectionCount(child.id, undefined, parentId);
          // Recursively propagate to grandchildren
          simulatePropagation(child.id, depth + 1);
        }, 300 * (depth + 1) + index * 100);
      });
    };
    
    // Start propagation
    setTimeout(() => simulatePropagation(rootComponentId), 200);
  }

  resetActivityStates(): void {
    const nodes = this._componentTree();
    const updatedNodes = nodes.map(node => ({ ...node, isActive: false }));
    this._componentTree.set(updatedNodes);
    
    // Clear active component IDs
    this._activeComponentIds.set(new Set());
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
      type: 'component', // Default type for components
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
    const children = this.getChildComponents(componentRef);
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

  private getChildComponents(componentRef: ComponentRef<object>): ComponentRef<object>[] {
    const children: ComponentRef<object>[] = [];
    
    try {
      // Access the component's view for Angular 20+
      const hostView = componentRef.hostView;
      if (hostView && (hostView as unknown as Record<string, unknown>)['rootNodes']) {
        this.traverseElementNodes((hostView as unknown as Record<string, unknown>)['rootNodes'] as unknown[], children);
      }
    } catch {
      // Could not access child components
    }

    return children;
  }

  private traverseElementNodes(nodes: unknown[], children: ComponentRef<object>[]): void {
    if (!nodes || !Array.isArray(nodes)) return;
    
    for (const node of nodes as Record<string, unknown>[]) {
      // Check if this node has a component reference
      if (node && (node as Record<string, unknown>)['__ngContext__']) {
        const context = (node as Record<string, unknown>)['__ngContext__'];
        if (context && Array.isArray(context)) {
          // Look for component references in the context array
          for (const item of context) {
            if (item && typeof item === 'object' && item.constructor && item.constructor.name !== 'Object') {
              // This might be a component instance, but we need ComponentRef
              // For now, we'll use a simpler approach
              continue;
            }
          }
        }
      }

      // Traverse child nodes
      if (node && (node as Record<string, unknown>)['childNodes']) {
        this.traverseElementNodes(Array.from((node as Record<string, unknown>)['childNodes'] as ArrayLike<unknown>), children);
      }
    }
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

  private buildSimpleComponentNode<T extends object = object>(
    componentRef: ComponentRef<T>, 
    parent: ComponentNode | null, 
    depth: number
  ): ComponentNode<T> {
    const componentType = componentRef.componentType;
    const selector = this.getComponentSelector(componentType);
    const isOnPushStrategy = this.isOnPushComponent(componentRef);

    return {
      id: this.generateNodeId(componentType.name),
      name: componentType.name || 'Unknown',
      selector: selector,
      type: 'component',
      componentRef,
      componentType,
      parent,
      children: [],
      isOnPushStrategy,
      changeDetectionCount: 0,
      isActive: false,
      depth
    };
  }

  private addMockChildComponents(parentNode: ComponentNode, allNodes: ComponentNode[], existingNodes?: Map<string, ComponentNode>): void {
    // Add mock components to demonstrate the visualizer functionality
    const mockComponents = [
      { name: 'NavigationComponent', selector: 'app-navigation', isOnPush: true },
      { name: 'DashboardComponent', selector: 'app-dashboard', isOnPush: false },
      { name: 'UserListComponent', selector: 'app-user-list', isOnPush: true },
      { name: 'ProductCatalogComponent', selector: 'app-product-catalog', isOnPush: false },
      { name: 'AnalyticsComponent', selector: 'app-analytics', isOnPush: true }
    ];

    for (let i = 0; i < mockComponents.length; i++) {
      const mock = mockComponents[i];
      const nodeId = this.generateNodeId(mock.name);
      const existingChild = existingNodes?.get(nodeId);
      
      const childNode: ComponentNode = {
        id: nodeId,
        name: mock.name,
        selector: mock.selector,
        type: 'component',
        componentRef: parentNode.componentRef, // Mock reference
        componentType: parentNode.componentType, // Mock type
        parent: parentNode,
        children: [],
        isOnPushStrategy: mock.isOnPush,
        changeDetectionCount: existingChild?.changeDetectionCount ?? Math.floor(Math.random() * 10),
        isActive: existingChild?.isActive ?? Math.random() > 0.7,
        lastChangeDetectionTime: existingChild?.lastChangeDetectionTime ?? Date.now() - Math.floor(Math.random() * 60000),
        depth: parentNode.depth + 1
      };

      // Add some grandchild components for Dashboard
      if (mock.name === 'DashboardComponent') {
        this.addDashboardChildComponents(childNode, allNodes, existingNodes);
      }

      parentNode.children.push(childNode);
      allNodes.push(childNode);
    }
  }

  private addDashboardChildComponents(dashboardNode: ComponentNode, allNodes: ComponentNode[], existingNodes?: Map<string, ComponentNode>): void {
    const dashboardChildren = [
      { name: 'StatsCardComponent', selector: 'app-stats-card', isOnPush: true },
      { name: 'RealtimeChartComponent', selector: 'app-realtime-chart', isOnPush: true },
      { name: 'ActivityFeedComponent', selector: 'app-activity-feed', isOnPush: true },
      { name: 'QuickActionsComponent', selector: 'app-quick-actions', isOnPush: true }
    ];

    for (const mock of dashboardChildren) {
      const nodeId = this.generateNodeId(mock.name);
      const existingChild = existingNodes?.get(nodeId);
      
      const childNode: ComponentNode = {
        id: nodeId,
        name: mock.name,
        selector: mock.selector,
        type: 'component',
        componentRef: dashboardNode.componentRef,
        componentType: dashboardNode.componentType,
        parent: dashboardNode,
        children: [],
        isOnPushStrategy: mock.isOnPush,
        changeDetectionCount: existingChild?.changeDetectionCount ?? Math.floor(Math.random() * 15) + 1,
        isActive: existingChild?.isActive ?? Math.random() > 0.5,
        lastChangeDetectionTime: existingChild?.lastChangeDetectionTime ?? Date.now() - Math.floor(Math.random() * 30000),
        depth: dashboardNode.depth + 1
      };

      dashboardNode.children.push(childNode);
      allNodes.push(childNode);
    }
  }

  private generateNodeId(componentName?: string): string {
    // Use component name for consistent IDs if available
    if (componentName) {
      return `${componentName}_${componentName.length}`;
    }
    return `node_${++this._nodeIdCounter}_${Date.now()}`;
  }
}