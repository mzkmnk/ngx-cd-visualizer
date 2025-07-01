import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  ElementRef,
  viewChild,
  effect,
  OnDestroy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { ComponentNode } from '../models';
import { ComponentTreeService } from '../services/component-tree.service';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  originalNode: ComponentNode;
  isTriggerSource: boolean;
  triggerType?: string;
  propagationDepth: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  isPropagationPath: boolean;
  triggerType?: string;
}

/**
 * Component that displays components as a force-directed graph
 */
@Component({
  selector: 'lib-component-graph',
  template: `
    <div class="component-graph">
      @if (flattenedNodes().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🌐</div>
          <div class="empty-text">No components found</div>
          <div class="empty-subtext">Click "Scan Tree" to analyze your application</div>
        </div>
      } @else {
        <div class="graph-container">
          <svg #svgElement class="graph-svg">
            <!-- D3 will render content here -->
          </svg>
        </div>
      }
    </div>
  `,
  styles: [`
    .component-graph {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--cd-muted, #666);
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    .empty-text {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--cd-text, #333);
    }

    .empty-subtext {
      font-size: 12px;
      opacity: 0.8;
    }

    .graph-container {
      flex: 1;
      position: relative;
      background: var(--cd-graph-bg, #fafafa);
      overflow: hidden;
      border-radius: 0;
    }


    .graph-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Node styles applied via D3 */
    :global(.graph-node) {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    :global(.graph-node.active) {
      filter: drop-shadow(0 0 8px var(--cd-active-glow, #4CAF50));
    }

    :global(.graph-node.selected) {
      stroke: var(--cd-selected, #2196F3);
      stroke-width: 3px;
    }

    :global(.graph-link) {
      stroke: var(--cd-link, #999);
      stroke-opacity: 0.6;
      stroke-width: 1.5px;
    }

    :global(.graph-link.active) {
      stroke: var(--cd-active-link, #4CAF50);
      stroke-opacity: 0.8;
      stroke-width: 2px;
    }

    :global(.graph-label) {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      fill: var(--cd-text, #333);
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }

    /* Dark theme support - maintain light modern appearance */
    @media (prefers-color-scheme: dark) {
      .component-graph {
        --cd-text: #374151;
        --cd-muted: #6b7280;
        --cd-graph-bg: #f8fafc;
        --cd-control-bg: rgba(255, 255, 255, 0.9);
        --cd-control-border: #e5e7eb;
        --cd-control-hover: rgba(243, 244, 246, 1);
        --cd-link: #cbd5e1;
        --cd-active-link: #10b981;
        --cd-selected: #3b82f6;
        --cd-active-glow: #10b981;
      }
    }
  `],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentGraphComponent implements OnDestroy {
  // Injected services
  private componentTreeService = inject(ComponentTreeService);
  
  // Inputs
  readonly nodes = input.required<ComponentNode[]>();
  readonly selectedNode = input<string | null>(null);
  readonly activeNodes = input<Set<string>>(new Set());

  // Outputs
  readonly nodeSelect = output<string>();

  // View references
  readonly svgElement = viewChild.required<ElementRef<SVGElement>>('svgElement');

  // Internal state
  private simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
  private svg: d3.Selection<SVGElement, unknown, null, undefined> | null = null;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private zoom: d3.ZoomBehavior<SVGElement, unknown> | null = null;
  private linkElements: d3.Selection<SVGGElement, GraphLink, SVGGElement, unknown> | null = null;
  private propagationAnimations = new Map<string, d3.Timer>();


  // Computed flattened nodes for graph
  readonly flattenedNodes = computed(() => {
    const result: ComponentNode[] = [];
    
    const traverse = (nodes: ComponentNode[]) => {
      for (const node of nodes) {
        result.push(node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    
    traverse(this.nodes());
    return result;
  });

  // Computed graph data with trigger source tracking
  readonly graphData = computed(() => {
    const flatNodes = this.flattenedNodes();
    
    // Build propagation map to calculate trigger depth
    const propagationMap = this.buildPropagationMap(flatNodes);
    
    const nodes: GraphNode[] = flatNodes.map(node => {
      const isTriggerSource = !!node.triggerSource && !node.propagatedFrom;
      const propagationDepth = propagationMap.get(node.id) || 0;
      
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        isActive: false, // Will be updated separately
        originalNode: node,
        isTriggerSource,
        triggerType: node.triggerSource?.type,
        propagationDepth
      };
    });

    const links: GraphLink[] = [];
    
    // Create parent-child relationships
    flatNodes.forEach(node => {
      node.children.forEach(child => {
        const isPropagationPath = !!node.triggerSource || !!child.propagatedFrom;
        links.push({
          source: node.id,
          target: child.id,
          isPropagationPath,
          triggerType: node.triggerSource?.type || child.triggerSource?.type
        });
      });
    });
    
    // Add trigger propagation links
    flatNodes.forEach(node => {
      if (node.propagatedFrom) {
        const sourceExists = flatNodes.find(n => n.id === node.propagatedFrom);
        if (sourceExists) {
          links.push({
            source: node.propagatedFrom,
            target: node.id,
            isPropagationPath: true,
            triggerType: node.triggerSource?.type
          });
        }
      }
    });

    return { nodes, links };
  });

  constructor() {
    // Initialize D3 graph when data changes
    effect(() => {
      const data = this.graphData();
      if (data.nodes.length > 0) {
        this.initializeGraph();
        this.updateGraph(data);
      }
    });

    // Update selection when selectedNode changes
    effect(() => {
      const selected = this.selectedNode();
      this.updateSelection(selected);
    });

    // Update active states without full re-render
    effect(() => {
      const activeNodes = this.activeNodes();
      this.updateActiveStates(activeNodes);
    });
  }

  private initializeGraph(): void {
    if (this.svg) return; // Already initialized

    const svgElement = this.svgElement().nativeElement;
    
    this.svg = d3.select(svgElement);
    
    // Clear any existing content
    this.svg.selectAll('*').remove();
    
    // Set viewBox to ensure full graph is visible with larger modern nodes
    this.svg.attr('viewBox', '0 0 1200 700');
    
    // Setup zoom behavior
    this.zoom = d3.zoom<SVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (this.g) {
          this.g.attr('transform', event.transform);
        }
      });
    
    this.svg.call(this.zoom);
    
    // Add gradients and patterns definition
    const defs = this.svg.append('defs');
    this.createGradients(defs);
    this.createGridPattern(defs);
    
    // Add grid background
    this.svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#dotGrid)');
    
    // Create main group for zoomable content
    this.g = this.svg.append('g');
    
    // Initialize simulation with minimal forces for stable layout
    this.simulation = d3.forceSimulation<GraphNode>()
      .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('collision', d3.forceCollide().radius(90)) // Larger radius for modern bigger rectangles
      .alphaDecay(0.1) // Faster stabilization
      .velocityDecay(0.8); // Less movement
  }

  private updateGraph(data: { nodes: GraphNode[], links: GraphLink[] }): void {
    if (!this.g || !this.simulation) return;

    const { nodes, links } = data;
    console.log('Updating graph with nodes:', nodes.map(n => ({ id: n.id, name: n.name })));

    // Create simple hierarchical layout without D3 hierarchy
    const positions = this.calculateSimpleTreeLayout(nodes, links);
    console.log('Calculated positions:', Array.from(positions.entries()));

    // Clear previous content
    this.g.selectAll('*').remove();

    // Create Voltagent-style links with animated flow visualization
    const linkGroup = this.g.append('g').attr('class', 'links-container');
    
    this.linkElements = linkGroup.selectAll('.link-group')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'link-group')
      .attr('data-source', d => typeof d.source === 'string' ? d.source : d.source.id)
      .attr('data-target', d => typeof d.target === 'string' ? d.target : d.target.id);
    
    // Background path (always visible)
    this.linkElements.append('path')
      .attr('class', 'graph-link-bg')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('opacity', 0.3)
      .style('stroke-linecap', 'round')
      .attr('d', d => this.createLinkPath(d, positions));
    
    // Hidden path for dot animation (not visible, used for path calculation)
    this.linkElements.append('path')
      .attr('class', 'graph-link-path')
      .attr('stroke', 'none')
      .attr('fill', 'none')
      .attr('opacity', 0)
      .attr('d', d => this.createLinkPath(d, positions));
    
    // Moving dot for flow visualization
    this.linkElements.append('circle')
      .attr('class', 'flow-dot')
      .attr('r', 6)
      .attr('fill', d => this.getTriggerColor(d.triggerType, 0.9))
      .attr('opacity', 0)
      .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))')
      .attr('cx', 0)
      .attr('cy', 0);
    
    // Dot glow effect
    this.linkElements.append('circle')
      .attr('class', 'flow-dot-glow')
      .attr('r', 12)
      .attr('fill', d => this.getTriggerColor(d.triggerType, 0.3))
      .attr('opacity', 0)
      .style('filter', 'blur(6px)')
      .attr('cx', 0)
      .attr('cy', 0);

    // Create node groups
    const nodeGroups = this.g.selectAll('.graph-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'graph-node')
      .attr('transform', d => {
        const position = positions.get(d.id);
        console.log(`Positioning node ${d.id} at`, position);
        return position ? `translate(${position.x},${position.y})` : 'translate(0,0)';
      });

    // Add main node background with modern card styling and trigger indicators
    const sizeConfig = this.getNodeSizeConfig();
    nodeGroups.append('rect')
      .attr('width', sizeConfig.width)
      .attr('height', sizeConfig.height)
      .attr('x', -sizeConfig.width / 2)
      .attr('y', -sizeConfig.height / 2)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', d => this.getNodeGradient(d))
      .attr('stroke', d => this.getNodeBorderColor(d))
      .attr('stroke-width', d => {
        if (d.isTriggerSource) return 3;
        return d.originalNode.isOnPushStrategy ? 2.5 : 1.5;
      })
      .style('filter', d => {
        if (d.isTriggerSource) return 'drop-shadow(0 6px 20px rgba(59,130,246,0.3))';
        return 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))';
      })
      .transition()
      .duration(300)
      .ease(d3.easeBackOut);

    // Add trigger source indicator with modern design
    const triggerNodes = nodeGroups.filter(d => d.isTriggerSource);
    
    triggerNodes.append('circle')
      .attr('cx', 55)
      .attr('cy', -35)
      .attr('r', 8)
      .attr('fill', d => this.getTriggerColor(d.triggerType, 0.9))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

    triggerNodes.append('text')
      .attr('x', 55)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .style('font-size', '8px')
      .style('font-weight', '700')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => this.getTriggerIcon(d.triggerType));
      
    // Add OnPush badge with modern design
    const onPushNodes = nodeGroups.filter(d => d.originalNode.isOnPushStrategy);
    
    onPushNodes.append('rect')
      .attr('x', d => d.isTriggerSource ? 25 : 45)
      .attr('y', -35)
      .attr('width', 20)
      .attr('height', 14)
      .attr('rx', 7)
      .attr('ry', 7)
      .attr('fill', '#10B981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1);

    onPushNodes.append('text')
      .attr('x', d => d.isTriggerSource ? 35 : 55)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .style('font-size', '9px')
      .style('font-weight', '600')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text('OP');

    // Add component name label with better typography
    nodeGroups.append('text')
      .attr('class', 'graph-label')
      .attr('dy', '-0.8em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#1F2937')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => this.getNodeLabel(d));

    // Add trigger description with modern styling
    nodeGroups.filter(d => d.isTriggerSource && !!d.originalNode.triggerSource)
      .append('text')
      .attr('class', 'graph-trigger')
      .attr('dy', '0.2em')
      .attr('text-anchor', 'middle')
      .attr('fill', d => this.getTriggerColor(d.triggerType))
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => this.getTriggerDescription(d.originalNode.triggerSource!));
    
    // Add change detection count with modern styling
    nodeGroups.append('text')
      .attr('class', 'graph-count')
      .attr('dy', d => d.isTriggerSource ? '1.2em' : '0.5em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#6B7280')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => `CD: ${d.originalNode.changeDetectionCount}`);

    // Add propagation depth indicator
    nodeGroups.filter(d => d.propagationDepth > 0)
      .append('text')
      .attr('class', 'graph-depth')
      .attr('dy', d => d.isTriggerSource ? '2.2em' : '1.5em')
      .attr('text-anchor', 'middle') 
      .attr('fill', '#9CA3AF')
      .style('font-size', '9px')
      .style('font-weight', '500')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => `Depth: ${d.propagationDepth}`);

    // Add last change time with improved visibility
    nodeGroups.filter(d => !!d.originalNode.lastChangeDetectionTime)
      .append('text')
      .attr('class', 'graph-time')
      .attr('dy', d => {
        let offset = 1.8;
        if (d.isTriggerSource) offset += 0.7;
        if (d.propagationDepth > 0) offset += 0.7;
        return `${offset}em`;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', '#9CA3AF')
      .style('font-size', '10px')
      .style('font-weight', '400')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => this.formatLastChangeTime(d.originalNode.lastChangeDetectionTime as number));

    // Add modern hover and interaction states
    nodeGroups
      .on('mouseenter', (event, d) => {
        const group = d3.select(event.currentTarget);
        group.select('rect')
          .transition()
          .duration(200)
          .ease(d3.easeBackOut)
          .attr('transform', 'scale(1.05)')
          .style('filter', 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))');
        
        // Highlight connected links
        this.g?.selectAll('.graph-link')
          .style('opacity', (linkData: any) => {
            const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
            const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
          })
          .style('stroke-width', (linkData: any) => {
            const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
            const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
            return (sourceId === d.id || targetId === d.id) ? 3 : 2;
          });
      })
      .on('mouseleave', (event, d) => {
        const group = d3.select(event.currentTarget);
        group.select('rect')
          .transition()
          .duration(200)
          .ease(d3.easeBackOut)
          .attr('transform', 'scale(1)')
          .style('filter', 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))');
        
        // Reset link styles
        this.g?.selectAll('.graph-link')
          .style('opacity', 0.7)
          .style('stroke-width', 2);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        this.nodeSelect.emit(d.id);
      })
      .style('cursor', 'pointer');

    // Stop simulation to prevent unwanted movement
    this.simulation.stop();
  }

  private calculateSimpleTreeLayout(nodes: GraphNode[], links: GraphLink[]): Map<string, {x: number, y: number}> {
    const positions = new Map<string, {x: number, y: number}>();
    
    // Build parent-child relationships
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (!childrenMap.has(sourceId)) {
        childrenMap.set(sourceId, []);
      }
      childrenMap.get(sourceId)?.push(targetId);
      parentMap.set(targetId, sourceId);
    });

    // Find root nodes (nodes without parents)
    const rootNodes = nodes.filter(node => !parentMap.has(node.id));
    console.log('Root nodes found:', rootNodes.map(n => n.id));

    if (rootNodes.length === 0) {
      // Fallback: use first node as root
      const fallbackRoot = nodes[0];
      if (fallbackRoot) {
        positions.set(fallbackRoot.id, { x: 300, y: 50 });
      }
      return positions;
    }

    // Constants for layout - optimized based on current size setting
    const sizeConfig = this.getNodeSizeConfig();
    const LEVEL_HEIGHT = sizeConfig.levelHeight;
    const NODE_SPACING = sizeConfig.spacing;
    const START_Y = 100;
    const START_X = 500;

    // Organize nodes by levels
    const levels: string[][] = [];
    const visited = new Set<string>();
    
    // BFS to organize nodes by levels
    const queue: Array<{nodeId: string, level: number}> = [];
    rootNodes.forEach(root => {
      queue.push({ nodeId: root.id, level: 0 });
    });

    while (queue.length > 0) {
      const queueItem = queue.shift();
      if (!queueItem) break;
      const { nodeId, level } = queueItem;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      // Ensure level array exists
      while (levels.length <= level) {
        levels.push([]);
      }
      
      levels[level].push(nodeId);
      
      // Add children to next level
      const children = childrenMap.get(nodeId) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ nodeId: childId, level: level + 1 });
        }
      });
    }

    console.log('Organized levels:', levels);

    // Position nodes level by level
    levels.forEach((levelNodes, levelIndex) => {
      const y = START_Y + (levelIndex * LEVEL_HEIGHT);
      const totalWidth = (levelNodes.length - 1) * NODE_SPACING;
      const startX = START_X - (totalWidth / 2);

      levelNodes.forEach((nodeId, nodeIndex) => {
        const x = startX + (nodeIndex * NODE_SPACING);
        positions.set(nodeId, { x, y });
      });
    });

    return positions;
  }

  // Removed old D3 hierarchy methods - using simple layout instead
  
  private createGridPattern(defs: d3.Selection<SVGDefsElement, unknown, null, undefined>): void {
    // Create ReactFlow-like dot grid pattern with subtle modern styling
    const pattern = defs.append('pattern')
      .attr('id', 'dotGrid')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');

    // Add subtle background for the pattern
    pattern.append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.8);

    // Main dot pattern
    pattern.append('circle')
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('r', 0.8)
      .attr('fill', '#e5e7eb')
      .attr('opacity', 0.6);

    // Add secondary grid lines for better visual structure
    pattern.append('line')
      .attr('x1', 0)
      .attr('y1', 10)
      .attr('x2', 20)
      .attr('y2', 10)
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    pattern.append('line')
      .attr('x1', 10)
      .attr('y1', 0)
      .attr('x2', 10)
      .attr('y2', 20)
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);
  }
  
  private createGradients(defs: d3.Selection<SVGDefsElement, unknown, null, undefined>): void {
    // ReactFlow-like component gradient (subtle blue)
    const componentGradient = defs.append('linearGradient')
      .attr('id', 'componentGradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    componentGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    componentGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f1f5f9');

    // Active gradient (ReactFlow highlight)
    const activeGradient = defs.append('linearGradient')
      .attr('id', 'activeGradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    activeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fef3c7');
    activeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#fcd34d');

    // Directive gradient (mint green)
    const directiveGradient = defs.append('linearGradient')
      .attr('id', 'directiveGradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    directiveGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ecfdf5');
    directiveGradient.append('stop').attr('offset', '100%').attr('stop-color', '#d1fae5');

    // Service gradient (purple tint)
    const serviceGradient = defs.append('linearGradient')
      .attr('id', 'serviceGradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    serviceGradient.append('stop').attr('offset', '0%').attr('stop-color', '#faf5ff');
    serviceGradient.append('stop').attr('offset', '100%').attr('stop-color', '#e9d5ff');

    // Default gradient (neutral)
    const defaultGradient = defs.append('linearGradient')
      .attr('id', 'defaultGradient')
      .attr('gradientUnits', 'objectBoundingBox')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    defaultGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    defaultGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f9fafb');
  }

  private getNodeGradient(node: GraphNode): string {
    if (node.isActive) return 'url(#activeGradient)';
    
    switch (node.type) {
      case 'component': return 'url(#componentGradient)';
      case 'directive': return 'url(#directiveGradient)';
      case 'service': return 'url(#serviceGradient)';
      default: return 'url(#defaultGradient)';
    }
  }

  private getNodeBorderColor(node: GraphNode): string {
    if (node.originalNode.isOnPushStrategy) return '#10b981'; // Emerald for OnPush
    if (node.isActive) return '#f59e0b'; // Amber for active
    
    switch (node.type) {
      case 'component': return '#3b82f6'; // Blue
      case 'directive': return '#10b981'; // Green
      case 'service': return '#8b5cf6'; // Purple
      default: return '#6b7280'; // Gray
    }
  }

  private getNodeLabel(node: GraphNode): string {
    // Remove common suffixes to make labels cleaner
    const label = node.name.replace(/Component$/, '');
    return label.length > 10 ? label.substring(0, 10) + '...' : label;
  }

  private formatLastChangeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 1000) return 'now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  private updateSelection(selectedNodeId: string | null): void {
    if (!this.g) return;

    this.g.selectAll('.graph-node')
      .classed('selected', (d: any) => d.id === selectedNodeId);
  }

  private updateActiveStates(activeNodeIds: Set<string>): void {
    if (!this.g) return;

    // Track newly activated nodes for flow animation
    const currentlyActive = new Set(this.flattenedNodes().filter(n => n.isActive).map(n => n.id));
    const newlyActive = new Set([...activeNodeIds].filter(id => !currentlyActive.has(id)));
    
    // Update node colors and sizes for active states only
    this.g.selectAll('.graph-node')
      .select('rect')
      .transition()
      .duration(300)
      .ease(d3.easeBackOut)
      .attr('fill', (d: any) => {
        const node = d as GraphNode;
        node.isActive = activeNodeIds.has(node.id);
        return this.getNodeGradient(node);
      })
      .attr('stroke', (d: any) => {
        const node = d as GraphNode;
        node.isActive = activeNodeIds.has(node.id);
        return this.getNodeBorderColor(node);
      })
      .attr('width', (d: any) => {
        const sizeConfig = this.getNodeSizeConfig();
        return activeNodeIds.has(d.id) ? sizeConfig.width * 1.1 : sizeConfig.width;
      })
      .attr('height', (d: any) => {
        const sizeConfig = this.getNodeSizeConfig();
        return activeNodeIds.has(d.id) ? sizeConfig.height * 1.1 : sizeConfig.height;
      })
      .attr('x', (d: any) => {
        const sizeConfig = this.getNodeSizeConfig();
        const width = activeNodeIds.has(d.id) ? sizeConfig.width * 1.1 : sizeConfig.width;
        return -width / 2;
      })
      .attr('y', (d: any) => {
        const sizeConfig = this.getNodeSizeConfig();
        const height = activeNodeIds.has(d.id) ? sizeConfig.height * 1.1 : sizeConfig.height;
        return -height / 2;
      });

    // Update change detection counts in real-time
    this.g.selectAll('.graph-node')
      .select('.graph-count')
      .text((d: any) => {
        return `CD: ${d.originalNode.changeDetectionCount}`;
      });

    // Update time stamps for active nodes
    this.g.selectAll('.graph-node')
      .select('.graph-time')
      .text((d: any) => {
        if (d.originalNode.lastChangeDetectionTime) {
          return this.formatLastChangeTime(d.originalNode.lastChangeDetectionTime);
        }
        return '';
      });
      
    // Trigger flow animations for newly active nodes
    newlyActive.forEach(nodeId => {
      this.animateFlowToNode(nodeId);
    });
  }

  private dragStarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>): void {
    // Disable drag functionality for stable hierarchical layout
    event.sourceEvent.preventDefault();
  }

  private dragged(): void {
    // Disabled
  }

  private dragEnded(): void {
    // Disabled
  }




  private buildPropagationMap(nodes: ComponentNode[]): Map<string, number> {
    const propagationMap = new Map<string, number>();
    
    // Find trigger sources (nodes with triggerSource but no propagatedFrom)
    const triggerSources = nodes.filter(node => 
      node.triggerSource && !node.propagatedFrom
    );
    
    // BFS to calculate propagation depth
    const queue: Array<{nodeId: string, depth: number}> = [];
    const visited = new Set<string>();
    
    triggerSources.forEach(source => {
      queue.push({ nodeId: source.id, depth: 0 });
      propagationMap.set(source.id, 0);
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      
      // Find nodes that were propagated from this node
      const propagatedNodes = nodes.filter(node => 
        node.propagatedFrom === current.nodeId
      );
      
      propagatedNodes.forEach(node => {
        const newDepth = current.depth + 1;
        propagationMap.set(node.id, newDepth);
        queue.push({ nodeId: node.id, depth: newDepth });
      });
    }
    
    return propagationMap;
  }
  
  private createLinkPath(link: GraphLink, positions: Map<string, {x: number, y: number}>): string {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const sourcePos = positions.get(sourceId);
    const targetPos = positions.get(targetId);
    
    if (!sourcePos || !targetPos) return '';
    
    // Create smooth bezier curve like React Flow
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const curvature = link.isPropagationPath ? 0.4 : 0.3;
    
    // Control points for smooth curve
    const c1x = sourcePos.x + dx * curvature;
    const c1y = sourcePos.y;
    const c2x = targetPos.x - dx * curvature;
    const c2y = targetPos.y;
    
    return `M ${sourcePos.x},${sourcePos.y} C ${c1x},${c1y} ${c2x},${c2y} ${targetPos.x},${targetPos.y}`;
  }
  
  private createArrowHead(link: GraphLink, positions: Map<string, {x: number, y: number}>): string {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const targetPos = positions.get(targetId);
    const sourcePos = positions.get(sourceId);
    
    if (!sourcePos || !targetPos) return '';
    
    // Calculate arrow position and angle
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const angle = Math.atan2(dy, dx);
    
    // Arrow dimensions
    const arrowLength = 8;
    const arrowWidth = 6;
    
    // Calculate arrow points
    const x1 = targetPos.x - arrowLength * Math.cos(angle - Math.PI / 6);
    const y1 = targetPos.y - arrowLength * Math.sin(angle - Math.PI / 6);
    const x2 = targetPos.x - arrowLength * Math.cos(angle + Math.PI / 6);
    const y2 = targetPos.y - arrowLength * Math.sin(angle + Math.PI / 6);
    
    return `M ${targetPos.x},${targetPos.y} L ${x1},${y1} L ${x2},${y2} Z`;
  }
  
  private getLinkColor(link: GraphLink): string {
    if (!link.isPropagationPath) return '#e5e7eb';
    return this.getTriggerColor(link.triggerType, 0.8);
  }
  
  private getTriggerColor(triggerType?: string, opacity = 1): string {
    const colors = {
      'user-interaction': '#3b82f6', // Blue
      'signal-update': '#10b981',    // Emerald  
      'async-operation': '#f59e0b',  // Amber
      'input-change': '#8b5cf6',     // Purple
      'manual': '#6b7280',           // Gray
      'unknown': '#9ca3af'           // Light gray
    };
    
    const color = colors[triggerType as keyof typeof colors] || colors.unknown;
    return opacity < 1 ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : color;
  }
  
  private getTriggerIcon(triggerType?: string): string {
    const icons = {
      'user-interaction': '👆',
      'signal-update': '⚡',
      'async-operation': '⏳',
      'input-change': '📥',
      'manual': '🔧',
      'unknown': '❓'
    };
    
    return icons[triggerType as keyof typeof icons] || icons.unknown;
  }
  
  private getTriggerDescription(trigger: any): string {
    if (trigger.details?.description) {
      return trigger.details.description.length > 12 
        ? trigger.details.description.substring(0, 12) + '...'
        : trigger.details.description;
    }
    
    switch (trigger.type) {
      case 'user-interaction':
        return trigger.details?.event ? `${trigger.details.event}` : 'User Click';
      case 'signal-update':
        return trigger.details?.signalName ? `${trigger.details.signalName}` : 'Signal';
      case 'async-operation':
        return trigger.details?.asyncType ? `${trigger.details.asyncType}` : 'Async';
      case 'input-change':
        return trigger.details?.inputProperty ? `@${trigger.details.inputProperty}` : 'Input';
      case 'manual':
        return 'Manual';
      default:
        return 'Unknown';
    }
  }

  private animateFlowToNode(targetNodeId: string): void {
    // Find the root trigger node for this activation
    const triggerNodes = this.flattenedNodes().filter(n => 
      n.triggerSource && !n.propagatedFrom
    );
    
    if (triggerNodes.length === 0) return;
    
    // Start animation from the trigger source
    const rootTrigger = triggerNodes[0];
    this.activateNode(rootTrigger.id);
  }
  
  private animateSingleLink(linkGroup: d3.Selection<any, any, any, any>, linkData: GraphLink): void {
    const pathElement = linkGroup.select('.graph-link-path').node() as SVGPathElement;
    const flowDot = linkGroup.select('.flow-dot');
    const glowDot = linkGroup.select('.flow-dot-glow');
    
    if (!pathElement || flowDot.empty()) return;
    
    const pathLength = pathElement.getTotalLength();
    const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
    
    // Reset any existing animations
    const linkId = `${typeof linkData.source === 'string' ? linkData.source : linkData.source.id}-${targetId}`;
    if (this.propagationAnimations.has(linkId)) {
      this.propagationAnimations.get(linkId)!.stop();
    }
    
    // Show dots
    flowDot.attr('opacity', 1);
    glowDot.attr('opacity', 1);
    
    // Animate dot along path
    const duration = 800; // Animation duration in ms
    
    const timer = d3.timer((elapsed) => {
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = d3.easeCubicOut(progress);
      
      const point = pathElement.getPointAtLength(easeProgress * pathLength);
      
      flowDot
        .attr('cx', point.x)
        .attr('cy', point.y);
        
      glowDot
        .attr('cx', point.x)
        .attr('cy', point.y);
      
      if (progress >= 1) {
        timer.stop();
        
        // Trigger node activation when dot reaches target
        this.activateNode(targetId);
        
        // Hide dots after reaching target
        setTimeout(() => {
          flowDot.transition().duration(300).attr('opacity', 0);
          glowDot.transition().duration(300).attr('opacity', 0);
          this.propagationAnimations.delete(linkId);
        }, 500);
      }
    });
    
    this.propagationAnimations.set(linkId, timer);
  }
  
  private activateNode(nodeId: string): void {
    if (!this.g) return;
    
    // Find and animate the target node
    const nodeGroup = this.g.selectAll('.graph-node')
      .filter((d: any) => d.id === nodeId);
    
    if (nodeGroup.empty()) return;
    
    const nodeRect = nodeGroup.select('rect');
    
    // Create pulsing effect on node activation
    nodeRect
      .transition()
      .duration(200)
      .ease(d3.easeBackOut)
      .attr('stroke-width', 4)
      .style('filter', 'drop-shadow(0 6px 20px rgba(59,130,246,0.5))')
      .transition()
      .duration(400)
      .ease(d3.easeBackOut)
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))');
    
    // Update node state to active
    this.componentTreeService.updateComponentActivity(nodeId, true);
    
    // Schedule next propagation after node activation
    setTimeout(() => {
      this.propagateFromNode(nodeId);
    }, 300);
  }
  
  private propagateFromNode(sourceNodeId: string): void {
    if (!this.linkElements) return;
    
    // Find outgoing links from this node
    const outgoingLinks = this.linkElements.filter((d: GraphLink) => {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      return sourceId === sourceNodeId;
    });
    
    // Animate each outgoing link with slight delays
    outgoingLinks.each((linkData: GraphLink, i: number, nodes: SVGGElement[] | ArrayLike<SVGGElement>) => {
      const linkGroup = d3.select(nodes[i]);
      
      setTimeout(() => {
        this.animateSingleLink(linkGroup, linkData);
      }, i * 100); // 100ms delay between multiple outgoing links
    });
  }
  
  private findPathToRoot(nodeId: string): string[] {
    const path: string[] = [];
    const node = this.flattenedNodes().find(n => n.id === nodeId);
    
    if (!node) return path;
    
    let current: ComponentNode | null = node;
    while (current) {
      path.unshift(current.id);
      current = current.parent;
    }
    
    return path;
  }

  private getNodeSizeConfig() {
    return { width: 140, height: 90, spacing: 180, levelHeight: 160 };
  }
  
  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    
    // Clean up any running animations
    this.propagationAnimations.forEach(timer => timer.stop());
    this.propagationAnimations.clear();
  }

}