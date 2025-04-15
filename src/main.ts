// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 600 });

// Interface for Design System Metrics
interface DesignSystemMetrics {
  componentUsage: Map<string, number>;
  tokenUsage: Map<string, number>;
  inconsistencies: DesignSystemIssue[];
  adoption: {
    total: number;
    byTeam: Map<string, number>;
  };
}

interface DesignSystemIssue {
  type: 'component' | 'style' | 'token';
  message: string;
  nodeId: string;
  severity: 'high' | 'medium' | 'low';
}

// Function to collect metrics
function collectMetrics(): DesignSystemMetrics {
  const metrics: DesignSystemMetrics = {
    componentUsage: new Map(),
    tokenUsage: new Map(),
    inconsistencies: [],
    adoption: {
      total: 0,
      byTeam: new Map()
    }
  };

  // Traverse all pages
  figma.root.children.forEach((page) => {
    // Traverse all nodes in the page
    page.children.forEach(node => {
      traverseNodes(node, metrics);
    });
  });

  return metrics;
}

// Function to traverse nodes and collect data
function traverseNodes(node: SceneNode, metrics: DesignSystemMetrics) {
  // Check if node is a component instance
  if (node.type === 'INSTANCE' && node.mainComponent) {
    const componentName = node.mainComponent.name;
    metrics.componentUsage.set(
      componentName,
      (metrics.componentUsage.get(componentName) || 0) + 1
    );
  }

  // Check for style usage
  if ('fills' in node && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID') {
        const color = `${fill.color.r},${fill.color.g},${fill.color.b}`;
        metrics.tokenUsage.set(
          color,
          (metrics.tokenUsage.get(color) || 0) + 1
        );
      }
    });
  }

  // Check for text styles
  if (node.type === 'TEXT' && node.textStyleId) {
    const style = figma.getStyleById(node.textStyleId);
    if (style) {
      metrics.tokenUsage.set(
        style.name,
        (metrics.tokenUsage.get(style.name) || 0) + 1
      );
    }
  }

  // Check for inconsistencies
  checkInconsistencies(node, metrics);

  // Recursively check children
  if ('children' in node) {
    node.children.forEach(child => traverseNodes(child, metrics));
  }
}

// Function to check for design system inconsistencies
function checkInconsistencies(node: SceneNode, metrics: DesignSystemMetrics) {
  // Example checks - can be expanded based on your design system rules
  if (node.type === 'TEXT') {
    if (!node.textStyleId) {
      metrics.inconsistencies.push({
        type: 'style',
        message: 'Text without style',
        nodeId: node.id,
        severity: 'medium'
      });
    }
  }

  if (node.type === 'FRAME') {
    if (!node.layoutMode) {
      metrics.inconsistencies.push({
        type: 'component',
        message: 'Frame without layout mode',
        nodeId: node.id,
        severity: 'low'
      });
    }
  }
}

// Helper function to convert Map to Object
function mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'collect-metrics') {
    const metrics = collectMetrics();
    figma.ui.postMessage({
      type: 'metrics-data',
      data: {
        componentUsage: mapToObject(metrics.componentUsage),
        tokenUsage: mapToObject(metrics.tokenUsage),
        inconsistencies: metrics.inconsistencies,
        adoption: {
          total: metrics.adoption.total,
          byTeam: mapToObject(metrics.adoption.byTeam)
        }
      }
    });
  }

  if (msg.type === 'analyze-design-system') {
    const nodes = figma.currentPage.selection;
    
    if (nodes.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select at least one node to analyze'
      });
      return;
    }

    const analysis = {
      totalNodes: nodes.length,
      components: [],
      styles: [],
      inconsistencies: []
    };

    // Analyze each selected node
    for (const node of nodes) {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        analysis.components.push({
          name: node.name,
          type: node.type
        });
      }

      // Check for style inconsistencies
      if ('fills' in node) {
        const fills = node.fills as ReadonlyArray<Paint>;
        for (const fill of fills) {
          if (fill.type === 'SOLID') {
            analysis.styles.push({
              type: 'fill',
              color: {
                r: fill.color.r,
                g: fill.color.g,
                b: fill.color.b,
                a: fill.opacity
              }
            });
          }
        }
      }
    }

    // Send analysis results back to UI
    figma.ui.postMessage({
      type: 'analysis-results',
      data: analysis
    });
  }
};
